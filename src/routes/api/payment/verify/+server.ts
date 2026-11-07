import { json } from '@sveltejs/kit';
import { verifyPayment } from '$lib/server/payment';
import { db } from '$lib/server/db';
import { payments, appointments, testBookings, users } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId, type } =
			body as {
				razorpay_order_id?: string;
				razorpay_payment_id?: string;
				razorpay_signature?: string;
				bookingId?: string;
				type?: 'test' | 'appointment';
			};

		// Validate required fields
		if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
			return json({ error: 'Missing payment parameters' }, { status: 400 });
		}

		if (!bookingId || !type) {
			return json({ error: 'Missing booking ID or type' }, { status: 400 });
		}

		// ── Verify Razorpay signature ──
		// No fallback — if verification fails, payment is rejected
		const isValid = await verifyPayment(
			razorpay_order_id,
			razorpay_payment_id,
			razorpay_signature
		);

		if (!isValid) {
			return json({ error: 'Invalid payment signature' }, { status: 400 });
		}

		// ── Verify payment record exists and belongs to user ──
		const [paymentRecord] = await db
			.select()
			.from(payments)
			.where(eq(payments.razorpayOrderId, razorpay_order_id));

		if (!paymentRecord) {
			return json({ error: 'Payment record not found' }, { status: 404 });
		}

		// Authorization: user can only verify their own payments; admins can verify all
		if (locals.user.role !== 'admin' && paymentRecord.userId !== locals.user.id) {
			return json({ error: 'Unauthorized: payment does not belong to you' }, { status: 403 });
		}

		// ── Update payment status ──
		await db
			.update(payments)
			.set({ status: 'paid', razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature })
			.where(eq(payments.id, paymentRecord.id));

		// ── Update booking/appointment status ──
		if (type === 'test' && bookingId) {
			const [booking] = await db.select().from(testBookings).where(eq(testBookings.id, bookingId));
			if (booking && booking.userId === paymentRecord.userId) {
				await db.update(testBookings).set({ status: 'confirmed' }).where(eq(testBookings.id, bookingId));
			}
		} else if (type === 'appointment' && bookingId) {
			const [appt] = await db.select().from(appointments).where(eq(appointments.id, bookingId));
			if (appt && appt.userId === paymentRecord.userId) {
				await db.update(appointments).set({ status: 'confirmed' }).where(eq(appointments.id, bookingId));
			}
		}

		return json({ success: true, message: 'Payment verified successfully' });
	} catch (err) {
		console.error('Payment verification error:', err);
		return json({ error: 'Verification failed' }, { status: 500 });
	}
};
