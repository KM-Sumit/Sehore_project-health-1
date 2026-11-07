import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { registerSchema } from '$lib/schemas';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '$lib/server/auth';
import { createSession } from '$lib/server/auth/sessions';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(303, '/dashboard');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const name = String(formData.get('name') || '').trim();
		const email = String(formData.get('email') || '').trim().toLowerCase();
		const phone = String(formData.get('phone') || '').trim();
		const password = String(formData.get('password') || '');
		const confirmPassword = String(formData.get('confirmPassword') || '');

		const validation = registerSchema.safeParse({
			name,
			email,
			phone,
			password,
			confirmPassword
		});

		if (!validation.success) {
			const errors = validation.error.flatten().fieldErrors;
			const firstError = Object.values(errors)[0]?.[0] || 'Invalid inputs';
			return fail(400, {
				name,
				email,
				phone,
				error: firstError
			});
		}

		const existingUser = await db.query.users.findFirst({
			where: eq(users.email, email)
		});

		if (existingUser) {
			return fail(400, {
				name,
				email,
				phone,
				error: 'An account with this email already exists'
			});
		}

		const passwordHash = await hashPassword(password);
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

		await createSession(
			{ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
			{ request, url: new URL(request.url) },
			cookies
		);

		throw redirect(303, '/dashboard');
	}
};
