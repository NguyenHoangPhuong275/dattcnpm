import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { getDb, disconnectMongo } from '@/lib/db';
import { POST as favoritesPOST } from '@/app/api/favorites/route';

const TEST_USER = '507f1f77bcf86cd799439020';

vi.mock('@/lib/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/db')>();
  return {
    ...actual,
    getUserById: vi.fn().mockImplementation(async (userId: string) => {
      if (userId === TEST_USER) {
        return {
          _id: TEST_USER,
          id: TEST_USER,
          email: 'fav-test@example.com',
          fullName: 'Favorite Test User',
          role: 'USER',
          isLocked: false,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as never;
      }
      return actual.getUserById(userId);
    }),
  };
});

async function cleanup() {
  const db = await getDb();
  await db.favorites.deleteMany({ userId: TEST_USER });
}

function makeReq(placeId: string) {
  return new Request('http://localhost/api/favorites', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-user-id': TEST_USER },
    body: JSON.stringify({ placeId }),
  });
}

describe('Integration: Favorites idempotency / race', () => {
  beforeEach(cleanup);
  afterAll(async () => {
    await cleanup();
    await disconnectMongo?.().catch(() => {});
  });

  it('does not create a duplicate favorite when saved twice', async () => {
    const db = await getDb();
    const place = await db.places.insertOne({ name: 'Vịnh Hạ Long', type: 'custom', lat: 0, lng: 0, ratingAvg: 0, ratingCount: 0 });
    const placeId = String(place._id);

    const first = await favoritesPOST(makeReq(placeId) as never);
    expect(first.status).toBe(201);

    const second = await favoritesPOST(makeReq(placeId) as never);
    expect([200, 201]).toContain(second.status);
    const secondBody = await second.json();
    expect(secondBody.success).toBe(true);

    const favs = await db.favorites.find({ userId: TEST_USER, placeId });
    expect(favs.length).toBe(1);
  });

  it('stays idempotent under concurrent saves (unique index + 11000 handling)', async () => {
    const db = await getDb();
    const place = await db.places.insertOne({ name: 'Phố cổ Hội An', type: 'custom', lat: 0, lng: 0, ratingAvg: 0, ratingCount: 0 });
    const placeId = String(place._id);

    const results = await Promise.all(
      Array.from({ length: 5 }, () => favoritesPOST(makeReq(placeId) as never))
    );

    for (const res of results) {
      expect(res.status).toBeLessThan(500);
    }

    const favs = await db.favorites.find({ userId: TEST_USER, placeId });
    expect(favs.length).toBe(1);
  });
});
