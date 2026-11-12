import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { doctors, doctorSlots } from '$lib/server/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { MOCK_DOCTORS, getMockSlots } from '$lib/server/mockData';
import { adminStore } from '$lib/server/adminStore';
import { getUserBookingStatus } from '$lib/server/appointments';

export const load: PageServerLoad = async ({ url, locals }) => {
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

	// Merge in admin-created doctors that only exist in memory (not in DB or mock list)
	const existingIds = new Set(docList.map((d: any) => d.id));
	const adminDoctors = adminStore.getAllDoctors();
	for (const adminDoc of adminDoctors) {
		if (!existingIds.has(adminDoc.id)) {
			docList.push({
				id: adminDoc.id,
				name: adminDoc.name,
				specialty: adminDoc.specialty,
				qualification: adminDoc.qualification,
				experienceYears: adminDoc.experienceYears,
				consultationFee: adminDoc.consultationFee,
				bio: `${adminDoc.specialty} doctor`,
				imageUrl: null,
				isActive: true,
				slots: getMockSlots(adminDoc.id)
			});
		}
	}

	const memberStatus = await getUserBookingStatus(locals.user ?? null);

	// Enrich with QR codes, available slots, and repeat-booking pricing
	const enrichedDoctors = docList.map((d) => {
		const storeDoc = adminStore.getDoctorById(d.id);
		const baseFee = parseFloat(d.consultationFee || storeDoc?.consultationFee || '500');
		const pricing = adminStore.calculateAppointmentPricing(baseFee, memberStatus.isReturningMember);

		return {
			...d,
			slots: (d.slots || []).filter((s: any) => !s.isBooked && !adminStore.isSlotBooked(s.id)),
			qrCode: storeDoc?.qrCode || `DOC-QR-${d.name.slice(3, 8).toUpperCase()}-101`,
			commissionRate: storeDoc?.commissionRate || 15,
			discountedFee: pricing.finalFee,
			discountPercent: pricing.discountPercent
		};
	});

	// If there is a referralCode, find matching doctor
	const matchedDoctor = referralCode ? adminStore.getDoctorByQrCode(referralCode) : null;

	return {
		doctors: enrichedDoctors,
		referralCode,
		matchedDoctor,
		memberStatus
	};
};
