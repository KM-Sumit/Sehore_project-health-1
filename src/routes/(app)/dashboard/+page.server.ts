import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { appointments, testBookings } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
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
			limit: 10
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

	return {
		user: locals.user,
		appointments: userAppointments,
		testBookings: userTestBookings
	};
};

