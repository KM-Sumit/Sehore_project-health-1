import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { getSessionFromRequest } from '$lib/server/auth/sessions';

const PROTECTED_PREFIXES = ['/dashboard', '/profile', '/admin'];
const ADMIN_PREFIXES = ['/admin'];

/**
 * Authenticated pages must never be served from the browser cache, otherwise the
 * back button can reveal an admin/patient page after logout.
 */
function withNoStore(response: Response): Response {
	response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
	response.headers.set('Pragma', 'no-cache');
	response.headers.set('Expires', '0');
	return response;
}

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
				phone: session.user.phone ?? null,
				role: session.user.role as 'user' | 'admin' | 'doctor'
		  }
		: null;

	const { pathname } = event.url;

	const isAdminLogin = pathname === '/admin/login';
	const isAdmin = !isAdminLogin && ADMIN_PREFIXES.some((prefix) => pathname.startsWith(prefix));

	// Dedicated Admin Portal auth flow (separate from patient login; ready for future OAuth)
	if (isAdmin) {
		if (!event.locals.user || event.locals.user.role !== 'admin') {
			throw redirect(303, `/admin/login?redirectTo=${encodeURIComponent(pathname)}`);
		}
		return withNoStore(await resolve(event));
	}

	// Require patient authentication for personal dashboard & profile routes
	const isProtected = !isAdminLogin && PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
	if (isProtected && !event.locals.user) {
		throw redirect(303, `/login?redirectTo=${encodeURIComponent(pathname)}`);
	}

	const response = await resolve(event);

	if (isProtected && event.locals.user) {
		return withNoStore(response);
	}

	return response;
};
