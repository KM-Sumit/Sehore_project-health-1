import { redirect } from '@sveltejs/kit';
import { revokeSession, clearSessionCookies } from '$lib/server/auth/sessions';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies, request }) => {
	const token = cookies.get('session');
	if (token) {
		await revokeSession(token).catch((err) => console.error('Session revoke error:', err));
	}
	clearSessionCookies(cookies);
	throw redirect(303, '/login');
};
