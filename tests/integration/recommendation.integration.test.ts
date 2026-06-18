import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { hash } from 'bcryptjs';
import { getDb, disconnectMongo } from '@/lib/db';
import { GET as recommendedGET } from '@/app/api/places/recommended/route';
import { PATCH as prefsPATCH } from '@/app/api/users/me/preferences/route';
import { scorePlace, hasPreferences } from '@/lib/recommendation';

const MARK = `rec-${Date.now()}`;
let userId = '';
let beachPlaceId = '';
let historyPlaceId = '';

beforeAll(async () => {
  const db = await getDb();
  const u = await db.users.insertOne({
    email: `${MARK}@example.com`, passwordHash: await hash('password123', 8), fullName: 'Rec', role: 'USER',
    isLocked: false, emailVerified: true, createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
  });
  userId = String(u._id);

  const beach = await db.places.insertOne({ name: `${MARK}-beach`, type: 'beach', lat: 1, lng: 1, tags: ['beach', MARK], ratingAvg: 4, ratingCount: 1 });
  const history = await db.places.insertOne({ name: `${MARK}-history`, type: 'history', lat: 2, lng: 2, tags: ['history', MARK], ratingAvg: 5, ratingCount: 100 });
  beachPlaceId = String(beach._id);
  historyPlaceId = String(history._id);
});

afterAll(async () => {
  const db = await getDb();
  await db.places.deleteMany({ tags: MARK });
  await db.users.deleteMany({ _id: userId });
  await disconnectMongo?.().catch(() => {});
});

function recReq(userId: string | null) {
  const headers: Record<string, string> = {};
  if (userId) headers['x-user-id'] = userId;
  return new Request('http://localhost/api/places/recommended?limit=50', { headers });
}

describe('PROMPT 9 — Personalized Place Recommendation', () => {
  it('unit: scorePlace cộng điểm theo interests/budget; hasPreferences đúng', () => {
    expect(scorePlace({ tags: ['beach'], type: 'beach' }, { interests: ['beach'] })).toBe(2);
    expect(scorePlace({ tags: ['history'] }, { interests: ['beach'] })).toBe(0);
    expect(scorePlace({ tags: ['x'], priceLevel: 'low' }, { budgetLevel: 'low' })).toBe(1);
    expect(hasPreferences({})).toBe(false);
    expect(hasPreferences({ interests: ['beach'] })).toBe(true);
  });

  it('PATCH preferences hợp lệ → 200', async () => {
    const req = new Request('http://localhost/api/users/me/preferences', {
      method: 'PATCH', headers: { 'content-type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify({ interests: ['beach'], budgetLevel: 'mid' }),
    });
    const res = await prefsPATCH(req as never);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.interests).toContain('beach');
  });

  it('PATCH preferences không hợp lệ → 400', async () => {
    const req = new Request('http://localhost/api/users/me/preferences', {
      method: 'PATCH', headers: { 'content-type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify({ budgetLevel: 'invalid' }),
    });
    const res = await prefsPATCH(req as never);
    expect(res.status).toBe(400);
  });

  it('user có preferences → place khớp xếp trên (dù popularity thấp hơn)', async () => {
    const res = await recommendedGET(recReq(userId) as never);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.personalized).toBe(true);

    const ids = body.data.data.map((p: { id: string }) => p.id);
    const beachIdx = ids.indexOf(beachPlaceId);
    const historyIdx = ids.indexOf(historyPlaceId);
    expect(beachIdx).toBeGreaterThanOrEqual(0);
    expect(beachIdx).toBeLessThan(historyIdx);
  }, 20000);

  it('unauthenticated → 200 popular (không 401)', async () => {
    const res = await recommendedGET(recReq(null) as never);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.personalized).toBe(false);
  });
});
