import { db } from '$lib/server/db';
import { appointments, doctors } from '$lib/server/db/schema';
import { and, eq, ne } from 'drizzle-orm';
import { adminStore, REPEAT_BOOKING_DISCOUNT_PERCENT, type AppointmentPricing } from '$lib/server/adminStore';
import { MOCK_DOCTORS } from '$lib/server/mockData';

export interface UserBookingStatus {
	previousBookingsCount: number;
	isReturningMember: boolean;
	discountPercent: number;
}

/**
 * Determine how many prior non-cancelled appointments a signed-in user has
 * across DB and in-memory adminStore, so 2nd-time booking discounts are accurate.
 */
export async function getUserBookingStatus(user: App.Locals['user']): Promise<UserBookingStatus> {
	if (!user) {
		return {
			previousBookingsCount: 0,
			isReturningMember: false,
			discountPercent: 0
		};
	}

	const storeMatches = adminStore
		.getAppointmentsForUser({
			userId: user.id,
			email: user.email,
			phone: user.phone ?? null
		})
		.filter((a) => a.status !== 'cancelled');

	let dbCount = 0;
	try {
		const dbRows = await db
			.select({ id: appointments.id })
			.from(appointments)
			.where(and(eq(appointments.userId, user.id), ne(appointments.status, 'cancelled')));
		dbCount = dbRows.length;
	} catch (err) {
		console.warn('DB returning-member check skipped:', err);
	}

	const previousBookingsCount = Math.max(storeMatches.length, dbCount);
	const isReturningMember = previousBookingsCount >= 1;

	return {
		previousBookingsCount,
		isReturningMember,
		discountPercent: isReturningMember ? REPEAT_BOOKING_DISCOUNT_PERCENT : 0
	};
}

export async function resolveDoctorFee(doctorId: string): Promise<number | null> {
	const storeDoc = adminStore.getDoctorById(doctorId);
	if (storeDoc) {
		return parseFloat(storeDoc.consultationFee || '500');
	}

	try {
		const [dbDoc] = await db
			.select({ consultationFee: doctors.consultationFee })
			.from(doctors)
			.where(eq(doctors.id, doctorId));
		if (dbDoc) {
			return parseFloat(String(dbDoc.consultationFee || '500'));
		}
	} catch (err) {
		console.warn('DB doctor fee lookup skipped:', err);
	}

	const mockDoc = MOCK_DOCTORS.find((d) => d.id === doctorId);
	return mockDoc ? parseFloat(mockDoc.consultationFee || '500') : null;
}

export async function getAuthoritativeAppointmentPricing(
	doctorId: string,
	user: App.Locals['user']
): Promise<(AppointmentPricing & UserBookingStatus) | null> {
	const baseFee = await resolveDoctorFee(doctorId);
	if (baseFee === null) return null;

	const memberStatus = await getUserBookingStatus(user);
	const pricing = adminStore.calculateAppointmentPricing(baseFee, memberStatus.isReturningMember);

	return {
		...pricing,
		...memberStatus
	};
}

