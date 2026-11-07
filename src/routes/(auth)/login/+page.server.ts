import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { loginSchema } from '$lib/schemas';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword } from '$lib/server/auth';
import { createSession } from '$lib/server/auth/sessions';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) {
		const redirectTo = url.searchParams.get('redirectTo') || '/dashboard';
		throw redirect(303, redirectTo);
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const formData = await request.formData();
		const email = String(formData.get('email') || '').trim().toLowerCase();
		const password = String(formData.get('password') || '');

		const validation = loginSchema.safeParse({ email, password });
		if (!validation.success) {
			const errors = validation.error.flatten().fieldErrors;
			return fail(400, {
				email,
				error: errors.email?.[0] || errors.password?.[0] || 'Invalid inputs'
			});
		}

		const user = await db.query.users.findFirst({
			where: eq(users.email, email)
		});

		if (!user || !user.passwordHash) {
			return fail(400, {
				email,
				error: 'Invalid email or password'
			});
		}

		const isValid = await verifyPassword(password, user.passwordHash);
		if (!isValid) {
			return fail(400, {
				email,
				error: 'Invalid email or password'
			});
		}

		await createSession(
			{ id: user.id, name: user.name, email: user.email, role: user.role },
			{ request, url: eventUrl(request) },
			cookies
		);

		const redirectTo = url.searchParams.get('redirectTo') || '/dashboard';
		throw redirect(303, redirectTo);
	}
};

// SvelteKit Actions pass `request` but not `url` directly on the action input;
// derive a URL object from the request for client-meta extraction.
function eventUrl(request: Request): URL {
	try {
		return new URL(request.url);
	} catch {
		return new URL('http://localhost');
	}
}
