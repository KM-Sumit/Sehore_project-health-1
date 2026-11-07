import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { doctors, doctorSlots } from '$lib/server/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { MOCK_DOCTORS, getMockSlots } from '$lib/server/mockData';
import { adminStore } from '$lib/server/adminStore';

export const load: PageServerLoad = async ({ url }) => {
	const today = new Date().toISOString().split('T')[0];
	const referralCode = url.searchParams.get('ref') || url.searchParams.get('qr') || '';

	let docList: any[] = [];
	try {
		const allDoctors = await db.query.doctors.findMany({
			where: eq(doctors.isActive, true),
			with: {
				slots: {
					where: and(
						eq(doctorSlots.isBooked, false),
						gte(doctorSlots.date, today)
					)
				}
			}
		});

		if (allDoctors && allDoctors.length > 0) {
			docList = allDoctors;
		}
	} catch (err) {
		console.warn('DB query failed for doctors, using mock list:', err);
	}

	if (docList.length === 0) {
		docList = MOCK_DOCTORS.map((d) => ({
			...d,
			slots: getMockSlots(d.id)
		}));
	}

	// Enrich with QR codes from adminStore
	const enrichedDoctors = docList.map((d) => {
		const storeDoc = adminStore.getDoctorById(d.id);
		return {
			...d,
			qrCode: storeDoc?.qrCode || `DOC-QR-${d.name.slice(3, 8).toUpperCase()}-101`,
			commissionRate: storeDoc?.commissionRate || 15
		};
	});

	// If there is a referralCode, find matching doctor
	const matchedDoctor = referralCode ? adminStore.getDoctorByQrCode(referralCode) : null;

	return {
		doctors: enrichedDoctors,
		referralCode,
		matchedDoctor
	};
};
