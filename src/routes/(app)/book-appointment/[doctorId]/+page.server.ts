import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { doctors, doctorSlots, appointments, payments } from '$lib/server/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { MOCK_DOCTORS, getMockSlots } from '$lib/server/mockData';
import { adminStore } from '$lib/server/adminStore';
import { getAuthoritativeAppointmentPricing } from '$lib/server/appointments';
import { verifyAppointmentPaymentProof } from '$lib/server/payment';
import { registerUserAccount } from '$lib/server/auth/accounts';

export const load: PageServerLoad = async ({ params, url, locals }) => {
	const today = new Date().toISOString().split('T')[0];
	const referralCode = url.searchParams.get('ref') || url.searchParams.get('qr') || '';

	let doctor: any = null;

	try {
		const doc = await db.query.doctors.findFirst({
			where: and(eq(doctors.id, params.doctorId), eq(doctors.isActive, true)),
			with: {
				slots: {
					where: and(eq(doctorSlots.isBooked, false), gte(doctorSlots.date, today)),
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
		// Check if this doctor was created via admin panel (exists only in memory)
		const adminDoc = adminStore.getDoctorById(params.doctorId);
		if (adminDoc) {
			doctor = {
				id: adminDoc.id,
				name: adminDoc.name,
				specialty: adminDoc.specialty,
				qualification: adminDoc.qualification,
				experienceYears: adminDoc.experienceYears,
				consultationFee: adminDoc.consultationFee,
				bio: `${adminDoc.specialty} doctor`,
				imageUrl: null,
				isActive: true,
				slots: getMockSlots(adminDoc.id)
			};
		} else {
			const mockDoc = MOCK_DOCTORS.find((d) => d.id === params.doctorId) || MOCK_DOCTORS[0];
			doctor = {
				...mockDoc,
				slots: getMockSlots(mockDoc.id)
			};
		}
	}

	// Exclude any slots already booked in memory during this server lifecycle
	doctor = {
		...doctor,
		slots: (doctor.slots || []).filter((s: any) => !s.isBooked && !adminStore.isSlotBooked(s.id))
	};

	const adminDoc = adminStore.getDoctorById(doctor.id);
	const pricing = await getAuthoritativeAppointmentPricing(doctor.id, locals.user ?? null);

	return {
		doctor,
		user: locals.user ?? null,
		referralCode: referralCode || adminDoc?.qrCode || '',
		isQrReferral: Boolean(referralCode),
		doctorQrCode: adminDoc?.qrCode || `DOC-QR-${doctor.name.slice(3, 8).toUpperCase()}-101`,
		pricing: pricing ?? {
			originalFee: parseFloat(doctor.consultationFee || '500'),
			discountPercent: 0,
			discountAmount: 0,
			finalFee: parseFloat(doctor.consultationFee || '500'),
			previousBookingsCount: 0,
			isReturningMember: false
		}
	};
};

export const actions: Actions = {
	book: async ({ request, locals }) => {
		const formData = await request.formData();
		const rawData = {
			doctorId: String(formData.get('doctorId') || ''),
			slotId: String(formData.get('slotId') || ''),
			reason: String(formData.get('reason') || ''),
			patientName: String(formData.get('patientName') || locals.user?.name || '').trim(),
			patientPhone: String(formData.get('patientPhone') || locals.user?.phone || '').trim(),
			patientEmail: String(formData.get('patientEmail') || locals.user?.email || '').trim(),
			referralCode: String(formData.get('referralCode') || '').trim() || null,
			appointmentDate: String(formData.get('appointmentDate') || ''),
			appointmentTime: String(formData.get('appointmentTime') || ''),
			paymentMode: String(formData.get('paymentMode') || 'demo_online'),
			paymentOrderId: String(formData.get('paymentOrderId') || '').trim(),
			paymentId: String(formData.get('paymentId') || '').trim(),
			paymentSignature: String(formData.get('paymentSignature') || '').trim(),
			paymentMethod: String(formData.get('paymentMethod') || '').trim()
		};

		if (!rawData.patientName || rawData.patientName.length < 2) {
			return fail(400, { error: 'Please enter patient full name.' });
		}

		if (!rawData.patientPhone || rawData.patientPhone.replace(/\D/g, '').length < 10) {
			return fail(400, { error: 'Please enter a valid 10-digit mobile number.' });
		}

		if (!rawData.doctorId || !rawData.slotId || rawData.reason.trim().length < 3) {
			return fail(400, {
				error: 'Please select a valid consultation time slot and specify your symptoms/reason.'
			});
		}

		const pricing = await getAuthoritativeAppointmentPricing(rawData.doctorId, locals.user ?? null);
		if (!pricing) {
			return fail(400, { error: 'Doctor not found' });
		}

		// Prevent double-booking in both in-memory store and DB
		if (adminStore.isSlotBooked(rawData.slotId)) {
			return fail(409, { error: 'This time slot is already booked. Please select another.' });
		}

		try {
			const [existingSlot] = await db
				.select()
				.from(doctorSlots)
				.where(eq(doctorSlots.id, rawData.slotId));

			if (existingSlot && existingSlot.isBooked) {
				return fail(409, { error: 'This time slot is already booked. Please select another.' });
			}
		} catch (err) {
			console.warn('Slot availability DB check skipped:', err);
		}

		// Verify payment when online payment was selected
		let paymentStatus: 'paid' | 'pay_at_clinic' = 'pay_at_clinic';
		let resolvedPaymentMethod = 'Pay at Clinic';
		let resolvedPaymentId: string | undefined;

		if (rawData.paymentMode !== 'pay_at_clinic') {
			const isProofValid = await verifyAppointmentPaymentProof({
				orderId: rawData.paymentOrderId,
				paymentId: rawData.paymentId,
				amount: pricing.finalFee,
				doctorId: rawData.doctorId,
				signature: rawData.paymentSignature
			});

			if (!isProofValid) {
				return fail(400, {
					error: 'Payment verification failed or expired. Please complete payment to confirm your appointment.'
				});
			}

			paymentStatus = 'paid';
			resolvedPaymentMethod = rawData.paymentMethod || 'Demo Instant Payment';
			resolvedPaymentId = rawData.paymentId;
		}

		let apptDate = rawData.appointmentDate;
		let apptTime = rawData.appointmentTime;
		if (!apptDate || !apptTime) {
			const parts = rawData.slotId.split('-');
			if (parts.length >= 4) {
				apptDate = `${parts[parts.length - 4]}-${parts[parts.length - 3]}-${parts[parts.length - 2]}`;
			} else {
				apptDate = new Date().toISOString().split('T')[0];
			}
			apptTime = '10:00 AM';
		}

		const storedAppt = adminStore.createAppointment({
			userId: locals.user?.id ?? null,
			patientName: rawData.patientName,
			patientPhone: rawData.patientPhone,
			patientEmail: rawData.patientEmail || undefined,
			doctorId: rawData.doctorId,
			slotId: rawData.slotId,
			appointmentDate: apptDate,
			appointmentTime: apptTime,
			reason: rawData.reason.trim(),
			referralCode: rawData.referralCode,
			originalFee: pricing.originalFee,
			discountPercent: pricing.discountPercent,
			discountAmount: pricing.discountAmount,
			consultationFee: pricing.finalFee,
			paymentStatus,
			paymentMethod: resolvedPaymentMethod,
			paymentId: resolvedPaymentId
		});

		let appointmentId = storedAppt.id;

		try {
			await db
				.update(doctorSlots)
				.set({ isBooked: true })
				.where(eq(doctorSlots.id, rawData.slotId));
		} catch (err) {
			console.warn('Slot booking DB update skipped:', err);
		}

		try {
			const [payment] = await db
				.insert(payments)
				.values({
					userId: locals.user?.id ?? null,
					amount: pricing.finalFee.toFixed(2),
					type: 'appointment',
					status: paymentStatus === 'paid' ? 'paid' : 'created',
					razorpayOrderId: rawData.paymentOrderId || null,
					razorpayPaymentId: resolvedPaymentId || null,
					razorpaySignature: rawData.paymentSignature || null
				})
				.returning();

			const [appointment] = await db
				.insert(appointments)
				.values({
					userId: locals.user?.id ?? null,
					doctorId: rawData.doctorId,
					slotId: rawData.slotId,
					reason: rawData.reason.trim(),
					patientName: rawData.patientName,
					patientPhone: rawData.patientPhone,
					bookingSource: storedAppt.bookingSource,
					referralQrCode: storedAppt.referralQrCode,
					referringDoctorId: storedAppt.referralQrCode
						? adminStore.getDoctorByQrCode(storedAppt.referralQrCode)?.id ?? null
						: null,
					consultationFee: pricing.finalFee.toFixed(2),
					commissionAmount: storedAppt.commissionAmount.toFixed(2),
					status: paymentStatus === 'paid' ? 'confirmed' : 'pending',
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
			storeAppointmentId: storedAppt.id,
			doctorId: rawData.doctorId,
			doctorName: storedAppt.doctorName,
			doctorSpecialty: storedAppt.doctorSpecialty,
			originalFee: pricing.originalFee,
			discountPercent: pricing.discountPercent,
			discountAmount: pricing.discountAmount,
			consultationFee: storedAppt.consultationFee,
			slotId: rawData.slotId,
			bookingSource: storedAppt.bookingSource,
			referralQrCode: storedAppt.referralQrCode,
			patientName: rawData.patientName,
			patientPhone: rawData.patientPhone,
			patientEmail: rawData.patientEmail,
			appointmentDate: storedAppt.appointmentDate,
			appointmentTime: storedAppt.appointmentTime,
			paymentStatus: storedAppt.paymentStatus,
			paymentMethod: storedAppt.paymentMethod,
			paymentId: storedAppt.paymentId,
			isGuestBooking: !locals.user,
			message:
				paymentStatus === 'paid'
					? 'Payment received! Your appointment is confirmed.'
					: 'Appointment booked. Payment will be collected at the clinic.'
		};
	},

	createAccount: async ({ request, cookies }) => {
		const formData = await request.formData();
		const name = String(formData.get('name') || '').trim();
		const email = String(formData.get('email') || '').trim().toLowerCase();
		const phone = String(formData.get('phone') || '').trim();
		const password = String(formData.get('password') || '');
		const confirmPassword = String(formData.get('confirmPassword') || '');
		const appointmentId = String(formData.get('appointmentId') || '').trim() || null;
		const storeAppointmentId = String(formData.get('storeAppointmentId') || '').trim() || null;

		const appt =
			(storeAppointmentId ? adminStore.getAppointmentById(storeAppointmentId) : null) ||
			(appointmentId ? adminStore.getAppointmentById(appointmentId) : null);

		const result = await registerUserAccount(
			{ name, email, phone, password, confirmPassword, appointmentId: storeAppointmentId || appointmentId },
			{ request, cookies }
		);

		if (!result.ok) {
			return fail(result.status, {
				accountError: result.error,
				accountName: name,
				accountEmail: email,
				accountPhone: phone,
				// Preserve receipt display when validation fails on optional account form
				...(appt
					? {
							success: true,
							appointmentId: appointmentId || appt.id,
							storeAppointmentId: appt.id,
							doctorId: appt.doctorId,
							doctorName: appt.doctorName,
							doctorSpecialty: appt.doctorSpecialty,
							originalFee: appt.originalFee ?? appt.consultationFee,
							discountPercent: appt.discountPercent ?? 0,
							discountAmount: appt.discountAmount ?? 0,
							consultationFee: appt.consultationFee,
							slotId: appt.slotId,
							bookingSource: appt.bookingSource,
							referralQrCode: appt.referralQrCode,
							patientName: appt.patientName,
							patientPhone: appt.patientPhone,
							patientEmail: appt.patientEmail || email,
							appointmentDate: appt.appointmentDate,
							appointmentTime: appt.appointmentTime,
							paymentStatus: appt.paymentStatus,
							paymentMethod: appt.paymentMethod,
							paymentId: appt.paymentId,
							isGuestBooking: true
						}
					: {})
			});
		}

		return {
			success: true,
			accountCreated: true,
			createdUserEmail: result.user.email,
			linkedAppointments: result.linkedAppointments,
			...(appt
				? {
						appointmentId: appointmentId || appt.id,
						storeAppointmentId: appt.id,
						doctorId: appt.doctorId,
						doctorName: appt.doctorName,
						doctorSpecialty: appt.doctorSpecialty,
						originalFee: appt.originalFee ?? appt.consultationFee,
						discountPercent: appt.discountPercent ?? 0,
						discountAmount: appt.discountAmount ?? 0,
						consultationFee: appt.consultationFee,
						slotId: appt.slotId,
						bookingSource: appt.bookingSource,
						referralQrCode: appt.referralQrCode,
						patientName: appt.patientName,
						patientPhone: appt.patientPhone,
						patientEmail: appt.patientEmail || email,
						appointmentDate: appt.appointmentDate,
						appointmentTime: appt.appointmentTime,
						paymentStatus: appt.paymentStatus,
						paymentMethod: appt.paymentMethod,
						paymentId: appt.paymentId,
						isGuestBooking: false
					}
				: {})
		};
	}
};
