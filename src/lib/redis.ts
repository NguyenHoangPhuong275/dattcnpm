import { getMockRedis, resetMockRedis, MockRedis } from '../database/mock-redis';

export const redis = getMockRedis();

export function getRedis(): MockRedis {
  return getMockRedis();
}

export function resetRedis() {
  return resetMockRedis();
}

export async function connectRedis(): Promise<'connected'> {
  console.log('[MOCK] Redis connected (in-memory)');
  return 'connected';
}

export async function disconnectRedis(): Promise<void> {
  console.log('[MOCK] Redis disconnected');
}

export async function cacheGet(key: string): Promise<string | null> {
  return redis.get(key);
}

export async function cacheSet(key: string, value: string, ttlSeconds = 3600): Promise<'OK'> {
  return redis.set(key, value, ttlSeconds);
}

export async function rateLimitIncr(key: string, windowSeconds = 900): Promise<number> {
  const count = await redis.incr(key);
  await redis.expire(key, windowSeconds);
  return count;
}

export async function blacklistToken(jti: string, ttlSeconds: number): Promise<'OK'> {
  return redis.set(`blacklist:${jti}`, '1', ttlSeconds);
}

export async function isTokenBlacklisted(jti: string): Promise<boolean> {
  const val = await redis.get(`blacklist:${jti}`);
  return val === '1';
}
