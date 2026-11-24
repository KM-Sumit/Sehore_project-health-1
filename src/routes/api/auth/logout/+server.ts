import { redirect } from '@sveltejs/kit';
import { revokeSession, clearSessionCookies } from '$lib/server/auth/sessions';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies, request }) => {
	const token = cookies.get('session');
	if (token) {
		await revokeSession(token).catch((err) => console.error('Session revoke error:', err));
	}
	clearSessionCookies(cookies);

	// Prevent browser from caching the logged-in admin page after logout
	throw redirect(303, '/login', {
		headers: {
			'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
			'Pragma': 'no-cache',
			'Expires': '0'
		}
	});
};
