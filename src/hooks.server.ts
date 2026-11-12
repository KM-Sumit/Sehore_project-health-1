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
		return resolve(event);
	}

	// Require patient authentication for personal dashboard & profile routes
	const isProtected = !isAdminLogin && PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
	if (isProtected && !event.locals.user) {
		throw redirect(303, `/login?redirectTo=${encodeURIComponent(pathname)}`);
	}

	return resolve(event);
};
