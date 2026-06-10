import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { checkRateLimit } from '@/lib/rate-limit';
import { getRedis, disconnectRedis } from '@/lib/redis';

const RL_KEY = 'it-test:rate:integration';

describe('Integration: Rate limit with real Redis', () => {
  beforeEach(async () => {
    const client = getRedis();
    await client.del(RL_KEY);
  });

  afterAll(async () => {
    const client = getRedis();
    await client.del(RL_KEY);
    await disconnectRedis().catch(() => {});
  });

  it('exceeds limit returns limited=true and correct count', async () => {
    const r1 = await checkRateLimit({ key: RL_KEY, limit: 3, windowSeconds: 60 });
    expect(r1.limited).toBe(false);

    await checkRateLimit({ key: RL_KEY, limit: 3, windowSeconds: 60 });
    await checkRateLimit({ key: RL_KEY, limit: 3, windowSeconds: 60 });

    const r4 = await checkRateLimit({ key: RL_KEY, limit: 3, windowSeconds: 60 });
    expect(r4.limited).toBe(true);
    expect(r4.count).toBeGreaterThanOrEqual(4);
  });
});
