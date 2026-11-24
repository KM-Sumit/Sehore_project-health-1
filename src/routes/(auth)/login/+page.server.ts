import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { loginSchema } from '$lib/schemas';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword } from '$lib/server/auth';
import { createSession } from '$lib/server/auth/sessions';
import { authFallbackStore } from '$lib/server/auth/fallbackStore';

function safeRedirectTarget(raw: string | null): string {
	if (!raw || !raw.startsWith('/') || raw.startsWith('//')) {
		return '/dashboard';
	}
	return raw;
}

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) {
		throw redirect(303, safeRedirectTarget(url.searchParams.get('redirectTo')));
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

		let user: { id: string; name: string; email: string; role: string; passwordHash: string | null } | null = null;
		try {
			const dbUser = await db.query.users.findFirst({
				where: eq(users.email, email)
			});
			if (dbUser) {
				user = dbUser;
			}
		} catch (dbErr) {
			console.warn('Login DB query fallback to in-memory auth store:', dbErr);
			user = await authFallbackStore.findUserByEmail(email);
		}

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

		try {
			await createSession(
				{ id: user.id, name: user.name, email: user.email, role: user.role },
				{ request, url: eventUrl(request) },
				cookies
			);
		} catch (err) {
			console.error('Login failed: could not create session', err);
			return fail(503, {
				email,
				error:
					'Login service is temporarily unavailable because the database is not reachable. Please try again in a moment.'
			});
		}

		throw redirect(303, safeRedirectTarget(url.searchParams.get('redirectTo')));
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
