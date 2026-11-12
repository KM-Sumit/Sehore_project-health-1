import { describe, expect, it } from 'bun:test';
import { adminStore, REPEAT_BOOKING_DISCOUNT_PERCENT } from '../lib/server/adminStore';

describe('Guest Appointment Booking, Optional Account Linking & Repeat Discount', () => {
	it('allows guest appointment creation after payment and marks slot booked', () => {
		const doc = adminStore.getAllDoctors()[0];
		const slotId = `slot-${doc.id}-guest-test-1`;

		expect(adminStore.isSlotBooked(slotId)).toBe(false);

		const guestAppt = adminStore.createAppointment({
			userId: null,
			patientName: 'Aarav Mehta',
			patientPhone: '9988776655',
			patientEmail: 'aarav.mehta@example.com',
			doctorId: doc.id,
			slotId,
			appointmentDate: '2026-11-15',
			appointmentTime: '10:00 AM',
			reason: 'Chest checkup',
			paymentStatus: 'paid',
			paymentMethod: 'UPI Demo (Google Pay)',
			paymentId: 'TXN-DEMO-889900'
		});

		expect(guestAppt.userId).toBeNull();
		expect(guestAppt.status).toBe('confirmed');
		expect(guestAppt.paymentStatus).toBe('paid');
		expect(adminStore.isSlotBooked(slotId)).toBe(true);
	});

	it('links prior guest bookings when user optionally creates an account and unlocks 2nd-time discount', () => {
		const doc = adminStore.getAllDoctors()[1];
		const newUserId = 'user-opt-123';
		const email = 'priya.guest.new@example.com';
		const phone = '9123456780';

		const firstAppt = adminStore.createAppointment({
			userId: null,
			patientName: 'Priya Nair',
			patientPhone: phone,
			patientEmail: email,
			doctorId: doc.id,
			slotId: `slot-${doc.id}-guest-link-1`,
			reason: 'Skin rash follow-up',
			paymentStatus: 'paid',
			paymentId: 'TXN-DEMO-112233'
		});

		expect(adminStore.hasPreviousBooking({ userId: newUserId })).toBe(false);

		const linked = adminStore.linkGuestAppointmentsToUser({
			userId: newUserId,
			email,
			phone,
			appointmentId: firstAppt.id
		});

		expect(linked).toBeGreaterThanOrEqual(1);
		expect(adminStore.hasPreviousBooking({ userId: newUserId, email, phone })).toBe(true);

		const history = adminStore.getAppointmentsForUser({ userId: newUserId });
		expect(history.some((a) => a.id === firstAppt.id)).toBe(true);

		const pricing = adminStore.calculateAppointmentPricing(800, true);
		expect(pricing.discountPercent).toBe(REPEAT_BOOKING_DISCOUNT_PERCENT);
		expect(pricing.discountAmount).toBe(120);
		expect(pricing.finalFee).toBe(680);
	});

	it('charges full fee without discount for first-time or guest appointments', () => {
		const pricing = adminStore.calculateAppointmentPricing(800, false);
		expect(pricing.originalFee).toBe(800);
		expect(pricing.discountPercent).toBe(0);
		expect(pricing.discountAmount).toBe(0);
		expect(pricing.finalFee).toBe(800);
	});

	it('creates guest blood test bookings and links them on optional account creation', () => {
		const booking = adminStore.createTestBooking({
			userId: null,
			patientName: 'Kiran Verma',
			patientPhone: '9876512345',
			patientEmail: 'kiran.test@example.com',
			patientAge: 34,
			patientGender: 'male',
			address: '12 Civil Lines, Sehore, MP 466001',
			collectionDate: '2026-11-16',
			collectionSlot: '8AM-10AM',
			totalAmount: 500,
			paymentStatus: 'paid',
			paymentMethod: 'UPI Demo (Google Pay)',
			paymentId: 'TXN-DEMO-554433',
			tests: [
				{ id: '22222222-2222-2222-2222-222222222201', name: 'Complete Blood Count (CBC)', price: '350.00', category: 'Routine' },
				{ id: '22222222-2222-2222-2222-222222222202', name: 'Blood Sugar (Fasting)', price: '150.00', category: 'Sugar' }
			]
		});

		expect(booking.status).toBe('confirmed');
		expect(booking.paymentStatus).toBe('paid');
		expect(booking.items.length).toBe(2);

		const linked = adminStore.linkGuestTestBookingsToUser({
			userId: 'user-test-789',
			email: 'kiran.test@example.com',
			phone: '9876512345',
			bookingId: booking.id
		});
		expect(linked).toBeGreaterThanOrEqual(1);

		const history = adminStore.getTestBookingsForUser({ userId: 'user-test-789' });
		expect(history.some((b) => b.id === booking.id)).toBe(true);
	});
});

