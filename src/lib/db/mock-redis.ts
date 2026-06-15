interface CacheEntry {
  value: string;
  expiresAt?: number;
}

export class MockRedis {
  private store = new Map<string, CacheEntry>();
  private counters = new Map<string, number>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<'OK'> {
    const entry: CacheEntry = { value };

    if (ttlSeconds && ttlSeconds > 0) {
      entry.expiresAt = Date.now() + ttlSeconds * 1000;
    }

    this.store.set(key, entry);
    return 'OK';
  }

  async incr(key: string): Promise<number> {
    const current = this.counters.get(key) || 0;
    const next = current + 1;
    this.counters.set(key, next);
    return next;
  }

  async expire(key: string, seconds: number): Promise<number> {

    setTimeout(() => {
      this.counters.delete(key);
    }, seconds * 1000);
    return 1;
  }

  async del(key: string): Promise<number> {
    const existed = this.store.has(key) || this.counters.has(key);
    this.store.delete(key);
    this.counters.delete(key);
    return existed ? 1 : 0;
  }

  async hset(key: string, field: string, value: string): Promise<number> {

    const hashKey = `${key}:${field}`;
    await this.set(hashKey, value);
    return 1;
  }

  async hget(key: string, field: string): Promise<string | null> {
    const hashKey = `${key}:${field}`;
    return this.get(hashKey);
  }

  async flushAll(): Promise<'OK'> {
    this.store.clear();
    this.counters.clear();
    return 'OK';
  }

  getStats() {
    return {
      keys: this.store.size,
      counters: this.counters.size,
    };
  }
}

let mockRedisInstance: MockRedis | null = null;

export function getMockRedis(): MockRedis {
  if (!mockRedisInstance) {
    mockRedisInstance = new MockRedis();
  }
  return mockRedisInstance;
}

export function resetMockRedis() {
  if (mockRedisInstance) {
    mockRedisInstance.flushAll();
  } else {
    mockRedisInstance = new MockRedis();
  }
  return mockRedisInstance;
}
