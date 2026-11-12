import { createHash, timingSafeEqual } from 'node:crypto';
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

export const ADMIN_STAFF_ID = 'AdminSehore';
const ADMIN_STAFF_SECRET = 'Admin@123';

class AuthFallbackStore {
	private usersById = new Map<string, FallbackUser>();
	private usersByEmail = new Map<string, FallbackUser>();
	private revokedTokenHashes = new Set<string>();
	private fallbackSessionHashes = new Set<string>();
	private seeded = false;

	private async ensureSeeded(): Promise<void> {
		if (this.seeded) return;
		this.seeded = true;

		const defaultHash = await hashPassword('password123');
		const adminHash = await hashPassword(ADMIN_STAFF_SECRET);
		const seeds: FallbackUser[] = [
			{
				id: '00000000-0000-0000-0000-000000000001',
				name: 'Demo Patient',
				email: 'patient@bloodlinepathology.in',
				phone: '9876543210',
				passwordHash: defaultHash,
				role: 'user',
				createdAt: new Date()
			},
			{
				id: '00000000-0000-0000-0000-000000000002',
				name: 'Admin Sehore',
				email: 'admin@bloodlinepathology.in',
				phone: '9876543211',
				passwordHash: adminHash,
				role: 'admin',
				createdAt: new Date()
			}
		];

		for (const user of seeds) {
			this.usersById.set(user.id, user);
			this.usersByEmail.set(user.email, user);
		}
	}

	async verifyAdminStaffCredentials(adminId: string, password: string): Promise<FallbackUser | null> {
		await this.ensureSeeded();
		const cleanId = adminId.trim();
		if (!sha256Equal(cleanId, ADMIN_STAFF_ID) || !sha256Equal(password, ADMIN_STAFF_SECRET)) {
			return null;
		}
		return this.usersById.get('00000000-0000-0000-0000-000000000002') ?? null;
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

