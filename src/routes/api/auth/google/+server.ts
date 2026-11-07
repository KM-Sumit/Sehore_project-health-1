import { redirect } from '@sveltejs/kit';
import { getGoogleAuthUrl, generateOAuthState } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
	try {
		const state = generateOAuthState();
		// Store state in a short-lived cookie to verify in callback (CSRF protection)
		cookies.set('oauth_state', state, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 10 * 60 // 10 minutes
		});

		const url = getGoogleAuthUrl(state);
		throw redirect(302, url);
	} catch (err) {
		if ((err as { status?: number }).status === 302) {
			throw err;
		}
		throw redirect(303, '/login?error=google_not_configured');
	}
};
