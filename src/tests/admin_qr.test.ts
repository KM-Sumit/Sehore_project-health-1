import { describe, expect, it } from 'bun:test';
import { adminStore } from '../lib/server/adminStore';
import { generateQrDataUrl } from '../lib/server/qr';

describe('Doctor QR Referral & Admin Accounting', () => {
	it('initializes doctors with assigned unique QR codes and commission rates', () => {
		const doctors = adminStore.getAllDoctors();
		expect(doctors.length).toBeGreaterThanOrEqual(6);

		const drRajesh = doctors.find((d) => d.name.includes('Rajesh'));
		expect(drRajesh).toBeDefined();
		expect(drRajesh?.qrCode).toBe('DOC-QR-RAJESH-101');
		expect(drRajesh?.commissionRate).toBe(15.0);
	});

	it('generates high-resolution QR PNG Data URL', async () => {
		const qrDataUrl = await generateQrDataUrl('http://localhost:5173/book-appointment/11111111-1111-1111-1111-111111111101?ref=DOC-QR-RAJESH-101');
		expect(qrDataUrl).toMatch(/^data:image\/png;base64,/);
	});

	it('tracks a direct appointment without doctor QR referral (0% commission)', () => {
		const doc = adminStore.getAllDoctors()[0];

		const appt = adminStore.createAppointment({
			patientName: 'Test Direct Patient',
			patientPhone: '9876543210',
			doctorId: doc.id,
			slotId: `slot-${doc.id}-2026-11-10-1`,
			appointmentDate: '2026-11-10',
			appointmentTime: '10:00 AM',
			reason: 'Direct routine health checkup consultation',
			referralCode: null
		});

		expect(appt.bookingSource).toBe('direct');
		expect(appt.referralQrCode).toBeNull();
		expect(appt.commissionAmount).toBe(0);
	});

	it('tracks a doctor QR referred appointment with automatic commission calculation', () => {
		const drRajesh = adminStore.getAllDoctors().find((d) => d.name.includes('Rajesh'))!;
		const initialQrCount = adminStore.getAllAppointments({ doctorId: drRajesh.id, source: 'doctor_qr' }).length;

		const appt = adminStore.createAppointment({
			patientName: 'Test Referred Patient',
			patientPhone: '9812345678',
			doctorId: drRajesh.id,
			slotId: `slot-${drRajesh.id}-2026-11-10-2`,
			appointmentDate: '2026-11-10',
			appointmentTime: '11:00 AM',
			reason: 'Scanned Dr. Rajesh clinic standee for chest consultation',
			referralCode: drRajesh.qrCode
		});

		expect(appt.bookingSource).toBe('doctor_qr');
		expect(appt.referralQrCode).toBe(drRajesh.qrCode);

		// Fee is 800, 15% commission is 120
		const expectedCommission = (parseFloat(drRajesh.consultationFee) * drRajesh.commissionRate) / 100;
		expect(appt.commissionAmount).toBe(expectedCommission);

		const newQrCount = adminStore.getAllAppointments({ doctorId: drRajesh.id, source: 'doctor_qr' }).length;
		expect(newQrCount).toBe(initialQrCount + 1);
	});

	it('allows admin to regenerate a unique QR code for a doctor', () => {
		const drPriya = adminStore.getAllDoctors().find((d) => d.name.includes('Priya'))!;
		const newCode = adminStore.generateDoctorQrCode(drPriya.id);

		expect(newCode).toMatch(/^DOC-QR-/);
		expect(drPriya.qrCode).toBe(newCode);
	});

	it('allows admin to update appointment status from pending to confirmed', () => {
		const pendingList = adminStore.getAllAppointments({ status: 'pending' });
		expect(pendingList.length).toBeGreaterThan(0);

		const target = pendingList[0];
		const updated = adminStore.updateAppointmentStatus(target.id, 'confirmed');
		expect(updated).toBe(true);

		const refreshed = adminStore.getAppointmentById(target.id);
		expect(refreshed?.status).toBe('confirmed');
	});

	it('supports direct booking without sign-in and processes demo payment', () => {
		const doc = adminStore.getAllDoctors()[1]; // Dr. Priya

		// Guest user books and pays via demo gateway
		const guestAppt = adminStore.createAppointment({
			patientName: 'Guest Patient Anjali',
			patientPhone: '9876500000',
			patientEmail: 'anjali.guest@example.com',
			doctorId: doc.id,
			slotId: `slot-${doc.id}-2026-11-12-1`,
			appointmentDate: '2026-11-12',
			appointmentTime: '10:00 AM',
			reason: 'Direct guest booking skin allergy',
			paymentStatus: 'paid',
			paymentMethod: 'UPI (Demo Instant)',
			paymentId: 'TXN-DEMO-TEST1234'
		});

		expect(guestAppt.patientName).toBe('Guest Patient Anjali');
		expect(guestAppt.paymentStatus).toBe('paid');
		expect(guestAppt.status).toBe('confirmed');
		expect(guestAppt.paymentId).toBe('TXN-DEMO-TEST1234');
		expect(guestAppt.bookingSource).toBe('direct');
	});

	it('calculates aggregate admin metrics accurately', () => {
		const metrics = adminStore.getOverallMetrics();
		expect(metrics.totalAppointments).toBe(metrics.qrAppointmentsCount + metrics.directAppointmentsCount);
		expect(metrics.totalCommissionEarned).toBeGreaterThan(0);
	});
});

