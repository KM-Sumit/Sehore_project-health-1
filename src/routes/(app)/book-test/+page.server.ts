import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { tests, testBookings, testBookingItems, payments } from '$lib/server/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { testBookingSchema } from '$lib/schemas';
import { createOrder } from '$lib/server/payment';

export const load: PageServerLoad = async () => {
	let allTests: any[] = [];
	try {
		allTests = await db.query.tests.findMany({
			where: eq(tests.isActive, true),
			orderBy: (tests, { asc }) => [asc(tests.category), asc(tests.name)]
		});
	} catch (err) {
		console.warn('DB query failed for tests:', err);
	}

	return { tests: allTests };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) {
			throw redirect(303, '/login?redirectTo=/book-test');
		}

		const formData = await request.formData();
		const patientName = String(formData.get('patientName') || '').trim();
		const patientPhone = String(formData.get('patientPhone') || '').trim();
		const patientAge = parseInt(String(formData.get('patientAge') || '0'), 10);
		const patientGender = String(formData.get('patientGender') || '');
		const address = String(formData.get('address') || '').trim();
		const collectionDate = String(formData.get('collectionDate') || '').trim();
		const collectionSlot = String(formData.get('collectionSlot') || '');
		const rawTestIds = formData.getAll('testIds').map(String);

		const parsed = testBookingSchema.safeParse({
			patientName,
			patientPhone,
			patientAge,
			patientGender,
			address,
			testIds: rawTestIds,
			collectionDate,
			collectionSlot
		});

		if (!parsed.success) {
			const errors = parsed.error.flatten().fieldErrors;
			const firstError = Object.values(errors)[0]?.[0] || 'Please complete all required fields';
			return fail(400, {
				error: firstError,
				values: {
					patientName,
					patientPhone,
					patientAge,
					patientGender,
					address,
					collectionDate,
					collectionSlot,
					testIds: rawTestIds
				}
			});
		}

		// ── Validate test IDs exist in DB and calculate total from DB prices ──
		let total = 0;
		const validTestIds: string[] = [];

		try {
			const dbTests = await db
				.select({ id: tests.id, price: tests.price, isActive: tests.isActive })
				.from(tests)
				.where(and(inArray(tests.id, rawTestIds), eq(tests.isActive, true)));

			const testPriceMap = new Map(dbTests.map((t) => [t.id, Number(t.price)]));

			for (const id of rawTestIds) {
				const price = testPriceMap.get(id);
				if (price !== undefined) {
					total += price;
					validTestIds.push(id);
				}
			}
		} catch (err) {
			console.warn('DB test price lookup failed:', err);
			return fail(500, { error: 'Unable to load test prices. Please try again.' });
		}

		if (validTestIds.length === 0) {
			return fail(400, { error: 'No valid tests selected' });
		}

		// ── Create booking ──
		const bookingId = crypto.randomUUID();

		let orderId: string | null = null;
		let paymentId: string | null = null;

		try {
			// Try creating Razorpay order if configured
			try {
				const order = await createOrder(total, `order_${bookingId}`);
				orderId = order.id;
			} catch (err) {
				console.warn('Razorpay order skipped:', err);
			}

			// Insert payment record (status: created — not paid yet)
			const [payment] = await db
				.insert(payments)
				.values({
					userId: locals.user.id,
					amount: total.toFixed(2),
					type: 'test',
					razorpayOrderId: orderId,
					status: 'created'
				})
				.returning();

			paymentId = payment?.id ?? null;

			// Insert test booking with status: pending (awaiting payment)
			const [booking] = await db
				.insert(testBookings)
				.values({
					userId: locals.user.id,
					patientName,
					patientPhone,
					patientAge,
					patientGender,
					address,
					collectionDate,
					collectionSlot,
					status: 'pending',
					totalAmount: total.toFixed(2),
					paymentId
				})
				.returning();

			// Insert test booking items
			for (const testId of validTestIds) {
				await db.insert(testBookingItems).values({
					bookingId: booking.id,
					testId
				});
			}
		} catch (e) {
			console.error('Test booking error:', e);
			return fail(500, { error: 'Failed to create booking. Please try again.' });
		}

		return {
			success: true,
			bookingId: bookingId,
			patientName,
			totalAmount: total,
			testCount: validTestIds.length,
			collectionDate,
			collectionSlot,
			orderId,
			message: 'Booking created. Complete payment to confirm.'
		};
	}
};
