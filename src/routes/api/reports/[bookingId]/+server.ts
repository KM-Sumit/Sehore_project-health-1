import { generatePdfReport } from '$lib/server/pdf';
import { db } from '$lib/server/db';
import { testBookings, testBookingItems, tests, users } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	// ── Authentication required ──
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

	// ── Fetch booking with authorization ──
	// Patients can only see their own reports; admins can see all
	const bookingQuery = db
		.select({
			booking: testBookings,
			user: users
		})
		.from(testBookings)
		.innerJoin(users, eq(testBookings.userId, users.id))
		.where(eq(testBookings.id, bookingId));

	// Non-admin users can only access their own bookings
	if (locals.user.role !== 'admin') {
		bookingQuery.where(and(eq(testBookings.id, bookingId), eq(testBookings.userId, locals.user.id)));
	}

	const [bookingRow] = await bookingQuery;

	if (!bookingRow) {
		return new Response(JSON.stringify({ error: 'Report not found' }), {
			status: 404,
			headers: { 'content-type': 'application/json' }
		});
	}

	const { booking, user } = bookingRow;

	// ── Fetch test items ──
	const items = await db
		.select({
			test: tests,
			item: testBookingItems
		})
		.from(testBookingItems)
		.innerJoin(tests, eq(testBookingItems.testId, tests.id))
		.where(eq(testBookingItems.bookingId, booking.id));

	// ── Build report data ──
	const reportData = {
		bookingId: booking.id,
		patientName: booking.patientName,
		patientAge: booking.patientAge,
		patientGender: booking.patientGender,
		patientPhone: booking.patientPhone,
		patientEmail: user.email,
		collectionDate: booking.collectionDate.toISOString().split('T')[0],
		reportDate: new Date().toISOString().split('T')[0],
		status: booking.status,
		totalAmount: booking.totalAmount,
		tests: items.map((item) => ({
			name: item.test.name,
			category: item.test.category,
			value: '—', // Lab results would be stored separately
			unit: '',
			referenceRange: '',
			status: 'Pending' as const
		}))
	};

	const pdfBytes = await generatePdfReport(reportData);

	return new Response(pdfBytes, {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `inline; filename="Bloodline-Pathology-Report-${bookingId}.pdf"`,
			'Cache-Control': 'private, no-cache' // Medical data — no public caching
		}
	});
};
