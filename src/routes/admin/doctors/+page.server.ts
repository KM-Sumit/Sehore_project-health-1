import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { adminStore } from '$lib/server/adminStore';
import { db } from '$lib/server/db';
import { doctors } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url }) => {
	const host = url.host || 'localhost:5173';
	const doctorStats = await adminStore.getAllDoctorsWithStats(host);
	const overallMetrics = adminStore.getOverallMetrics();

	return {
		doctors: doctorStats,
		metrics: overallMetrics
	};
};

export const actions: Actions = {
	generateQr: async ({ request }) => {
		const formData = await request.formData();
		const doctorId = String(formData.get('doctorId') || '');
		const customCode = String(formData.get('customCode') || '').trim();

		if (!doctorId) {
			return fail(400, { error: 'Doctor ID is required' });
		}

		const newCode = adminStore.generateDoctorQrCode(doctorId, customCode || undefined);

		try {
			await db.update(doctors).set({ qrCode: newCode }).where(eq(doctors.id, doctorId));
		} catch (err) {
			console.warn('DB QR update fallback:', err);
		}

		return { success: true, qrCode: newCode };
	},

	updateCommission: async ({ request }) => {
		const formData = await request.formData();
		const doctorId = String(formData.get('doctorId') || '');
		const rate = parseFloat(String(formData.get('commissionRate') || '15'));

		if (!doctorId || isNaN(rate) || rate < 0 || rate > 100) {
			return fail(400, { error: 'Invalid commission rate (0-100)' });
		}

		adminStore.updateDoctorCommission(doctorId, rate);

		try {
			await db
				.update(doctors)
				.set({ commissionRate: rate.toFixed(2) })
				.where(eq(doctors.id, doctorId));
		} catch (err) {
			console.warn('DB commission update fallback:', err);
		}

		return { success: true, commissionRate: rate };
	},

	addDoctor: async ({ request }) => {
		const formData = await request.formData();
		const name = String(formData.get('name') || '').trim();
		const specialty = String(formData.get('specialty') || '').trim();
		const qualification = String(formData.get('qualification') || '').trim();
		const experienceYears = parseInt(String(formData.get('experienceYears') || '5'), 10);
		const fee = String(formData.get('consultationFee') || '500.00');
		const commissionRate = parseFloat(String(formData.get('commissionRate') || '15'));

		if (!name || !specialty) {
			return fail(400, { error: 'Name and specialty are required' });
		}
		if (isNaN(commissionRate) || commissionRate < 0 || commissionRate > 100) {
			return fail(400, { error: 'Commission rate must be 0-100' });
		}

		const doctorId = crypto.randomUUID();
		const nameSlug = name.replace(/dr\.?\s+/i, '').replace(/[^a-zA-Z]/g, '').slice(0, 6).toUpperCase();
		const qrCode = `DOC-QR-${nameSlug}-${Math.floor(100000 + Math.random() * 900000)}`;

		// Add to adminStore (in-memory)
		adminStore.getAllDoctors(); // ensure initialized
		(adminStore as any).doctors.set(doctorId, {
			id: doctorId,
			name,
			specialty,
			qualification,
			experienceYears: isNaN(experienceYears) ? 5 : experienceYears,
			consultationFee: fee,
			qrCode,
			commissionRate: isNaN(commissionRate) ? 15 : commissionRate,
			clinicName: `${specialty} Clinic`
		});

		// Persist to DB
		try {
			await db.insert(doctors).values({
				id: doctorId,
				name,
				specialty,
				qualification,
				experienceYears: isNaN(experienceYears) ? 5 : experienceYears,
				consultationFee: parseFloat(fee) || 500,
				commissionRate: isNaN(commissionRate) ? 15 : commissionRate,
				qrCode,
				isActive: true,
				bio: `${specialty} doctor`
			});
		} catch (err) {
			console.warn('DB doctor insert fallback:', err);
		}

		return { success: true, doctorId, qrCode };
	}
};
