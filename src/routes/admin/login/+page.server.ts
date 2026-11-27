import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { authFallbackStore, getAdminCredentials } from '$lib/server/auth/fallbackStore';
import { createSession } from '$lib/server/auth/sessions';

function safeAdminRedirect(raw: string | null): string {
	if (!raw || !raw.startsWith('/admin') || raw.startsWith('//') || raw === '/admin/login') {
		return '/admin';
	}
	return raw;
}

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user?.role === 'admin') {
		throw redirect(303, safeAdminRedirect(url.searchParams.get('redirectTo')));
	}
	return {
		redirectTo: safeAdminRedirect(url.searchParams.get('redirectTo')),
		configured: Boolean(getAdminCredentials()),
		currentUser: locals.user
			? { email: locals.user.email, role: locals.user.role }
			: null
	};
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const formData = await request.formData();
		const adminId = String(formData.get('adminId') || '').trim();
		const password = String(formData.get('password') || '');

		if (!adminId || !password) {
			return fail(400, {
				adminId,
				error: 'Please enter both Admin ID and password.'
			});
		}

		if (!getAdminCredentials()) {
			return fail(503, {
				adminId,
				error: 'Admin login is not configured on this deployment. Set ADMIN_STAFF_ID and ADMIN_STAFF_SECRET in Vercel.'
			});
		}

		const adminUser = await authFallbackStore.verifyAdminStaffCredentials(adminId, password);
		if (!adminUser) {
			return fail(401, {
				adminId,
				error: 'Invalid Admin ID or password.'
			});
		}

		let reqUrl: URL;
		try {
			reqUrl = new URL(request.url);
		} catch {
			reqUrl = new URL('http://localhost');
		}

		await createSession(
			{
				id: adminUser.id,
				name: adminUser.name,
				email: adminUser.email,
				role: adminUser.role
			},
			{ request, url: reqUrl },
			cookies
		);

		throw redirect(303, safeAdminRedirect(url.searchParams.get('redirectTo')));
	}
};

