import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb, disconnectMongo } from '@/lib/mongodb';
import { connectRedis, disconnectRedis, cacheGet, cacheSet, rateLimitIncr } from '@/lib/redis';

describe('Integration: MongoDB & Redis connection (real)', () => {
  beforeAll(async () => {
    await getDb();
    await connectRedis();
  });

  afterAll(async () => {
    await disconnectMongo?.().catch(() => {});
    await disconnectRedis().catch(() => {});
  });

  it('MongoDB can write and read a document', async () => {
    const db = await getDb();
    const testId = '507f1f77bcf86cd799439011';
    const testDoc = {
      _id: testId,
      action: 'TEST_ACTION',
      targetType: 'TEST_TARGET',
      metadata: { value: 'hello-integration', ts: new Date() }
    };

    await db.auditLogs.insertOne(testDoc as any);
    const found = await db.auditLogs.findById(testId);

    expect(found).toBeTruthy();
    expect(String(found?._id)).toBe(testId);

    await db.auditLogs.deleteOne(testId);
  });

  it('Redis can set/get with TTL and rateLimitIncr works', async () => {
    const key = 'it-test:redis:counter';
    await cacheSet(key, '42', 10);
    const val = await cacheGet(key);
    expect(val).toBe('42');

    const count1 = await rateLimitIncr('it-test:rl:key', 60);
    const count2 = await rateLimitIncr('it-test:rl:key', 60);
    expect(count2).toBeGreaterThanOrEqual(count1);

    const client = (await import('@/lib/redis')).getRedis();
    await client.del(key);
    await client.del('it-test:rl:key');
  });
});
