import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import { Types } from 'mongoose';
import * as db from '@/lib/db';
import { type ItineraryItem } from '@/lib/db';
import { PATCH as reorderPATCH } from '@/app/api/trips/[id]/itinerary/reorder/route';

const testUserIds = new Set<string>();

function newUserId(): string {
  const id = new Types.ObjectId().toString();
  testUserIds.add(id);
  return id;
}

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

function req(userId: string | null, body?: unknown) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (userId) headers['x-user-id'] = userId;
  return new Request('http://localhost/api/trips/x/itinerary/reorder', {
    method: 'PATCH', headers, body: body ? JSON.stringify(body) : undefined,
  });
}

async function setup(owner: string = newUserId()) {
  const database = await db.getDb();
  const place = await database.places.insertOne({ name: 'P', type: 'custom', lat: 0, lng: 0, ratingAvg: 0, ratingCount: 0 });
  const trip = await database.trips.insertOne({ userId: owner, title: 'T', destination: 'D', startDate: new Date('2026-10-01'), endDate: new Date('2026-10-05'), isPublic: false });
  const tripId = String(trip._id);
  const ids: string[] = [];
  for (let i = 0; i < 3; i++) {
    const it = await database.itineraryItems.insertOne({ tripId, placeId: String(place._id), day: 1, orderIndex: i });
    ids.push(String(it._id));
  }
  return { owner, tripId, ids, placeId: String(place._id) };
}

describe('Chức năng sắp xếp lại lịch trình (reorder 2 pha)', () => {
  beforeEach(() => {
    vi.spyOn(db, 'getUserById').mockImplementation(async (userId: string) => {
      if (testUserIds.has(userId)) {
        return {
          _id: userId, id: userId, email: `${userId}@e.com`, fullName: 'U', role: 'USER',
          isLocked: false, emailVerified: true, createdAt: new Date(), updatedAt: new Date(),
        } as never;
      }
      return null;
    });
  });

  afterEach(async () => {
    const database = await db.getDb();
    for (const owner of testUserIds) {
      const trips = await database.trips.find({ userId: owner });
      for (const t of trips) await database.itineraryItems.deleteMany({ tripId: String(t._id) });
      await database.trips.deleteMany({ userId: owner });
    }
    testUserIds.clear();
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await db.disconnectMongo?.().catch(() => {});
  });

  it('reorder thành công, orderIndex cập nhật đúng', async () => {
    const { owner, tripId, ids } = await setup();
    const reversed = [...ids].reverse();
    const res = await reorderPATCH(req(owner, { orderedIds: reversed }) as never, ctx(tripId) as never);
    expect(res.status).toBe(200);

    const database = await db.getDb();
    for (let i = 0; i < reversed.length; i++) {
      const item = (await database.itineraryItems.findById(reversed[i])) as ItineraryItem;
      expect(item.orderIndex).toBe(i);
    }
  });

  it('unauthenticated → 401', async () => {
    const { ids } = await setup();
    const res = await reorderPATCH(req(null, { orderedIds: ids }) as never, ctx('x') as never);
    expect(res.status).toBe(401);
  });

  it('array rỗng → 400', async () => {
    const { owner, tripId } = await setup();
    const res = await reorderPATCH(req(owner, { orderedIds: [] }) as never, ctx(tripId) as never);
    expect(res.status).toBe(400);
  });

  it('ID trùng → 400', async () => {
    const { owner, tripId, ids } = await setup();
    const res = await reorderPATCH(req(owner, { orderedIds: [ids[0], ids[0], ids[1]] }) as never, ctx(tripId) as never);
    expect(res.status).toBe(400);
  });

  it('ID không tồn tại → 404', async () => {
    const { owner, tripId, ids } = await setup();
    const res = await reorderPATCH(req(owner, { orderedIds: [ids[0], new Types.ObjectId().toString()] }) as never, ctx(tripId) as never);
    expect(res.status).toBe(404);
  });

  it('ID thuộc trip khác → 403', async () => {
    const { owner, tripId } = await setup();
    const other = await setup();
    const res = await reorderPATCH(req(owner, { orderedIds: other.ids }) as never, ctx(tripId) as never);
    expect(res.status).toBe(403);
  });

  it('bỏ qua orderIndex client gửi kèm, luôn normalize theo vị trí mảng', async () => {
    const { owner, tripId, ids } = await setup();
    const res = await reorderPATCH(req(owner, { orderedIds: ids, orderIndex: -5 }) as never, ctx(tripId) as never);
    expect(res.status).toBe(200);

    const database = await db.getDb();
    for (let i = 0; i < ids.length; i++) {
      const item = (await database.itineraryItems.findById(ids[i])) as ItineraryItem;
      expect(item.orderIndex).toBe(i);
    }
  });

  it('pha 2 thất bại → compensating write khôi phục orderIndex về giá trị gốc, trả 500', async () => {
    const { owner, tripId, ids } = await setup();
    const database = await db.getDb();
    const realBulkWrite = database.itineraryItems.bulkWrite.bind(database.itineraryItems);
    let call = 0;
    vi.spyOn(database.itineraryItems, 'bulkWrite').mockImplementation(async (ops: Record<string, unknown>[]) => {
      call += 1;
      if (call === 2) {
        throw Object.assign(new Error('simulated phase-2 failure'), { code: 16500 });
      }
      return realBulkWrite(ops);
    });

    const reversed = [...ids].reverse();
    const res = await reorderPATCH(req(owner, { orderedIds: reversed }) as never, ctx(tripId) as never);
    expect(res.status).toBe(500);

    for (let i = 0; i < ids.length; i++) {
      const item = (await database.itineraryItems.findById(ids[i])) as ItineraryItem;
      expect(item.orderIndex).toBe(i);
    }
    expect(call).toBe(3);
  });

  it('reorder 2 pha: hoán vị toàn bộ vẫn ra orderIndex 0..n-1 đúng và không mất item', async () => {
    const { owner, tripId, ids } = await setup();
    const reordered = [ids[2], ids[0], ids[1]];
    const res = await reorderPATCH(req(owner, { orderedIds: reordered }) as never, ctx(tripId) as never);
    expect(res.status).toBe(200);

    const database = await db.getDb();
    const items = (await database.itineraryItems.find({ tripId })) as ItineraryItem[];
    expect(items).toHaveLength(ids.length);

    const indexById = new Map(items.map((it) => [String(it._id), it.orderIndex]));
    reordered.forEach((itemId, i) => {
      expect(indexById.get(itemId)).toBe(i);
    });
    const finalIndexes = items.map((it) => it.orderIndex).sort((a, b) => a - b);
    expect(finalIndexes).toEqual([0, 1, 2]);
  });
});
