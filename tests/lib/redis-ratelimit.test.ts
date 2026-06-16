import { afterAll, describe, expect, it } from 'vitest';
import { rateLimitIncr, getRedis, connectRedis, disconnectRedis } from '@/lib/db';

function uniqueKey(): string {
  return `rl-test:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

describe('rateLimitIncr atomic TTL (Redis)', () => {
  afterAll(async () => {
    await disconnectRedis().catch(() => {});
  });

  it('sets a positive TTL atomically on the first increment', async () => {
    await connectRedis();
    const key = uniqueKey();

    const count = await rateLimitIncr(key, 60);
    expect(count).toBe(1);

    const ttl = await getRedis().ttl(key);
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(60);

    await getRedis().del(key);
  });

  it('keeps a valid TTL across subsequent increments (never stuck at -1)', async () => {
    await connectRedis();
    const key = uniqueKey();

    await rateLimitIncr(key, 60);
    const count = await rateLimitIncr(key, 60);
    expect(count).toBe(2);

    const ttl = await getRedis().ttl(key);
    expect(ttl).toBeGreaterThan(0);

    await getRedis().del(key);
  });
});
