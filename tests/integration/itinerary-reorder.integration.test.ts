import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { getDb, disconnectMongo, type ItineraryItem } from '@/lib/db';
import { PATCH as reorderPATCH } from '@/app/api/trips/[id]/itinerary/reorder/route';

const OWNER = '507f1f77bcf86cd799439041';

vi.mock('@/lib/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/db')>();
  return {
    ...actual,
    getUserById: vi.fn().mockImplementation(async (userId: string) => {
      if (userId === OWNER) {
        return { _id: OWNER, id: OWNER, email: 'o@e.com', fullName: 'U', role: 'USER', isLocked: false, emailVerified: true, createdAt: new Date(), updatedAt: new Date() } as never;
      }
      return actual.getUserById(userId);
    }),
  };
});

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

function req(userId: string | null, body?: unknown) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (userId) headers['x-user-id'] = userId;
  return new Request('http://localhost/api/trips/x/itinerary/reorder', {
    method: 'PATCH', headers, body: body ? JSON.stringify(body) : undefined,
  });
}

async function setup() {
  const db = await getDb();
  const place = await db.places.insertOne({ name: 'P', type: 'custom', lat: 0, lng: 0, ratingAvg: 0, ratingCount: 0 });
  const trip = await db.trips.insertOne({ userId: OWNER, title: 'T', destination: 'D', startDate: new Date('2026-10-01'), endDate: new Date('2026-10-05'), isPublic: false });
  const tripId = String(trip._id);
  const ids: string[] = [];
  for (let i = 0; i < 3; i++) {
    const it = await db.itineraryItems.insertOne({ tripId, placeId: String(place._id), day: 1, orderIndex: i });
    ids.push(String(it._id));
  }
  return { tripId, ids, placeId: String(place._id) };
}

describe('PROMPT 3 — Itinerary Reorder', () => {
  beforeEach(async () => {
    const db = await getDb();
    const trips = await db.trips.find({ userId: OWNER });
    for (const t of trips) await db.itineraryItems.deleteMany({ tripId: String(t._id) });
    await db.trips.deleteMany({ userId: OWNER });
  });

  afterAll(async () => {
    const db = await getDb();
    await db.trips.deleteMany({ userId: OWNER });
    await disconnectMongo?.().catch(() => {});
  });

  it('reorder thành công, orderIndex cập nhật đúng', async () => {
    const { tripId, ids } = await setup();
    const reversed = [...ids].reverse();
    const res = await reorderPATCH(req(OWNER, { orderedIds: reversed }) as never, ctx(tripId) as never);
    expect(res.status).toBe(200);

    const db = await getDb();
    for (let i = 0; i < reversed.length; i++) {
      const item = (await db.itineraryItems.findById(reversed[i])) as ItineraryItem;
      expect(item.orderIndex).toBe(i);
    }
  });

  it('unauthenticated → 401', async () => {
    const { tripId, ids } = await setup();
    const res = await reorderPATCH(req(null, { orderedIds: ids }) as never, ctx(tripId) as never);
    expect(res.status).toBe(401);
  });

  it('array rỗng → 400', async () => {
    const { tripId } = await setup();
    const res = await reorderPATCH(req(OWNER, { orderedIds: [] }) as never, ctx(tripId) as never);
    expect(res.status).toBe(400);
  });

  it('ID trùng → 400', async () => {
    const { tripId, ids } = await setup();
    const res = await reorderPATCH(req(OWNER, { orderedIds: [ids[0], ids[0], ids[1]] }) as never, ctx(tripId) as never);
    expect(res.status).toBe(400);
  });

  it('ID không tồn tại → 404', async () => {
    const { tripId, ids } = await setup();
    const res = await reorderPATCH(req(OWNER, { orderedIds: [ids[0], '507f1f77bcf86cd7994390aa'] }) as never, ctx(tripId) as never);
    expect(res.status).toBe(404);
  });

  it('ID thuộc trip khác → 403', async () => {
    const { tripId } = await setup();
    const other = await setup();
    const res = await reorderPATCH(req(OWNER, { orderedIds: other.ids }) as never, ctx(tripId) as never);
    expect(res.status).toBe(403);
  });

  it('bỏ qua orderIndex client gửi kèm, luôn normalize theo vị trí mảng', async () => {
    const { tripId, ids } = await setup();
    const res = await reorderPATCH(req(OWNER, { orderedIds: ids, orderIndex: -5 }) as never, ctx(tripId) as never);
    expect(res.status).toBe(200);

    const db = await getDb();
    for (let i = 0; i < ids.length; i++) {
      const item = (await db.itineraryItems.findById(ids[i])) as ItineraryItem;
      expect(item.orderIndex).toBe(i);
    }
  });

  it('reorder 2 pha: hoán vị toàn bộ vẫn ra orderIndex 0..n-1 đúng và không mất item', async () => {
    const { tripId, ids } = await setup();
    const reordered = [ids[2], ids[0], ids[1]];
    const res = await reorderPATCH(req(OWNER, { orderedIds: reordered }) as never, ctx(tripId) as never);
    expect(res.status).toBe(200);

    const db = await getDb();
    const items = (await db.itineraryItems.find({ tripId })) as ItineraryItem[];
    expect(items).toHaveLength(ids.length);

    const indexById = new Map(items.map((it) => [String(it._id), it.orderIndex]));
    reordered.forEach((itemId, i) => {
      expect(indexById.get(itemId)).toBe(i);
    });
    const finalIndexes = items.map((it) => it.orderIndex).sort((a, b) => a - b);
    expect(finalIndexes).toEqual([0, 1, 2]);
  });
});
