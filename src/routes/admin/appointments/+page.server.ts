import type { PageServerLoad, Actions } from './$types';
import { adminStore } from '$lib/server/adminStore';

export const load: PageServerLoad = async ({ url }) => {
	const sourceFilter = url.searchParams.get('source') as any || 'all';
	const statusFilter = url.searchParams.get('status') || 'all';
	const search = url.searchParams.get('search') || '';

	const appointments = adminStore.getAllAppointments({
		source: sourceFilter,
		status: statusFilter,
		search
	});

	const metrics = adminStore.getOverallMetrics();

	return {
		appointments,
		metrics,
		currentFilters: {
			source: sourceFilter,
			status: statusFilter,
			search
		}
	};
};

export const actions: Actions = {
	updateStatus: async ({ request }) => {
		const formData = await request.formData();
		const appointmentId = String(formData.get('appointmentId') || '');
		const status = String(formData.get('status') || '') as any;

		if (appointmentId && status) {
			adminStore.updateAppointmentStatus(appointmentId, status);
		}

		return { success: true };
	}
};

