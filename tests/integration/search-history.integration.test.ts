import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { getDb, disconnectMongo } from '@/lib/mongodb';
import { POST as searchHistoryPOST, GET as searchHistoryGET, DELETE as searchHistoryDELETEAll } from '@/app/api/search-history/route';

const TEST_USER = '507f1f77bcf86cd799439019';


vi.mock('@/lib/mongodb', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/mongodb')>();
  return {
    ...actual,
    getUserById: vi.fn().mockImplementation(async (userId: string) => {
      if (userId === TEST_USER) {
        return {
          _id: TEST_USER,
          id: TEST_USER,
          email: 'test-search-history@example.com',
          fullName: 'Search History Test User',
          role: 'USER',
          avatarUrl: null,
          isLocked: false,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any;
      }
      return actual.getUserById(userId);
    }),
  };
});

async function cleanSearchHistory() {
  const db = await getDb();
  await db.searchHistories.deleteMany({ userId: TEST_USER });
}

describe('Integration: Search History with real MongoDB', () => {
  beforeEach(async () => {
    await cleanSearchHistory();
  });

  afterAll(async () => {
    await cleanSearchHistory();
    await disconnectMongo?.().catch(() => {});
  });

  it('POST /api/search-history creates record (uses real DB)', async () => {
    const req = new Request('http://localhost/api/search-history', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-user-id': TEST_USER },
      body: JSON.stringify({ query: 'Hội An integration test', resultCount: 7 }),
    });

    const res = await searchHistoryPOST(req as any);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data?.query).toBe('Hội An integration test');

    const db = await getDb();
    const docs = await db.searchHistories.find({ userId: TEST_USER });
    expect(docs.length).toBeGreaterThan(0);
  });

  it('GET /api/search-history returns list', async () => {
    const db = await getDb();
    await db.searchHistories.insertOne({ userId: TEST_USER, query: 'Đà Lạt test', createdAt: new Date() });

    const req = new Request('http://localhost/api/search-history', {
      headers: { 'x-user-id': TEST_USER },
    });
    const res = await searchHistoryGET(req as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.some((d: any) => d.query.includes('Đà Lạt'))).toBe(true);
  });

  it('DELETE /api/search-history clears for user', async () => {
    const db = await getDb();
    await db.searchHistories.insertOne({ userId: TEST_USER, query: 'to be cleared', createdAt: new Date() });

    const req = new Request('http://localhost/api/search-history', {
      method: 'DELETE',
      headers: { 'x-user-id': TEST_USER },
    });
    const res = await searchHistoryDELETEAll(req as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);

    const remaining = await db.searchHistories.find({ userId: TEST_USER });
    expect(remaining.length).toBe(0);
  });
});
