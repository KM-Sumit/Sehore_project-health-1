import { createHash, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { hashPassword } from './index';

export interface FallbackUser {
	id: string;
	name: string;
	email: string;
	phone: string | null;
	passwordHash: string;
	role: 'user' | 'admin' | 'doctor';
	createdAt: Date;
}

function sha256Equal(a: string, b: string): boolean {
	const digestA = createHash('sha256').update(a).digest();
	const digestB = createHash('sha256').update(b).digest();
	return timingSafeEqual(digestA, digestB);
}

export const ADMIN_USER_ID = '00000000-0000-0000-0000-000000000002';
const DEMO_PATIENT_ID = '00000000-0000-0000-0000-000000000001';
const DEFAULT_ADMIN_EMAIL = 'admin@bloodlinepathology.in';

// Local-development convenience only. Production never falls back to these:
// when ADMIN_STAFF_ID / ADMIN_STAFF_SECRET are missing in production, admin
// login is disabled instead of exposing a public default password.
const DEV_ADMIN_ID = 'AdminSehore';
const DEV_ADMIN_SECRET = 'Admin@123';

function isProductionRuntime(): boolean {
	return (
		env.NODE_ENV === 'production' ||
		process.env.NODE_ENV === 'production' ||
		process.env.VERCEL === '1'
	);
}

export interface AdminCredentials {
	id: string;
	secret: string;
	email: string;
}

/**
 * Admin portal credentials come from the deployment environment
 * (Vercel: ADMIN_STAFF_ID, ADMIN_STAFF_SECRET, ADMIN_EMAIL).
 * Returns null when they are not configured in production.
 */
export function getAdminCredentials(): AdminCredentials | null {
	const id = (env.ADMIN_STAFF_ID ?? '').trim();
	const secret = (env.ADMIN_STAFF_SECRET ?? '').trim();
	const email = ((env.ADMIN_EMAIL ?? '').trim() || DEFAULT_ADMIN_EMAIL).toLowerCase();

	if (id && secret) {
		return { id, secret, email };
	}

	if (isProductionRuntime()) {
		return null;
	}

	return { id: DEV_ADMIN_ID, secret: DEV_ADMIN_SECRET, email };
}

class AuthFallbackStore {
	private usersById = new Map<string, FallbackUser>();
	private usersByEmail = new Map<string, FallbackUser>();
	private revokedTokenHashes = new Set<string>();
	private fallbackSessionHashes = new Set<string>();
	private seeded = false;

	private async ensureSeeded(): Promise<void> {
		if (this.seeded) return;
		this.seeded = true;

		const seeds: FallbackUser[] = [];

		// Demo patient exists only outside production so a known password can
		// never be used against a live deployment.
		if (!isProductionRuntime()) {
			seeds.push({
				id: DEMO_PATIENT_ID,
				name: 'Demo Patient',
				email: 'patient@bloodlinepathology.in',
				phone: '9876543210',
				passwordHash: await hashPassword('password123'),
				role: 'user',
				createdAt: new Date()
			});
		}

		const admin = getAdminCredentials();
		if (admin) {
			seeds.push({
				id: ADMIN_USER_ID,
				name: 'Admin Sehore',
				email: admin.email,
				phone: '9876543211',
				passwordHash: await hashPassword(admin.secret),
				role: 'admin',
				createdAt: new Date()
			});
		}

		for (const user of seeds) {
			this.usersById.set(user.id, user);
			this.usersByEmail.set(user.email, user);
		}
	}

	async verifyAdminStaffCredentials(adminId: string, password: string): Promise<FallbackUser | null> {
		const admin = getAdminCredentials();
		if (!admin) return null;

		await this.ensureSeeded();
		const cleanId = adminId.trim();
		if (!sha256Equal(cleanId, admin.id) || !sha256Equal(password, admin.secret)) {
			return null;
		}
		return this.usersById.get(ADMIN_USER_ID) ?? null;
	}

	async getUserCount(): Promise<number> {
		await this.ensureSeeded();
		return this.usersById.size;
	}

	async findUserByEmail(email: string): Promise<FallbackUser | null> {
		await this.ensureSeeded();
		return this.usersByEmail.get(email.trim().toLowerCase()) ?? null;
	}

	async findUserById(id: string): Promise<FallbackUser | null> {
		await this.ensureSeeded();
		return this.usersById.get(id) ?? null;
	}

	async createUser(input: {
		id?: string;
		name: string;
		email: string;
		phone?: string | null;
		passwordHash: string;
		role?: 'user' | 'admin' | 'doctor';
	}): Promise<FallbackUser> {
		await this.ensureSeeded();
		const normalizedEmail = input.email.trim().toLowerCase();
		const user: FallbackUser = {
			id: input.id ?? crypto.randomUUID(),
			name: input.name.trim(),
			email: normalizedEmail,
			phone: input.phone?.trim() || null,
			passwordHash: input.passwordHash,
			role: input.role ?? 'user',
			createdAt: new Date()
		};
		this.usersById.set(user.id, user);
		this.usersByEmail.set(normalizedEmail, user);
		return user;
	}

	async updateUser(
		id: string,
		updates: { name?: string; phone?: string | null; passwordHash?: string }
	): Promise<FallbackUser | null> {
		await this.ensureSeeded();
		const existing = this.usersById.get(id);
		if (!existing) return null;
		if (updates.name !== undefined) existing.name = updates.name;
		if (updates.phone !== undefined) existing.phone = updates.phone;
		if (updates.passwordHash !== undefined) existing.passwordHash = updates.passwordHash;
		return existing;
	}

	revokeTokenHash(hash: string): void {
		this.revokedTokenHashes.add(hash);
		this.fallbackSessionHashes.delete(hash);
	}

	isTokenRevoked(hash: string): boolean {
		return this.revokedTokenHashes.has(hash);
	}

	addFallbackSessionHash(hash: string): void {
		this.fallbackSessionHashes.add(hash);
	}

	hasFallbackSessionHash(hash: string): boolean {
		return this.fallbackSessionHashes.has(hash);
	}
}

export const authFallbackStore = new AuthFallbackStore();

