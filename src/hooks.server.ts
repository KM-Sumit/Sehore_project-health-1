import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { getSessionFromRequest } from '$lib/server/auth/sessions';

const PROTECTED_PREFIXES = ['/dashboard', '/profile', '/admin'];
const ADMIN_PREFIXES = ['/admin'];

export const handle: Handle = async ({ event, resolve }) => {
	const session = await getSessionFromRequest(event);

	event.locals.user = session
		? {
				id: session.user.id,
				name: session.user.name,
				email: session.user.email,
				role: session.user.role as 'user' | 'admin' | 'doctor'
		  }
		: null;

	const { pathname } = event.url;

	// Require authentication for protected routes
	const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
	if (isProtected && !event.locals.user) {
		throw redirect(303, `/login?redirectTo=${encodeURIComponent(pathname)}`);
	}

	// Require admin role for admin routes
	const isAdmin = ADMIN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
	if (isAdmin && event.locals.user?.role !== 'admin') {
		throw redirect(303, '/dashboard');
	}

	return resolve(event);
};
