import { SignJWT, jwtVerify } from 'jose';
import { eq, and, isNull } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { sessions, users } from '$lib/server/db/schema';

// ── Token hashing (Web Crypto, available in Bun) ──────────────────────────────

async function hashToken(token: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
	return Array.from(new Uint8Array(digest))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

// ── JWT helpers ───────────────────────────────────────────────────────────────

interface TokenPayload {
	id: string;
	name: string;
	email: string;
	role: string;
	type: 'access' | 'refresh';
}

function getSecret(): Uint8Array {
	const secret =
		env.JWT_SECRET || process.env.JWT_SECRET || 'Bloodline Pathology-default-secret-key-change-in-production';
	return new TextEncoder().encode(secret);
}

const ACCESS_TTL = env.SESSION_ACCESS_TTL || process.env.SESSION_ACCESS_TTL || '7d';
const REFRESH_TTL = env.SESSION_REFRESH_TTL || process.env.SESSION_REFRESH_TTL || '7d';

export async function signAccessToken(payload: Omit<TokenPayload, 'type'>): Promise<string> {
	return new SignJWT({ ...payload, type: 'access' })
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime(ACCESS_TTL)
		.sign(getSecret());
}

export async function signRefreshToken(payload: Omit<TokenPayload, 'type'>): Promise<string> {
	return new SignJWT({ ...payload, type: 'refresh' })
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime(REFRESH_TTL)
		.sign(getSecret());
}

export async function verifyJwt(token: string): Promise<TokenPayload | null> {
	try {
		const { payload } = await jwtVerify(token, getSecret());
		return payload as unknown as TokenPayload;
	} catch {
		return null;
	}
}

// ── Cookie options ────────────────────────────────────────────────────────────

const isProduction = (env.NODE_ENV || process.env.NODE_ENV || 'development') === 'production';

export function accessTokenCookieOptions(): { path: string; httpOnly: boolean; sameSite: 'strict'; secure: boolean; maxAge: number } {
	const ttlMs = parseTtlMs(ACCESS_TTL);
	return {
		path: '/',
		httpOnly: true,
		sameSite: 'strict' as const,
		secure: isProduction,
		maxAge: ttlMs
	};
}

export function refreshTokenCookieOptions(): { path: string; httpOnly: boolean; sameSite: 'strict'; secure: boolean; maxAge: number } {
	const ttlMs = parseTtlMs(REFRESH_TTL);
	return {
		path: '/',
		httpOnly: true,
		sameSite: 'strict' as const,
		secure: isProduction,
		maxAge: ttlMs
	};
}

function parseTtlMs(ttl: string): number {
	const match = ttl.match(/^(\d+)(h|d)$/);
	if (!match) return 60 * 60 * 24 * 7; // default 7 days
	const value = parseInt(match[1], 10);
	const unit = match[2];
	return unit === 'h' ? value * 60 * 60 : value * 60 * 60 * 24;
}

function getClientMeta(event: { request: Request; url: URL }): { ipAddress: string | null; userAgent: string | null } {
	const forwarded = event.request.headers.get('x-forwarded-for');
	const ipAddress = forwarded ? forwarded.split(',')[0].trim() : null;
	const userAgent = event.request.headers.get('user-agent') || null;
	return { ipAddress, userAgent };
}

// ── Session lifecycle ─────────────────────────────────────────────────────────

export interface AuthSession {
	id: string;
	userId: string;
	accessToken: string;
	refreshToken: string;
	accessTokenHash: string;
	refreshTokenHash: string;
	expiresAt: Date;
}

export async function createSession(
	user: { id: string; name: string; email: string; role: string },
	event: { request: Request; url: URL },
	cookies: { set: (name: string, value: string, opts: Record<string, unknown>) => void }
): Promise<AuthSession> {
	const { ipAddress, userAgent } = getClientMeta(event);

	const [accessToken, refreshToken] = await Promise.all([
		signAccessToken({ id: user.id, name: user.name, email: user.email, role: user.role }),
		signRefreshToken({ id: user.id, name: user.name, email: user.email, role: user.role })
	]);

	const [accessTokenHash, refreshTokenHash] = await Promise.all([
		hashToken(accessToken),
		hashToken(refreshToken)
	]);

	const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

	const [session] = await db
		.insert(sessions)
		.values({
			userId: user.id,
			accessTokenHash,
			refreshTokenHash,
			expiresAt,
			ipAddress,
			userAgent
		})
		.returning();

	cookies.set('session', accessToken, accessTokenCookieOptions());
	cookies.set('refresh_token', refreshToken, refreshTokenCookieOptions());

	return { ...session, accessToken, refreshToken, expiresAt: session.expiresAt };
}

/**
 * Verify the incoming request's session cookie against the DB.
 * Returns the user + session if valid and not revoked/expired.
 */
export async function getSessionFromRequest(event: {
	cookies: { get: (name: string) => string | undefined };
	request: Request;
	url: URL;
}): Promise<{ user: { id: string; name: string; email: string; role: string }; session: typeof sessions.$inferSelect } | null> {
	const token = event.cookies.get('session');
	if (!token) return null;

	const payload = await verifyJwt(token);
	if (!payload || payload.type !== 'access') return null;

	const tokenHash = await hashToken(token);

	const [session] = await db
		.select()
		.from(sessions)
		.where(and(eq(sessions.accessTokenHash, tokenHash), isNull(sessions.revokedAt)));

	if (!session) return null;

	if (session.expiresAt < new Date()) return null;

	// Attach user by joining
	const [user] = await db.select().from(users).where(eq(users.id, session.userId));
	if (!user) return null;

	return {
		user: { id: user.id, name: user.name, email: user.email, role: user.role },
		session
	};
}

/**
 * Rotate refresh token: validate current refresh token, revoke old session,
 * create a new session, set new cookies.
 */
export async function refreshSession(event: {
	cookies: { get: (name: string) => string | undefined; set: (name: string, value: string, opts: Record<string, unknown>) => void };
	request: Request;
	url: URL;
}): Promise<{
		user: { id: string; name: string; email: string; role: string };
		accessToken: string;
		session: typeof sessions.$inferSelect;
	} | null> {
	const refreshToken = event.cookies.get('refresh_token');
	if (!refreshToken) return null;

	const payload = await verifyJwt(refreshToken);
	if (!payload || payload.type !== 'refresh') return null;

	const refreshTokenHash = await hashToken(refreshToken);

	const [session] = await db
		.select()
		.from(sessions)
		.where(and(eq(sessions.refreshTokenHash, refreshTokenHash), isNull(sessions.revokedAt)));

	if (!session) return null;
	if (session.expiresAt < new Date()) return null;

	const [user] = await db.select().from(users).where(eq(users.id, session.userId));
	if (!user) return null;

	const { ipAddress, userAgent } = getClientMeta(event);

	// Revoke old session
	await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, session.id));

	// Create new session
	const [accessToken, newRefreshToken] = await Promise.all([
		signAccessToken({ id: user.id, name: user.name, email: user.email, role: user.role }),
		signRefreshToken({ id: user.id, name: user.name, email: user.email, role: user.role })
	]);

	const [newAccessHash, newRefreshHash] = await Promise.all([hashToken(accessToken), hashToken(newRefreshToken)]);

	const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

	const [newSession] = await db
		.insert(sessions)
		.values({
			userId: user.id,
			accessTokenHash: newAccessHash,
			refreshTokenHash: newRefreshHash,
			expiresAt,
			ipAddress,
			userAgent
		})
		.returning();

	event.cookies.set('session', accessToken, accessTokenCookieOptions());
	event.cookies.set('refresh_token', newRefreshToken, refreshTokenCookieOptions());

	return {
		user: { id: user.id, name: user.name, email: user.email, role: user.role },
		accessToken,
		session: newSession
	};
}

/**
 * Revoke a single session by access token hash.
 */
export async function revokeSession(accessToken: string): Promise<void> {
	const tokenHash = await hashToken(accessToken);
	await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.accessTokenHash, tokenHash));
}

/**
 * Revoke all sessions for a user (logout everywhere).
 */
export async function revokeAllSessions(userId: string): Promise<void> {
	await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.userId, userId));
}

/**
 * Clear session cookies.
 */
export function clearSessionCookies(cookies: { delete: (name: string, opts?: Record<string, unknown>) => void }): void {
	cookies.delete('session', { path: '/', secure: isProduction, sameSite: 'strict' });
	cookies.delete('refresh_token', { path: '/', secure: isProduction, sameSite: 'strict' });
}
