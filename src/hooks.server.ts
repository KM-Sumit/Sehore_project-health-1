import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { getSessionFromRequest } from '$lib/server/auth/sessions';

const PROTECTED_PREFIXES = ['/dashboard', '/profile', '/admin'];
const ADMIN_PREFIXES = ['/admin'];

export const handle: Handle = async ({ event, resolve }) => {
	let session: Awaited<ReturnType<typeof getSessionFromRequest>> = null;

	try {
		session = await getSessionFromRequest(event);
	} catch (err) {
		// Do not crash the whole site if the database is temporarily unavailable.
		console.error('Session lookup failed (database unavailable?):', err);
	}

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

	const response = await resolve(event);

	// Add cache-control headers to protected routes so back button doesn't show logged-in page after logout
	if (isProtected && event.locals.user) {
		response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
		response.headers.set('Pragma', 'no-cache');
		response.headers.set('Expires', '0');
	}

	return response;
};
