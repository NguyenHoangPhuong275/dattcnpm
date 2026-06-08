import Redis from 'ioredis';

let redisClient: Redis | null = null;

function getRedisClient(): Redis {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    redisClient.on('error', (err) => {
      console.error('[Redis] Connection error:', err);
    });

    redisClient.on('connect', () => {
      console.log('[Redis] Connected successfully');
    });
  }
  return redisClient;
}

export function getRedis() {
  return getRedisClient();
}

export async function connectRedis(): Promise<'connected'> {
  const client = getRedisClient();
  if (client.status === 'ready' || client.status === 'connect') {
    return 'connected';
  }
  await client.connect();
  return 'connected';
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('[Redis] Disconnected');
  }
}

export async function cacheGet(key: string): Promise<string | null> {
  const client = getRedisClient();
  return client.get(key);
}

export async function cacheSet(key: string, value: string, ttlSeconds = 3600): Promise<'OK'> {
  const client = getRedisClient();
  if (ttlSeconds > 0) {
    await client.set(key, value, 'EX', ttlSeconds);
  } else {
    await client.set(key, value);
  }
  return 'OK';
}

export async function rateLimitIncr(key: string, windowSeconds = 900): Promise<number> {
  const client = getRedisClient();
  const count = await client.incr(key);

  if (count === 1) {
    await client.expire(key, windowSeconds);
  }
  return count;
}

export async function blacklistToken(jti: string, ttlSeconds: number): Promise<'OK'> {
  const client = getRedisClient();
  await client.set(`blacklist:${jti}`, '1', 'EX', ttlSeconds);
  return 'OK';
}

export async function isTokenBlacklisted(jti: string): Promise<boolean> {
  const client = getRedisClient();
  const val = await client.get(`blacklist:${jti}`);
  return val === '1';
}

const ONE_DAY_SECONDS = 86400;



export async function storeOTP(email: string, otpData: { otp: string; attempts: number }) {
  const client = getRedisClient();
  const key = `otp:${email.toLowerCase()}`;
  await client.set(key, JSON.stringify(otpData), 'EX', ONE_DAY_SECONDS);
}

export async function getOTP(email: string): Promise<{ otp: string; attempts: number } | null> {
  const client = getRedisClient();
  const key = `otp:${email.toLowerCase()}`;
  const raw = await client.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function deleteOTP(email: string) {
  const client = getRedisClient();
  const key = `otp:${email.toLowerCase()}`;
  await client.del(key);
}

export async function incrementOTPAttempts(email: string, currentData: { otp: string; attempts: number }) {
  const client = getRedisClient();
  const key = `otp:${email.toLowerCase()}`;
  currentData.attempts += 1;
  await client.set(key, JSON.stringify(currentData), 'EX', ONE_DAY_SECONDS);
  return currentData;
}

export async function storeAvatar(userId: string, dataUrl: string): Promise<string> {
  const client = getRedisClient();
  const key = `avatar:${userId}`;
  await client.set(key, dataUrl);
  return key;
}

export async function getAvatar(userId: string): Promise<string | null> {
  const client = getRedisClient();
  return client.get(`avatar:${userId}`);
}

export async function deleteAvatar(userId: string) {
  const client = getRedisClient();
  await client.del(`avatar:${userId}`);
}
