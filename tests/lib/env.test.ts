import { describe, expect, it } from 'vitest';
import { parseEnv } from '@/lib/env';

const validEnv = {
  NODE_ENV: 'production',
  JWT_SECRET: 'a-very-long-secret',
  MONGODB_URI: 'mongodb://localhost:27017/app',
  REDIS_URL: 'redis://localhost:6379',
  WEBHOOK_SECRET: 'webhook-secret',
} satisfies NodeJS.ProcessEnv;

describe('env validation (parseEnv)', () => {
  it('parses a fully valid env and applies defaults for optional vars', () => {
    const env = parseEnv(validEnv);
    expect(env.JWT_SECRET).toBe('a-very-long-secret');
    expect(env.MONGODB_URI).toBe('mongodb://localhost:27017/app');
    expect(env.WEBHOOK_IP_ALLOWLIST).toBe('');
    expect(env.TRUSTED_PROXY_CIDRS).toBe('');
    expect(env.CRON_SECRET).toBeUndefined();
  });

  it('throws and names the missing required variable', () => {
    const { JWT_SECRET, ...withoutJwt } = validEnv;
    void JWT_SECRET;
    expect(() => parseEnv(withoutJwt)).toThrowError(/JWT_SECRET/);
  });

  it('lists every missing required variable in the error', () => {
    try {
      parseEnv({ NODE_ENV: 'production' });
      throw new Error('expected parseEnv to throw');
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toMatch(/JWT_SECRET/);
      expect(message).toMatch(/MONGODB_URI/);
      expect(message).toMatch(/REDIS_URL/);
      expect(message).toMatch(/WEBHOOK_SECRET/);
    }
  });

  it('rejects an empty required variable', () => {
    expect(() => parseEnv({ ...validEnv, WEBHOOK_SECRET: '' })).toThrowError(/WEBHOOK_SECRET/);
  });

  it('falls back to MONGO_URI when MONGODB_URI is absent', () => {
    const { MONGODB_URI, ...rest } = validEnv;
    void MONGODB_URI;
    const env = parseEnv({ ...rest, MONGO_URI: 'mongodb://localhost:27017/legacy' });
    expect(env.MONGODB_URI).toBe('mongodb://localhost:27017/legacy');
  });
});
