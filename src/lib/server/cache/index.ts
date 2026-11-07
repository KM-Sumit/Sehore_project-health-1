import { env } from '$env/dynamic/private';
import Redis from 'ioredis';

/**
 * Cache interface: Uses Redis if REDIS_URL is configured and reachable,
 * otherwise transparently falls back to high-performance in-memory Map cache.
 */

interface CacheEntry<T> {
	value: T;
	expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

// ── Redis client (lazy, optional) ──
let redis: Redis | null = null;

function getRedis(): Redis | null {
	if (redis !== null) return redis;
	const redisUrl = env.REDIS_URL || process.env.REDIS_URL;
	if (!redisUrl) return null;
	try {
		redis = new Redis(redisUrl, {
			lazyConnect: true,
			maxRetriesPerRequest: 1,
			connectTimeout: 1000,
			retryStrategy: () => null // Don't retry — fall back to memory
		});
		return redis;
	} catch {
		return null;
	}
}

async function redisIsAvailable(): Promise<boolean> {
	const client = getRedis();
	if (!client) return false;
	try {
		await client.connect();
		await client.ping();
		return true;
	} catch {
		redis = null;
		return false;
	}
}

// ── Memory cache helpers ──
function memoryGet<T>(key: string): T | null {
	const entry = memoryCache.get(key);
	if (!entry) return null;
	if (Date.now() > entry.expiresAt) {
		memoryCache.delete(key);
		return null;
	}
	return entry.value as T;
}

function memorySet<T>(key: string, value: T, ttlSeconds: number): void {
	memoryCache.set(key, {
		value,
		expiresAt: Date.now() + ttlSeconds * 1000
	});
}

function memoryDelete(key: string): void {
	memoryCache.delete(key);
}

// ── Size limit for memory cache (prevent memory leak) ──
const MAX_MEMORY_CACHE_SIZE = 1000;

function memorySetWithLimit<T>(key: string, value: T, ttlSeconds: number): void {
	if (memoryCache.size >= MAX_MEMORY_CACHE_SIZE && !memoryCache.has(key)) {
		// Remove oldest entry (first key)
		const firstKey = memoryCache.keys().next().value;
		if (firstKey !== undefined) memoryCache.delete(firstKey);
	}
	memorySet(key, value, ttlSeconds);
}

// ── Public API ──
export async function getCache<T>(key: string): Promise<T | null> {
	if (await redisIsAvailable()) {
		try {
			const raw = await (getRedis() as Redis).get(key);
			if (!raw) return null;
			return JSON.parse(raw) as T;
		} catch {
			// Fall through to memory
		}
	}
	return memoryGet<T>(key);
}

export async function setCache<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
	if (await redisIsAvailable()) {
		try {
			await (getRedis() as Redis).setex(key, ttlSeconds, JSON.stringify(value));
			return;
		} catch {
			// Fall through to memory
		}
	}
	memorySetWithLimit(key, value, ttlSeconds);
}

export async function deleteCache(key: string): Promise<void> {
	if (await redisIsAvailable()) {
		try {
			await (getRedis() as Redis).del(key);
		} catch {
			// Ignore
		}
	}
	memoryDelete(key);
}

export async function flushCache(): Promise<void> {
	if (await redisIsAvailable()) {
		try {
			await (getRedis() as Redis).flushall();
		} catch {
			// Ignore
		}
	}
	memoryCache.clear();
}
