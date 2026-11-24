import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { testBookings } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { adminStore } from '$lib/server/adminStore';

const ACTIVE_STATUSES = ['pending', 'confirmed', 'sample_collected', 'processing'];

/**
 * Full test-order history for the signed-in patient.
 * Unlike the dashboard widget (limited to the latest 10), this returns every
 * booking, newest first, and also merges bookings created while the DB was down
 * (in-memory fallback store).
 */
export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login?redirectTo=/dashboard/test-history');
	}

	let dbBookings: any[] = [];
	let dbAvailable = true;

	try {
		dbBookings = await db.query.testBookings.findMany({
			where: eq(testBookings.userId, locals.user.id),
			with: {
				items: {
					with: {
						test: true
					}
				}
			},
			orderBy: desc(testBookings.createdAt)
		});
	} catch (err) {
		dbAvailable = false;
		console.warn('Test history DB load failed, using in-memory fallback:', err);
	}

	const storeBookings = adminStore
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

	const seen = new Set(dbBookings.map((b) => b.id));
	const bookings = [...dbBookings, ...storeBookings.filter((b) => !seen.has(b.id))].sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
	);

	const countByStatus = bookings.reduce<Record<string, number>>((acc, booking) => {
		acc[booking.status] = (acc[booking.status] ?? 0) + 1;
		return acc;
	}, {});

	const totalSpent = bookings
		.filter((booking) => booking.status !== 'cancelled')
		.reduce((sum, booking) => sum + Number(booking.totalAmount ?? 0), 0);

	return {
		user: locals.user,
		bookings,
		dbAvailable,
		stats: {
			total: bookings.length,
			active: ACTIVE_STATUSES.reduce((sum, status) => sum + (countByStatus[status] ?? 0), 0),
			completed: countByStatus.completed ?? 0,
			cancelled: countByStatus.cancelled ?? 0,
			totalSpent: totalSpent.toFixed(2)
		}
	};
};
