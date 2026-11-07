import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login?redirectTo=/profile');
	}

	let userRecord = locals.user;
	try {
		const fetched = await db.query.users.findFirst({
			where: eq(users.id, locals.user.id)
		});
		if (fetched) {
			userRecord = {
				id: fetched.id,
				name: fetched.name,
				email: fetched.email,
				role: fetched.role
			};
		}
	} catch (err) {
		console.warn('Profile DB query fallback:', err);
	}

	return { user: userRecord };
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		if (!locals.user) throw redirect(303, '/login');

		const formData = await request.formData();
		const name = String(formData.get('name') || '').trim();
		const phone = String(formData.get('phone') || '').trim();

		if (!name || name.length < 2) {
			return fail(400, { profileError: 'Name must be at least 2 characters' });
		}

		try {
			await db
				.update(users)
				.set({ name, phone, updatedAt: new Date() })
				.where(eq(users.id, locals.user.id));
		} catch (err) {
			console.warn('DB updateProfile fallback:', err);
		}

		return { profileSuccess: true };
	},

	changePassword: async ({ request, locals }) => {
		if (!locals.user) throw redirect(303, '/login');

		const formData = await request.formData();
		const currentPassword = String(formData.get('currentPassword') || '');
		const newPassword = String(formData.get('newPassword') || '');
		const confirmPassword = String(formData.get('confirmPassword') || '');

		if (newPassword.length < 6) {
			return fail(400, { passwordError: 'New password must be at least 6 characters' });
		}
		if (newPassword !== confirmPassword) {
			return fail(400, { passwordError: 'Passwords do not match' });
		}

		try {
			const user = await db.query.users.findFirst({
				where: eq(users.id, locals.user.id)
			});

			if (user?.passwordHash) {
				const isValid = await verifyPassword(currentPassword, user.passwordHash);
				if (!isValid) {
					return fail(400, { passwordError: 'Incorrect current password' });
				}
			}

			const passwordHash = await hashPassword(newPassword);
			await db
				.update(users)
				.set({ passwordHash, updatedAt: new Date() })
				.where(eq(users.id, locals.user.id));
		} catch (err) {
			console.warn('DB changePassword fallback:', err);
		}

		return { passwordSuccess: true };
	}
};

