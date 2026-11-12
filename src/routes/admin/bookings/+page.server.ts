import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { testBookings, appointments } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { adminStore } from '$lib/server/adminStore';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(303, '/login?redirectTo=/admin/bookings');
	}

	let bookingsList: any[] = [];
	let apptsList: any[] = [];

	try {
		bookingsList = await db.query.testBookings.findMany({
			with: {
				items: {
					with: {
						test: true
					}
				}
			},
			orderBy: desc(testBookings.createdAt),
			limit: 20
		});

		apptsList = await db.query.appointments.findMany({
			with: {
				doctor: true,
				slot: true
			},
			orderBy: desc(appointments.createdAt),
			limit: 20
		});
	} catch (err) {
		console.warn('Admin bookings DB load fallback to adminStore:', err);
	}

	const storeTests = adminStore.getAllTestBookings().map((b) => ({
		...b,
		totalAmount: b.totalAmount.toFixed(2)
	}));
	const seenTests = new Set(bookingsList.map((b) => b.id));
	const mergedTests = [...bookingsList, ...storeTests.filter((b) => !seenTests.has(b.id))];

	const storeAppts = adminStore.getAllAppointments().map((a) => ({
		...a,
		doctor: { name: a.doctorName, specialty: a.doctorSpecialty },
		slot: { date: a.appointmentDate, startTime: a.appointmentTime }
	}));
	const seenAppts = new Set(apptsList.map((a) => a.id));
	const mergedAppts = [...apptsList, ...storeAppts.filter((a) => !seenAppts.has(a.id))];

	return {
		testBookings: mergedTests,
		appointments: mergedAppts
	};
};

export const actions: Actions = {
	updateTestStatus: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') {
			return fail(403, { error: 'Admin access required' });
		}

		const formData = await request.formData();
		const bookingId = String(formData.get('bookingId') || '');
		const status = String(formData.get('status') || '') as any;

		const validStatuses = ['pending', 'confirmed', 'sample_collected', 'processing', 'completed', 'cancelled'];
		if (!bookingId || !validStatuses.includes(status)) {
			return fail(400, { error: 'Invalid booking ID or status' });
		}

		const updatedInStore = adminStore.updateTestBookingStatus(bookingId, status);

		try {
			const [updated] = await db
				.update(testBookings)
				.set({ status })
				.where(eq(testBookings.id, bookingId))
				.returning();

			if (!updated && !updatedInStore) {
				return fail(404, { error: 'Booking not found' });
			}
		} catch (err) {
			console.warn('DB updateTestStatus fallback:', err);
			if (!updatedInStore) {
				return fail(404, { error: 'Booking not found' });
			}
		}

		return { success: true };
	}
};
