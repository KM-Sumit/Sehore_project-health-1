import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { doctors, doctorSlots, appointments, payments } from '$lib/server/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { MOCK_DOCTORS, getMockSlots } from '$lib/server/mockData';
import { adminStore } from '$lib/server/adminStore';

export const load: PageServerLoad = async ({ params, url, locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login?redirectTo=/book-appointment/' + params.doctorId);
	}

	const today = new Date().toISOString().split('T')[0];
	const referralCode = url.searchParams.get('ref') || url.searchParams.get('qr') || '';

	let doctor: any = null;

	try {
		const doc = await db.query.doctors.findFirst({
			where: and(eq(doctors.id, params.doctorId), eq(doctors.isActive, true)),
			with: {
				slots: {
					where: and(
						eq(doctorSlots.isBooked, false),
						gte(doctorSlots.date, today)
					),
					orderBy: (slots, { asc }) => [asc(slots.date), asc(slots.startTime)]
				}
			}
		});

		if (doc) {
			doctor = doc;
		}
	} catch (err) {
		console.warn('DB load doctor failed, checking mock catalog:', err);
	}

	if (!doctor) {
		const mockDoc = MOCK_DOCTORS.find((d) => d.id === params.doctorId) || MOCK_DOCTORS[0];
		doctor = {
			...mockDoc,
			slots: getMockSlots(mockDoc.id)
		};
	}

	// Lookup doctor in adminStore to get QR details
	const adminDoc = adminStore.getDoctorById(doctor.id);

	return {
		doctor,
		user: locals.user ?? null,
		referralCode: referralCode || adminDoc?.qrCode || '',
		isQrReferral: Boolean(referralCode),
		doctorQrCode: adminDoc?.qrCode || `DOC-QR-${doctor.name.slice(3, 8).toUpperCase()}-101`
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Authentication required' });
		}

		const formData = await request.formData();
		const rawData = {
			doctorId: String(formData.get('doctorId') || ''),
			slotId: String(formData.get('slotId') || ''),
			reason: String(formData.get('reason') || ''),
			patientName: String(formData.get('patientName') || locals.user.name || '').trim(),
			patientPhone: String(formData.get('patientPhone') || locals.user.phone || '').trim(),
			patientEmail: String(formData.get('patientEmail') || locals.user.email || '').trim(),
			referralCode: String(formData.get('referralCode') || '').trim() || null,
			appointmentDate: String(formData.get('appointmentDate') || ''),
			appointmentTime: String(formData.get('appointmentTime') || '')
			// NOTE: paymentMethod, paymentStatus, paymentId are NOT accepted from client — set server-side
		};

		// ── Validation ──
		if (!rawData.patientName || rawData.patientName.length < 2) {
			return fail(400, { error: 'Please enter patient full name.' });
		}

		if (!rawData.patientPhone || rawData.patientPhone.length < 10) {
			return fail(400, { error: 'Please enter a valid 10-digit mobile number.' });
		}

		if (!rawData.doctorId || !rawData.slotId || rawData.reason.length < 3) {
			return fail(400, {
				error: 'Please select a valid consultation time slot and specify your symptoms/reason.'
			});
		}

		// ── Find doctor details ──
		const doc = adminStore.getDoctorById(rawData.doctorId) || MOCK_DOCTORS.find((d) => d.id === rawData.doctorId);
		if (!doc) {
			return fail(400, { error: 'Doctor not found' });
		}
		const fee = parseFloat(doc.consultationFee || '500');

		// ── Check slot availability (prevent double-booking) ──
		let slotIsAvailable = true;
		try {
			const [existingSlot] = await db
				.select()
				.from(doctorSlots)
				.where(eq(doctorSlots.id, rawData.slotId));

			if (existingSlot && existingSlot.isBooked) {
				return fail(409, { error: 'This time slot is already booked. Please select another.' });
			}
		} catch (err) {
			// If DB unavailable, proceed with adminStore (in-memory) — but warn
			console.warn('Slot availability DB check skipped:', err);
		}

		// ── Parse date/time from slot if not provided directly ──
		let apptDate = rawData.appointmentDate;
		let apptTime = rawData.appointmentTime;
		if (!apptDate || !apptTime) {
			const parts = rawData.slotId.split('-');
			if (parts.length >= 3) {
				apptDate = `${parts[parts.length - 3]}-${parts[parts.length - 2]}-${parts[parts.length - 1]}`;
			} else {
				apptDate = new Date().toISOString().split('T')[0];
			}
			apptTime = '10:00 AM';
		}

		// ── Determine referral source ──
		let isQrReferral = false;
		let matchingDoc = doc;
		let matchedQrCode = rawData.referralCode;

		if (matchedQrCode) {
			const refDoc = adminStore.getDoctorByQrCode(matchedQrCode);
			if (refDoc) {
				isQrReferral = true;
				matchingDoc = refDoc;
			} else if (matchedQrCode.toUpperCase().startsWith('DOC-QR')) {
				isQrReferral = true;
			}
		}

		const commRate = isQrReferral ? (matchingDoc?.commissionRate ?? 15.0) : 0;
		const commAmount = isQrReferral ? (fee * commRate) / 100 : 0;

		// ── Record appointment (default: pay_at_clinic — NOT auto-paid) ──
		const storedAppt = adminStore.createAppointment({
			patientName: rawData.patientName,
			patientPhone: rawData.patientPhone,
			patientEmail: rawData.patientEmail,
			doctorId: rawData.doctorId,
			slotId: rawData.slotId,
			appointmentDate: apptDate,
			appointmentTime: apptTime,
			reason: rawData.reason,
			referralCode: rawData.referralCode,
			paymentStatus: 'pay_at_clinic', // Default: payment at clinic
			paymentMethod: 'Pay at Clinic',
			paymentId: undefined
		});

		let appointmentId = storedAppt.id;

		// ── Mark slot as booked ──
		try {
			await db
				.update(doctorSlots)
				.set({ isBooked: true })
				.where(eq(doctorSlots.id, rawData.slotId));
		} catch (err) {
			console.warn('Slot booking DB update skipped:', err);
		}

		// ── Persist to DB ──
		try {
			const [payment] = await db
				.insert(payments)
				.values({
					userId: locals.user.id,
					amount: fee.toFixed(2),
					type: 'appointment',
					status: 'created', // Not paid yet — will be updated by Razorpay verify
					razorpayOrderId: null,
					razorpayPaymentId: null,
					razorpaySignature: null
				})
				.returning();

			const [appointment] = await db
				.insert(appointments)
				.values({
					userId: locals.user.id,
					doctorId: rawData.doctorId,
					slotId: rawData.slotId,
					reason: rawData.reason,
					patientName: rawData.patientName,
					patientPhone: rawData.patientPhone,
					bookingSource: storedAppt.bookingSource,
					referralQrCode: storedAppt.referralQrCode,
					consultationFee: fee.toFixed(2),
					commissionAmount: commAmount.toFixed(2),
					status: 'pending', // Pending until payment at clinic or online
					paymentId: payment?.id ?? null
				})
				.returning();

			if (appointment?.id) {
				appointmentId = appointment.id;
			}
		} catch (dbErr) {
			console.warn('DB appointment save fallback to adminStore:', dbErr);
		}

		return {
			success: true,
			appointmentId,
			doctorId: rawData.doctorId,
			doctorName: storedAppt.doctorName,
			doctorSpecialty: storedAppt.doctorSpecialty,
			consultationFee: storedAppt.consultationFee,
			slotId: rawData.slotId,
			bookingSource: storedAppt.bookingSource,
			referralQrCode: storedAppt.referralQrCode,
			patientName: rawData.patientName,
			patientPhone: rawData.patientPhone,
			appointmentDate: storedAppt.appointmentDate,
			appointmentTime: storedAppt.appointmentTime,
			paymentStatus: storedAppt.paymentStatus,
			paymentMethod: storedAppt.paymentMethod,
			message: 'Appointment booked. Payment will be collected at the clinic.'
		};
	}
};
