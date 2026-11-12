import { json } from '@sveltejs/kit';
import { createScopedPaymentProof, createOrder } from '$lib/server/payment';
import { getAuthoritativeAppointmentPricing } from '$lib/server/appointments';
import { db } from '$lib/server/db';
import { tests } from '$lib/server/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { MOCK_TESTS } from '$lib/server/mockData';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const { amount, receipt, doctorId, testIds } = await request.json();

		let payableAmount = Number(amount);
		let pricing: Awaited<ReturnType<typeof getAuthoritativeAppointmentPricing>> = null;
		let proofScopeId = '';

		if (doctorId && typeof doctorId === 'string') {
			pricing = await getAuthoritativeAppointmentPricing(doctorId, locals.user);
			if (!pricing) {
				return json({ error: 'Doctor not found' }, { status: 404 });
			}
			payableAmount = pricing.finalFee;
			proofScopeId = doctorId;
		} else if (Array.isArray(testIds) && testIds.length > 0) {
			const cleanIds = testIds.map(String);
			let priceMap = new Map<string, number>();

			try {
				const dbTests = await db
					.select({ id: tests.id, price: tests.price })
					.from(tests)
					.where(and(inArray(tests.id, cleanIds), eq(tests.isActive, true)));
				if (dbTests.length > 0) {
					priceMap = new Map(dbTests.map((t) => [t.id, Number(t.price)]));
				}
			} catch (err) {
				console.warn('Test price DB lookup fallback to mock catalog:', err);
			}

			if (priceMap.size === 0) {
				priceMap = new Map(MOCK_TESTS.filter((t) => t.isActive).map((t) => [t.id, Number(t.price)]));
			}

			let sum = 0;
			const resolvedIds: string[] = [];
			for (const id of cleanIds) {
				const p = priceMap.get(id);
				if (p !== undefined) {
					sum += p;
					resolvedIds.push(id);
				}
			}

			if (resolvedIds.length === 0 || sum <= 0) {
				return json({ error: 'No valid tests selected' }, { status: 400 });
			}

			payableAmount = sum;
			proofScopeId = `tests:${resolvedIds.slice().sort().join(',')}`;
		}

		if (!payableAmount || payableAmount <= 0) {
			return json({ error: 'Invalid amount' }, { status: 400 });
		}

		const orderReceipt = receipt || `rcpt_${Date.now()}`;
		let order: { id: string; amount: number; currency: string; receipt: string; status: string };

		try {
			order = await createOrder(payableAmount, orderReceipt);
		} catch (err) {
			console.warn('Razorpay order fallback:', err);
			order = {
				id: `order_mock_${Date.now()}`,
				amount: Math.round(payableAmount * 100),
				currency: 'INR',
				receipt: orderReceipt,
				status: 'created'
			};
		}

		const demoPaymentId = `TXN-DEMO-${Date.now().toString().slice(-6)}`;
		const paymentSignature = proofScopeId
			? await createScopedPaymentProof({
					orderId: order.id,
					paymentId: demoPaymentId,
					amount: payableAmount,
					scopeId: proofScopeId
				})
			: undefined;

		return json({
			...order,
			paymentId: demoPaymentId,
			paymentSignature,
			pricing
		});
	} catch (err) {
		console.error('Payment order creation error:', err);
		return json({ error: 'Failed to create payment order' }, { status: 500 });
	}
};

