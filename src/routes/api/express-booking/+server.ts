import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { expressBookingSchema } from '$lib/schemas';
import { db } from '$lib/server/db';
import { expressBookings } from '$lib/server/db/schema';
import { expressStore } from '$lib/server/expressStore';

function makeReference(): string {
	const stamp = Date.now().toString(36).toUpperCase().slice(-5);
	const random = Math.floor(10 + Math.random() * 90);
	return `EXP-${stamp}${random}`;
}

export const POST: RequestHandler = async ({ request }) => {
	let payload: Record<string, unknown> = {};

	try {
		const contentType = request.headers.get('content-type') || '';
		if (contentType.includes('application/json')) {
			payload = (await request.json()) as Record<string, unknown>;
		} else {
			const formData = await request.formData();
			payload = Object.fromEntries(formData.entries());
		}
	} catch {
		return json({ success: false, error: 'Invalid request body.' }, { status: 400 });
	}

	const parsed = expressBookingSchema.safeParse(payload);
	if (!parsed.success) {
		const fieldErrors = parsed.error.flatten().fieldErrors;
		const firstError = Object.values(fieldErrors)[0]?.[0] || 'Please check the form details.';
		return json({ success: false, error: firstError }, { status: 400 });
	}

	const data = parsed.data;
	const reference = makeReference();
	const record = {
		reference,
		name: data.name ?? null,
		phone: data.phone,
		gender: data.gender ?? null,
		age: data.age ?? null,
		serviceType: data.serviceType,
		serviceName: data.serviceName ?? null,
		preferredDate: data.preferredDate ?? null,
		preferredSlot: data.preferredSlot ?? null,
		notes: data.notes ?? null,
		status: 'pending' as const
	};

	try {
		await db.insert(expressBookings).values(record);
	} catch (err) {
		// Keep the booking even if the database is temporarily unavailable.
		console.warn('Express booking DB save failed, storing in memory:', err);
		expressStore.create(record);
	}

	return json({
		success: true,
		reference,
		message: 'Your express booking is confirmed. Our care team will call you shortly.'
	});
};
