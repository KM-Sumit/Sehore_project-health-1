import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { appointments, testBookings } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { adminStore } from '$lib/server/adminStore';
import { getUserBookingStatus } from '$lib/server/appointments';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(303, '/login?redirectTo=/dashboard');
	}

	let userAppointments: any[] = [];
	let userTestBookings: any[] = [];

	try {
		userAppointments = await db.query.appointments.findMany({
			where: eq(appointments.userId, locals.user.id),
			with: {
				doctor: true,
				slot: true
			},
			orderBy: desc(appointments.createdAt),
			limit: 20
		});

		userTestBookings = await db.query.testBookings.findMany({
			where: eq(testBookings.userId, locals.user.id),
			with: {
				items: {
					with: {
						test: true
					}
				}
			},
			orderBy: desc(testBookings.createdAt),
			limit: 10
		});
	} catch (err) {
		console.warn('Dashboard DB load failed:', err);
	}

	// Include appointments from in-memory adminStore matched by userId/email/phone
	const storeAppointments = adminStore
		.getAppointmentsForUser({
			userId: locals.user.id,
			email: locals.user.email,
			phone: locals.user.phone ?? null
		})
		.map((a) => ({
			id: a.id,
			status: a.status,
			reason: a.reason,
			consultationFee: a.consultationFee,
			originalFee: a.originalFee ?? a.consultationFee,
			discountPercent: a.discountPercent ?? 0,
			discountAmount: a.discountAmount ?? 0,
			paymentStatus: a.paymentStatus,
			paymentId: a.paymentId,
			doctor: {
				name: a.doctorName,
				specialty: a.doctorSpecialty,
				consultationFee: a.consultationFee.toFixed(2)
			},
			slot: {
				date: a.appointmentDate,
				startTime: a.appointmentTime
			},
			createdAt: a.createdAt
		}));

	const seenApptIds = new Set(userAppointments.map((a) => a.id));
	const mergedAppointments = [
		...userAppointments,
		...storeAppointments.filter((a) => !seenApptIds.has(a.id))
	];

	const storeTestBookings = adminStore
		.getTestBookingsForUser({
			userId: locals.user.id,
			email: locals.user.email,
			phone: locals.user.phone ?? null
		})
		.map((b) => ({
			id: b.id,
			patientName: b.patientName,
			patientPhone: b.patientPhone,
			patientAge: b.patientAge,
			patientGender: b.patientGender,
			address: b.address,
			collectionDate: b.collectionDate,
			collectionSlot: b.collectionSlot,
			status: b.status,
			totalAmount: b.totalAmount.toFixed(2),
			items: b.items,
			createdAt: b.createdAt
		}));

	const seenTestIds = new Set(userTestBookings.map((b) => b.id));
	const mergedTestBookings = [
		...userTestBookings,
		...storeTestBookings.filter((b) => !seenTestIds.has(b.id))
	];

	const memberStatus = await getUserBookingStatus(locals.user);
	const requestedTab = url.searchParams.get('tab');
	const initialTab =
		requestedTab === 'appointments' || requestedTab === 'tests' || requestedTab === 'reference'
			? requestedTab
			: mergedAppointments.length > 0 && mergedTestBookings.length === 0
				? 'appointments'
				: 'tests';

	return {
		user: locals.user,
		appointments: mergedAppointments,
		testBookings: mergedTestBookings,
		memberStatus,
		initialTab
	};
};

