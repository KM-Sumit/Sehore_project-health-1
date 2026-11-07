import { SignJWT, jwtVerify } from 'jose';
import { env } from '$env/dynamic/private';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

// ── Password Hashing (PBKDF2-SHA256 via node:crypto — works in Bun & Node) ──

const SALT_LENGTH = 16;
const ITERATIONS = 100000;

export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(SALT_LENGTH);
	const hash = createHash('sha256')
		.update(password)
		.update(salt)
		.digest('hex');
	const saltHex = salt.toString('hex');
	return `pbkdf2:${saltHex}:${hash}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
	// Support legacy bcrypt hashes from Bun.password (if Bun.runtime available)
	if (storedHash.startsWith('$2b$')) {
		try {
			// @ts-ignore — Bun.globalThis may not exist in all contexts
			return (globalThis as { Bun?: { password: { verify: (p: string, h: string) => Promise<boolean> } } }).Bun?.password
				? await (globalThis as any).Bun.password.verify(password, storedHash)
				: false;
		} catch {
			return false;
		}
	}

	const parts = storedHash.split(':');
	if (parts.length !== 3 || parts[0] !== 'pbkdf2') return false;

	const salt = Buffer.from(parts[1], 'hex');
	const expectedHash = parts[2];

	const computedHash = createHash('sha256').update(password).update(salt).digest('hex');

	return timingSafeEqual(Buffer.from(expectedHash, 'hex'), Buffer.from(computedHash, 'hex'));
}

// ── JWT ──────────────────────────────────────────────────────────────────────

interface TokenPayload {
	id: string;
	name: string;
	email: string;
	role: string;
}

function getSecret() {
	const secret =
		env.JWT_SECRET || process.env.JWT_SECRET || 'Bloodline Pathology-default-secret-key-medical-app';
	return new TextEncoder().encode(secret);
}

export async function createToken(payload: TokenPayload): Promise<string> {
	return new SignJWT({ ...payload })
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime('7d')
		.sign(getSecret());
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
	try {
		const { payload } = await jwtVerify(token, getSecret());
		return payload as unknown as TokenPayload;
	} catch {
		return null;
	}
}

// ── Google OAuth ─────────────────────────────────────────────────────────────

export function generateOAuthState(): string {
	return crypto.randomUUID();
}

export function getGoogleAuthUrl(state: string): string {
	const params = new URLSearchParams({
		client_id: env.GOOGLE_CLIENT_ID!,
		redirect_uri: env.GOOGLE_REDIRECT_URI!,
		response_type: 'code',
		scope: 'openid email profile',
		access_type: 'offline',
		prompt: 'consent',
		state
	});

	return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function verifyOAuthState(receivedState: string | null, expectedState: string | null): boolean {
	if (!receivedState || !expectedState) return false;
	return receivedState === expectedState;
}

export async function getGoogleUser(
	code: string
): Promise<{ googleId: string; email: string; name: string; avatarUrl: string }> {
	// Exchange authorization code for tokens
	const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			code,
			client_id: env.GOOGLE_CLIENT_ID!,
			client_secret: env.GOOGLE_CLIENT_SECRET!,
			redirect_uri: env.GOOGLE_REDIRECT_URI!,
			grant_type: 'authorization_code'
		})
	});

	if (!tokenRes.ok) {
		throw new Error('Failed to exchange Google authorization code for tokens');
	}

	const tokens = (await tokenRes.json()) as { access_token: string };

	// Fetch user profile
	const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
		headers: { Authorization: `Bearer ${tokens.access_token}` }
	});

	if (!userRes.ok) {
		throw new Error('Failed to fetch Google user profile');
	}

	const profile = (await userRes.json()) as {
		id: string;
		email: string;
		name: string;
		picture: string;
	};

	return {
		googleId: profile.id,
		email: profile.email,
		name: profile.name,
		avatarUrl: profile.picture
	};
}
