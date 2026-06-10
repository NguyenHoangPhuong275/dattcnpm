import { describe, beforeAll, afterAll, expect, it } from 'vitest';
import { connectMongo, disconnectMongo, getDb } from '@/lib/mongodb';
import { connectRedis, disconnectRedis, getRedis } from '@/lib/redis';
import { checkRateLimit } from '@/lib/rate-limit';
import { signAuthToken, verifyAuthToken } from '@/lib/auth';

beforeAll(async () => {
  if (!process.env.MONGODB_URI) {
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/smart-travel-guide-test';
  }
  if (!process.env.REDIS_URL) {
    process.env.REDIS_URL = 'redis://127.0.0.1:6379/15';
  }
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'integration-test-secret-key-that-is-long-enough';
  }

  await connectMongo();
  await connectRedis();
});

afterAll(async () => {
  const db = await getDb();
  await db.users.reset();
  await db.searchHistories.reset();

  const redis = getRedis();
  await redis.flushdb();

  await disconnectMongo();
  await disconnectRedis();
});

describe('Integration Tests - MongoDB & Redis', () => {
  describe('MongoDB Real Connection', () => {
    it('should successfully connect, insert, query and delete document in MongoDB', async () => {
      const db = await getDb();

      await db.users.reset();

      const inserted = await db.users.insertOne({
        email: 'test.integration@example.com',
        passwordHash: 'hashed_password',
        fullName: 'Integration Test User',
        role: 'USER',
        isLocked: false,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(inserted).toBeDefined();
      expect(inserted._id).toBeDefined();
      expect(inserted.email).toBe('test.integration@example.com');

      const found = await db.users.findOne({ email: 'test.integration@example.com' });
      expect(found).toBeDefined();
      expect(found?.fullName).toBe('Integration Test User');

      const updated = await db.users.updateOne(inserted._id, { fullName: 'Updated Test User' });
      expect(updated).toBeDefined();
      expect(updated?.fullName).toBe('Updated Test User');

      const deleted = await db.users.deleteOne(inserted._id);
      expect(deleted).toBe(true);

      const foundAfterDelete = await db.users.findOne({ email: 'test.integration@example.com' });
      expect(foundAfterDelete).toBeUndefined();
    });
  });

  describe('Redis Real Connection', () => {
    it('should successfully connect, set, get, check TTL, and delete keys in Redis', async () => {
      const redis = getRedis();
      const testKey = 'test:integration:key';
      const testValue = 'hello-redis';

      await redis.set(testKey, testValue, 'EX', 10);

      const value = await redis.get(testKey);
      expect(value).toBe(testValue);

      const ttl = await redis.ttl(testKey);
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(10);

      await redis.del(testKey);

      const deletedValue = await redis.get(testKey);
      expect(deletedValue).toBeNull();
    });
  });

  describe('Search History Integration', () => {
    it('should save and fetch search history properly from MongoDB', async () => {
      const db = await getDb();
      await db.searchHistories.reset();

      const testUserId = '507f1f77bcf86cd799439011';

      const created = await db.searchHistories.insertOne({
        userId: testUserId,
        query: 'Hà Nội du lịch',
        lat: 21.0285,
        lng: 105.8542,
        resultCount: 12,
        metadata: { source: 'nominatim' },
        createdAt: new Date(),
      });

      expect(created).toBeDefined();
      expect(created._id).toBeDefined();

      const list = await db.searchHistories.find({ userId: testUserId });
      expect(list).toHaveLength(1);
      expect(list[0].query).toBe('Hà Nội du lịch');
      expect(list[0].lat).toBe(21.0285);
      expect(list[0].resultCount).toBe(12);

      const deleted = await db.searchHistories.deleteOne(created._id);
      expect(deleted).toBe(true);

      const listAfterDelete = await db.searchHistories.find({ userId: testUserId });
      expect(listAfterDelete).toHaveLength(0);
    });
  });

  describe('Rate Limiter Integration', () => {
    it('should successfully enforce rate limit and return RATE_LIMITED when threshold is exceeded', async () => {
      const testKey = 'rl:test:integration:limit';
      const redis = getRedis();
      await redis.del(testKey);

      const limit = 2;
      const windowSeconds = 60;

      const call1 = await checkRateLimit({ key: testKey, limit, windowSeconds });
      expect(call1.limited).toBe(false);
      expect(call1.count).toBe(1);

      const call2 = await checkRateLimit({ key: testKey, limit, windowSeconds });
      expect(call2.limited).toBe(false);
      expect(call2.count).toBe(2);

      const call3 = await checkRateLimit({ key: testKey, limit, windowSeconds });
      expect(call3.limited).toBe(true);
      expect(call3.count).toBe(3);

      const ttl = await redis.ttl(testKey);
      expect(ttl).toBeGreaterThan(0);

      await redis.del(testKey);
    });
  });

  describe('Auth Token Integration', () => {
    it('should sign and verify auth tokens successfully', async () => {
      const payload = {
        id: 'user_integration_test_001',
        email: 'user.test@example.com',
        fullName: 'Token User',
        role: 'USER' as const,
      };

      const token = await signAuthToken(payload);
      expect(token).toBeDefined();

      const verified = await verifyAuthToken(token);
      expect(verified).toBeDefined();
      expect(verified?.id).toBe(payload.id);
      expect(verified?.email).toBe(payload.email);
    });
  });
});
