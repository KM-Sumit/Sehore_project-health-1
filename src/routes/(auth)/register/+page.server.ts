import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { registerUserAccount } from '$lib/server/auth/accounts';

function safeRedirectTarget(raw: string | null): string {
	if (!raw || !raw.startsWith('/') || raw.startsWith('//')) {
		return '/dashboard?tab=appointments';
	}
	return raw;
}

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) {
		throw redirect(303, '/dashboard');
	}
	return {
		prefill: {
			name: url.searchParams.get('name') || '',
			email: url.searchParams.get('email') || '',
			phone: url.searchParams.get('phone') || '',
			appointmentId: url.searchParams.get('appointmentId') || ''
		}
	};
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const formData = await request.formData();
		const name = String(formData.get('name') || '').trim();
		const email = String(formData.get('email') || '').trim().toLowerCase();
		const phone = String(formData.get('phone') || '').trim();
		const password = String(formData.get('password') || '');
		const confirmPassword = String(formData.get('confirmPassword') || '');
		const appointmentId = String(formData.get('appointmentId') || '').trim() || null;

		const result = await registerUserAccount(
			{ name, email, phone, password, confirmPassword, appointmentId },
			{ request, cookies }
		);

		if (!result.ok) {
			return fail(result.status, {
				name,
				email,
				phone,
				error: result.error
			});
		}

		throw redirect(303, safeRedirectTarget(url.searchParams.get('redirectTo')));
	}
};
