import Redis from 'ioredis';

import { env } from '@/lib/env';
import { normalizeEmail } from '@/lib/string';

const globalRedis = globalThis as unknown as { __redisClient?: Redis | null };

function getRedisClient(): Redis {
  if (!globalRedis.__redisClient) {
    const redisUrl = env.REDIS_URL;
    const isTest = process.env.NODE_ENV === 'test';
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: isTest ? 3 : 2,
      lazyConnect: true,
      ...(isTest ? {} : { connectTimeout: 3000, commandTimeout: 3000 }),
    });

    client.on('error', () => { });
    globalRedis.__redisClient = client;
  }
  return globalRedis.__redisClient;
}

export function getRedis(): Redis {
  return getRedisClient();
}

const CIRCUIT_COOLDOWN_MS = 15000;
let circuitOpenUntil = 0;

export function redisCircuitOpen(): boolean {
  if (process.env.NODE_ENV === 'test') return false;
  return Date.now() < circuitOpenUntil;
}

function tripCircuit(): void {
  if (process.env.NODE_ENV === 'test') return;
  circuitOpenUntil = Date.now() + CIRCUIT_COOLDOWN_MS;
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
  if (globalRedis.__redisClient) {
    await globalRedis.__redisClient.quit();
    globalRedis.__redisClient = null;
  }
}

export async function cacheGet(key: string): Promise<string | null> {
  if (redisCircuitOpen()) return null;
  try {
    const client = getRedisClient();
    return await client.get(key);
  } catch {
    tripCircuit();
    return null;
  }
}

export async function cacheSet(key: string, value: string, ttlSeconds = 3600): Promise<'OK'> {
  if (redisCircuitOpen()) return 'OK';
  try {
    const client = getRedisClient();
    if (ttlSeconds > 0) {
      await client.set(key, value, 'EX', ttlSeconds);
    } else {
      await client.set(key, value);
    }
  } catch {
    tripCircuit();
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
  if (redisCircuitOpen()) throw new Error('redis circuit open');
  try {
    const client = getRedisClient();
    const count = await client.eval(RATE_LIMIT_INCR_LUA, 1, key, String(windowSeconds));
    return typeof count === 'number' ? count : Number(count ?? 0);
  } catch (error) {
    tripCircuit();
    throw error;
  }
}

export async function blacklistToken(jti: string, ttlSeconds: number): Promise<'OK'> {
  const client = getRedisClient();
  await client.set(`blacklist:${jti}`, '1', 'EX', ttlSeconds);
  return 'OK';
}

export async function isTokenBlacklisted(jti: string): Promise<boolean> {
  if (redisCircuitOpen()) return false;
  try {
    const client = getRedisClient();
    const val = await client.get(`blacklist:${jti}`);
    return val === '1';
  } catch {
    tripCircuit();
    return false;
  }
}

function otpKey(email: string): string {
  return `otp:${normalizeEmail(email)}`;
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
  return `otp:reset:${normalizeEmail(email)}`;
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

export async function getAvatar(userId: string): Promise<string | null> {
  const client = getRedisClient();
  return client.get(`avatar:${userId}`);
}
