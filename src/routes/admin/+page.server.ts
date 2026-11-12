import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, doctors, appointments } from '$lib/server/db/schema';
import { eq, count } from 'drizzle-orm';
import { adminStore } from '$lib/server/adminStore';
import { MOCK_TESTS } from '$lib/server/mockData';
import { authFallbackStore } from '$lib/server/auth/fallbackStore';

export const load: PageServerLoad = async ({ url }) => {
	const host = url.host || 'localhost:5173';
	const metrics = adminStore.getOverallMetrics();
	const recentAppointments = adminStore.getAllAppointments().slice(0, 6);
	const doctorsList = await adminStore.getAllDoctorsWithStats(host);

	let totalUsers = await authFallbackStore.getUserCount();
	let activeTestsCount = MOCK_TESTS.filter((t) => t.isActive).length;
	let totalAppointmentsDb = 0;

	try {
		const [userResult] = await db.select({ count: count() }).from(users);
		totalUsers = Math.max(totalUsers, Number(userResult?.count ?? 0));
	} catch (err) {
		console.warn('Admin users count failed:', err);
	}

	try {
		const [testResult] = await db.select({ count: count() }).from(doctors);
		if (Number(testResult?.count ?? 0) > 0) {
			activeTestsCount = Number(testResult.count);
		}
	} catch (err) {
		console.warn('Admin doctors count failed:', err);
	}

	try {
		const [apptResult] = await db.select({ count: count() }).from(appointments);
		totalAppointmentsDb = Number(apptResult?.count ?? 0);
	} catch (err) {
		console.warn('Admin appointments count failed:', err);
	}

	return {
		metrics: {
			...metrics,
			totalUsers,
			totalAppointments: Math.max(metrics.totalAppointments, totalAppointmentsDb)
		},
		recentAppointments,
		doctors: doctorsList,
		activeTestsCount,
		totalUsers
	};
};

export const actions: Actions = {
	updateAppointmentStatus: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') {
			return fail(403, { error: 'Admin access required' });
		}

		const formData = await request.formData();
		const appointmentId = String(formData.get('appointmentId') || '');
		const status = String(formData.get('status') || '');

		const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
		if (!appointmentId || !validStatuses.includes(status)) {
			return fail(400, { error: 'Invalid appointment ID or status' });
		}

		const updated = adminStore.updateAppointmentStatus(appointmentId, status as any);
		if (!updated) {
			return fail(404, { error: 'Appointment not found' });
		}

		// Also update DB if available
		try {
			await db.update(appointments).set({ status: status as any }).where(eq(appointments.id, appointmentId));
		} catch (err) {
			console.warn('DB appointment status update fallback:', err);
		}

		return { success: true };
	}
};
