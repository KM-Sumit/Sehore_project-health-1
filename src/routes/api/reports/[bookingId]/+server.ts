import { generatePdfReport } from '$lib/server/pdf';
import { db } from '$lib/server/db';
import { testBookings, testBookingItems, tests, users } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { adminStore } from '$lib/server/adminStore';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { 'content-type': 'application/json' }
		});
	}

	const bookingId = params.bookingId;
	if (!bookingId) {
		return new Response(JSON.stringify({ error: 'Booking ID required' }), {
			status: 400,
			headers: { 'content-type': 'application/json' }
		});
	}

	let reportData: Parameters<typeof generatePdfReport>[0] | null = null;

	try {
		const bookingQuery = db
			.select({
				booking: testBookings,
				user: users
			})
			.from(testBookings)
			.innerJoin(users, eq(testBookings.userId, users.id))
			.where(
				locals.user.role === 'admin'
					? eq(testBookings.id, bookingId)
					: and(eq(testBookings.id, bookingId), eq(testBookings.userId, locals.user.id))
			);

		const [bookingRow] = await bookingQuery;
		if (bookingRow) {
			const { booking, user } = bookingRow;
			const items = await db
				.select({
					test: tests,
					item: testBookingItems
				})
				.from(testBookingItems)
				.innerJoin(tests, eq(testBookingItems.testId, tests.id))
				.where(eq(testBookingItems.bookingId, booking.id));

			reportData = {
				bookingId: booking.id,
				patientName: booking.patientName,
				patientAge: booking.patientAge,
				patientGender: booking.patientGender,
				patientPhone: booking.patientPhone,
				patientEmail: user.email,
				collectionDate: String(booking.collectionDate).split('T')[0],
				reportDate: new Date().toISOString().split('T')[0],
				status: booking.status,
				totalAmount: booking.totalAmount,
				tests: items.map((item) => ({
					name: item.test.name,
					category: item.test.category,
					value: '—',
					unit: '',
					referenceRange: '',
					status: 'Normal' as const
				}))
			};
		}
	} catch (err) {
		console.warn('Report DB lookup fallback to adminStore:', err);
	}

	if (!reportData) {
		const storeBooking = adminStore.getTestBookingById(bookingId);
		if (
			storeBooking &&
			(locals.user.role === 'admin' ||
				storeBooking.userId === locals.user.id ||
				(storeBooking.patientEmail &&
					storeBooking.patientEmail.toLowerCase() === locals.user.email.toLowerCase()))
		) {
			reportData = {
				bookingId: storeBooking.id,
				patientName: storeBooking.patientName,
				patientAge: storeBooking.patientAge,
				patientGender: storeBooking.patientGender,
				patientPhone: storeBooking.patientPhone,
				patientEmail: storeBooking.patientEmail || locals.user.email,
				collectionDate: storeBooking.collectionDate,
				reportDate: new Date().toISOString().split('T')[0],
				status: storeBooking.status,
				totalAmount: storeBooking.totalAmount.toFixed(2),
				tests: storeBooking.items.map((item) => ({
					name: item.test.name,
					category: item.test.category,
					value: 'Pending Sample',
					unit: '',
					referenceRange: 'Clinical Range',
					status: 'Normal' as const
				}))
			};
		}
	}

	if (!reportData) {
		return new Response(JSON.stringify({ error: 'Report not found' }), {
			status: 404,
			headers: { 'content-type': 'application/json' }
		});
	}

	const pdfBytes = await generatePdfReport(reportData);

	return new Response(Buffer.from(pdfBytes), {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `inline; filename="Bloodline-Pathology-Report-${bookingId}.pdf"`,
			'Cache-Control': 'private, no-cache'
		}
	});
};
