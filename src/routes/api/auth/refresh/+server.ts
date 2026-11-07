import { redirect } from '@sveltejs/kit';
import { refreshSession, clearSessionCookies } from '$lib/server/auth/sessions';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies, request }) => {
	const refreshed = await refreshSession({
		cookies,
		request,
		url: new URL(request.url)
	});

	if (!refreshed) {
		clearSessionCookies(cookies);
		throw redirect(303, '/login');
	}

	return new Response(
		JSON.stringify({ ok: true, user: refreshed.user }),
		{ status: 200, headers: { 'content-type': 'application/json' } }
	);
};
