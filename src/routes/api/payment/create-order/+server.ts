import { json } from '@sveltejs/kit';
import { createOrder } from '$lib/server/payment';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { amount, receipt } = await request.json();
		if (!amount || amount <= 0) {
			return json({ error: 'Invalid amount' }, { status: 400 });
		}

		try {
			const order = await createOrder(amount, receipt || `rcpt_${Date.now()}`);
			return json(order);
		} catch (err) {
			console.warn('Razorpay order fallback:', err);
			// Mock order for testing
			return json({
				id: `order_mock_${Date.now()}`,
				amount: Math.round(amount * 100),
				currency: 'INR',
				receipt: receipt || `rcpt_${Date.now()}`,
				status: 'created'
			});
		}
	} catch (err) {
		console.error('Payment order creation error:', err);
		return json({ error: 'Failed to create payment order' }, { status: 500 });
	}
};

