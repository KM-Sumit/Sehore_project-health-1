import { db } from '$lib/server/db';
import { appointments, users } from '$lib/server/db/schema';
import { and, eq, isNull, or } from 'drizzle-orm';
import { registerSchema } from '$lib/schemas';
import { hashPassword } from './index';
import { createSession } from './sessions';
import { authFallbackStore } from './fallbackStore';
import { adminStore } from '$lib/server/adminStore';

export interface RegisterAccountInput {
	name: string;
	email: string;
	phone: string;
	password: string;
	confirmPassword: string;
	appointmentId?: string | null;
	bookingId?: string | null;
}

export type RegisterAccountResult =
	| {
			ok: true;
			user: { id: string; name: string; email: string; phone: string | null; role: 'user' | 'admin' | 'doctor' };
			linkedAppointments: number;
	  }
	| {
			ok: false;
			status: 400;
			error: string;
	  };

/**
 * Shared registration handler used by both `/register` and optional post-booking
 * account creation. Persists to PostgreSQL when available, falls back cleanly
 * to in-memory auth store, creates session cookies, and links prior guest
 * bookings matching the user's email, phone, or appointment ID.
 */
export async function registerUserAccount(
	input: RegisterAccountInput,
	context: {
		request: Request;
		cookies: { set: (name: string, value: string, opts: Record<string, unknown>) => void };
	}
): Promise<RegisterAccountResult> {
	const name = input.name.trim();
	const email = input.email.trim().toLowerCase();
	const phone = input.phone.trim();

	const validation = registerSchema.safeParse({
		name,
		email,
		phone,
		password: input.password,
		confirmPassword: input.confirmPassword
	});

	if (!validation.success) {
		const errors = validation.error.flatten().fieldErrors;
		const firstError = Object.values(errors)[0]?.[0] || 'Invalid inputs';
		return { ok: false, status: 400, error: firstError };
	}

	const passwordHash = await hashPassword(input.password);
	let createdUser: {
		id: string;
		name: string;
		email: string;
		phone: string | null;
		role: 'user' | 'admin' | 'doctor';
	} | null = null;

	try {
		const existingUser = await db.query.users.findFirst({
			where: eq(users.email, email)
		});
		if (existingUser) {
			return { ok: false, status: 400, error: 'An account with this email already exists' };
		}

		const [newUser] = await db
			.insert(users)
			.values({
				name,
				email,
				phone,
				passwordHash,
				role: 'user'
			})
			.returning();

		createdUser = {
			id: newUser.id,
			name: newUser.name,
			email: newUser.email,
			phone: newUser.phone ?? phone,
			role: newUser.role
		};

		// Link any DB guest appointments matching phone or appointment ID
		try {
			const cleanPhone = phone.replace(/\D/g, '').slice(-10);
			await db
				.update(appointments)
				.set({ userId: createdUser.id })
				.where(
					and(
						isNull(appointments.userId),
						cleanPhone
							? or(
									eq(appointments.patientPhone, phone),
									eq(appointments.patientPhone, cleanPhone)
								)
							: eq(appointments.patientPhone, phone)
					)
				);
		} catch (linkErr) {
			console.warn('DB guest appointment link skipped:', linkErr);
		}
	} catch (dbErr) {
		console.warn('Register DB fallback to in-memory auth store:', dbErr);
		const existingFallback = await authFallbackStore.findUserByEmail(email);
		if (existingFallback) {
			return { ok: false, status: 400, error: 'An account with this email already exists' };
		}

		const fbUser = await authFallbackStore.createUser({
			name,
			email,
			phone,
			passwordHash,
			role: 'user'
		});
		createdUser = {
			id: fbUser.id,
			name: fbUser.name,
			email: fbUser.email,
			phone: fbUser.phone,
			role: fbUser.role
		};
	}

	const linkedAppointments =
		adminStore.linkGuestAppointmentsToUser({
			userId: createdUser.id,
			email: createdUser.email,
			phone: createdUser.phone,
			appointmentId: input.appointmentId
		}) +
		adminStore.linkGuestTestBookingsToUser({
			userId: createdUser.id,
			email: createdUser.email,
			phone: createdUser.phone,
			bookingId: input.bookingId
		});

	let reqUrl: URL;
	try {
		reqUrl = new URL(context.request.url);
	} catch {
		reqUrl = new URL('http://localhost');
	}

	await createSession(
		{
			id: createdUser.id,
			name: createdUser.name,
			email: createdUser.email,
			role: createdUser.role
		},
		{ request: context.request, url: reqUrl },
		context.cookies
	);

	return { ok: true, user: createdUser, linkedAppointments };
}

