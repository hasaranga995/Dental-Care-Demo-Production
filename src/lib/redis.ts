import "server-only";
import { Redis } from "@upstash/redis";

let redisClient: Redis | null = null;

/**
 * Lazily instantiated Upstash Redis client. Returns `null` when the
 * environment isn't configured yet (e.g. local dev before secrets are
 * filled in), so callers should treat caching as best-effort.
 */
export function getRedis(): Redis | null {
  if (redisClient) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token || url.includes("xxxxxxxx")) {
    return null;
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

const CACHE_PREFIX = "dental-care";

export async function getCached<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const value = await redis.get<T>(`${CACHE_PREFIX}:${key}`);
    return value ?? null;
  } catch {
    return null;
  }
}

export async function setCached(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(`${CACHE_PREFIX}:${key}`, value, { ex: ttlSeconds });
  } catch {
    // Caching is best-effort; ignore failures.
  }
}

export async function invalidateCached(key: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.del(`${CACHE_PREFIX}:${key}`);
  } catch {
    // Ignore.
  }
}

/**
 * Simple fixed-window rate limiter backed by Redis. Falls back to allowing
 * the request when Redis isn't configured, so local development never
 * hard-fails on missing credentials.
 */
export async function rateLimit(
  identifier: string,
  limit = 5,
  windowSeconds = 60
): Promise<{ success: boolean; remaining: number }> {
  const redis = getRedis();
  if (!redis) return { success: true, remaining: limit };

  const key = `${CACHE_PREFIX}:rate-limit:${identifier}`;
  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }
    return { success: count <= limit, remaining: Math.max(0, limit - count) };
  } catch {
    return { success: true, remaining: limit };
  }
}
