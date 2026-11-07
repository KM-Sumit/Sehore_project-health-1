import { redirect } from '@sveltejs/kit';
import { getGoogleUser, verifyOAuthState } from '$lib/server/auth';
import { createSession } from '$lib/server/auth/sessions';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies, request }) => {
	const code = url.searchParams.get('code');
	const receivedState = url.searchParams.get('state');
	const expectedState = cookies.get('oauth_state');

	if (!code) {
		throw redirect(303, '/login?error=no_code');
	}

	// ── CSRF protection: verify state parameter ──
	if (!verifyOAuthState(receivedState, expectedState)) {
		// Clear the state cookie regardless
		cookies.delete('oauth_state', { path: '/' });
		throw redirect(303, '/login?error=oauth_state_mismatch');
	}

	// Clear the state cookie after verification
	cookies.delete('oauth_state', { path: '/' });

	try {
		const googleUser = await getGoogleUser(code);

		let user = await db.query.users.findFirst({
			where: eq(users.googleId, googleUser.googleId)
		});

		if (!user) {
			user = await db.query.users.findFirst({
				where: eq(users.email, googleUser.email.toLowerCase())
			});

			if (user) {
				await db
					.update(users)
					.set({ googleId: googleUser.googleId, avatarUrl: googleUser.avatarUrl })
					.where(eq(users.id, user.id));
			} else {
				const [created] = await db
					.insert(users)
					.values({
						name: googleUser.name,
						email: googleUser.email.toLowerCase(),
						googleId: googleUser.googleId,
						avatarUrl: googleUser.avatarUrl,
						role: 'user'
					})
					.returning();
				user = created;
			}
		}

		await createSession(
			{ id: user.id, name: user.name, email: user.email, role: user.role },
			{ request, url },
			cookies
		);

		throw redirect(303, '/dashboard');
	} catch (err) {
		if ((err as { status?: number }).status === 303) throw err;
		console.error('Google OAuth error:', err);
		throw redirect(303, '/login?error=oauth_failed');
	}
};
