import Redis from 'ioredis';

let redisClient: Redis | null = null;

function getRedisClient(): Redis {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    redisClient.on('error', (error) => {
      console.error('[redis] connection error:', error);
    });
  }
  return redisClient;
}

export function getRedis(): Redis {
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

const RATE_LIMIT_INCR_LUA = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('EXPIRE', KEYS[1], tonumber(ARGV[1]))
end
return current
`;

export async function rateLimitIncr(key: string, windowSeconds = 900): Promise<number> {
  const client = getRedisClient();
  const count = await client.eval(RATE_LIMIT_INCR_LUA, 1, key, String(windowSeconds));
  return typeof count === 'number' ? count : Number(count ?? 0);
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

function otpKey(email: string): string {
  return `otp:${email.toLowerCase()}`;
}

export async function storeOtp(email: string, code: string, ttlSeconds: number): Promise<void> {
  const client = getRedisClient();
  const key = otpKey(email);
  const pipeline = client.multi();
  pipeline.del(key);
  pipeline.hset(key, 'code', code, 'attempts', '0');
  pipeline.expire(key, ttlSeconds);
  await pipeline.exec();
}

export type OtpVerifyResult =
  | { status: 'ok' }
  | { status: 'expired' }
  | { status: 'too_many'; attempts: number }
  | { status: 'wrong'; attempts: number };

const VERIFY_OTP_LUA = `
local data = redis.call('HGETALL', KEYS[1])
if #data == 0 then return {-1, 0} end
local code = ''
local attempts = 0
for i = 1, #data, 2 do
  if data[i] == 'code' then code = data[i + 1] end
  if data[i] == 'attempts' then attempts = tonumber(data[i + 1]) or 0 end
end
local maxAttempts = tonumber(ARGV[2])
if attempts >= maxAttempts then
  redis.call('DEL', KEYS[1])
  return {-2, attempts}
end
if code == ARGV[1] then
  redis.call('DEL', KEYS[1])
  return {1, attempts}
end
local newAttempts = redis.call('HINCRBY', KEYS[1], 'attempts', 1)
return {0, newAttempts}
`;

export async function verifyOtpAtomic(email: string, code: string, maxAttempts: number): Promise<OtpVerifyResult> {
  const client = getRedisClient();
  const result = (await client.eval(VERIFY_OTP_LUA, 1, otpKey(email), code, String(maxAttempts))) as [number, number];
  const [flag, attempts] = result;
  if (flag === -1) return { status: 'expired' };
  if (flag === -2) return { status: 'too_many', attempts };
  if (flag === 1) return { status: 'ok' };
  return { status: 'wrong', attempts };
}

export async function deleteOtp(email: string): Promise<void> {
  const client = getRedisClient();
  await client.del(otpKey(email));
}

function resetOtpKey(email: string): string {
  return `otp:reset:${email.toLowerCase()}`;
}

export async function storeResetOtp(email: string, code: string, ttlSeconds: number): Promise<void> {
  const client = getRedisClient();
  const key = resetOtpKey(email);
  const pipeline = client.multi();
  pipeline.del(key);
  pipeline.hset(key, 'code', code, 'attempts', '0');
  pipeline.expire(key, ttlSeconds);
  await pipeline.exec();
}

export async function verifyResetOtpAtomic(email: string, code: string, maxAttempts: number): Promise<OtpVerifyResult> {
  const client = getRedisClient();
  const result = (await client.eval(VERIFY_OTP_LUA, 1, resetOtpKey(email), code, String(maxAttempts))) as [number, number];
  const [flag, attempts] = result;
  if (flag === -1) return { status: 'expired' };
  if (flag === -2) return { status: 'too_many', attempts };
  if (flag === 1) return { status: 'ok' };
  return { status: 'wrong', attempts };
}

export async function deleteResetOtp(email: string): Promise<void> {
  const client = getRedisClient();
  await client.del(resetOtpKey(email));
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

export async function deleteAvatar(userId: string): Promise<void> {
  const client = getRedisClient();
  await client.del(`avatar:${userId}`);
}
