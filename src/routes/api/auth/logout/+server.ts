import { redirect } from '@sveltejs/kit';
import { revokeSession, clearSessionCookies } from '$lib/server/auth/sessions';
import type { RequestHandler } from './$types';

function safeRedirectTarget(raw: string | null): string {
	if (!raw || !raw.startsWith('/') || raw.startsWith('//')) {
		return '/login';
	}
	return raw;
}

export const POST: RequestHandler = async ({ cookies, url }) => {
	const token = cookies.get('session');
	if (token) {
		await revokeSession(token).catch((err) => console.error('Session revoke error:', err));
	}
	clearSessionCookies(cookies);
	throw redirect(303, safeRedirectTarget(url.searchParams.get('redirectTo')));
};
