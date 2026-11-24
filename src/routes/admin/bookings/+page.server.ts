import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { testBookings, appointments, expressBookings } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { adminStore } from '$lib/server/adminStore';
import { expressStore, type ExpressBookingRecord } from '$lib/server/expressStore';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(303, '/login?redirectTo=/admin/bookings');
	}

	let bookingsList: any[] = [];
	let apptsList: any[] = [];
	let expressList: any[] = [];

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

		expressList = await db.query.expressBookings.findMany({
			orderBy: desc(expressBookings.createdAt),
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

	// Merge DB records with in-memory fallback records (created while DB was down)
	const storedExpress = expressStore.getAll() as unknown as ExpressBookingRecord[];
	const combinedExpress = [...storedExpress, ...expressList]
		.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
		.slice(0, 20);

	return {
		testBookings: mergedTests,
		appointments: mergedAppts,
		expressBookings: combinedExpress
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
	},

	updateExpressStatus: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') {
			return fail(403, { error: 'Admin access required' });
		}

		const formData = await request.formData();
		const reference = String(formData.get('reference') || '');
		const status = String(formData.get('status') || '');

		const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
		if (!reference || !validStatuses.includes(status)) {
			return fail(400, { error: 'Invalid reference or status' });
		}

		try {
			const [updated] = await db
				.update(expressBookings)
				.set({ status })
				.where(eq(expressBookings.reference, reference))
				.returning();

			if (!updated) {
				const updatedInMemory = expressStore.updateStatus(
					reference,
					status as ExpressBookingRecord['status']
				);
				if (!updatedInMemory) {
					return fail(404, { error: 'Express booking not found' });
				}
			}
		} catch (err) {
			console.error('DB updateExpressStatus failed:', err);
			const updatedInMemory = expressStore.updateStatus(
				reference,
				status as ExpressBookingRecord['status']
			);
			if (!updatedInMemory) {
				return fail(500, { error: 'Failed to update express booking status' });
			}
		}

		return { success: true };
	}
};
