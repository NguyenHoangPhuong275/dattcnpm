import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { hash } from 'bcryptjs';
import { getDb, disconnectMongo } from '@/lib/db';
import { POST as itineraryPOST } from '@/app/api/trips/[id]/itinerary/route';
import { DELETE as itineraryDELETE } from '@/app/api/trips/[id]/itinerary/[itemId]/route';

let ownerId = '';

async function mkUser() {
  const db = await getDb();
  const email = `itin-order-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  const u = await db.users.insertOne({
    email,
    passwordHash: await hash('password123', 8),
    fullName: 'Owner',
    role: 'USER',
    isLocked: false,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  });
  return String(u._id);
}

async function createTrip(owner: string) {
  const db = await getDb();
  const t = await db.trips.insertOne({
    userId: owner,
    title: 'T',
    destination: 'D',
    startDate: new Date('2026-10-01'),
    endDate: new Date('2026-10-05'),
    isPublic: false,
    collaborators: [],
  });
  return String(t._id);
}

async function createPlace() {
  const db = await getDb();
  const p = await db.places.insertOne({ name: 'P', type: 'custom', lat: 0, lng: 0, ratingAvg: 0, ratingCount: 0 });
  return String(p._id);
}

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const itemCtx = (id: string, itemId: string) => ({ params: Promise.resolve({ id, itemId }) });

function req(userId: string, body?: unknown) {
  return new Request('http://localhost/api/trips/x/itinerary', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-user-id': userId },
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeAll(async () => {
  ownerId = await mkUser();
});

beforeEach(async () => {
  const db = await getDb();
  await db.trips.deleteMany({ userId: ownerId });
});

afterAll(async () => {
  const db = await getDb();
  await db.trips.deleteMany({ userId: ownerId });
  await db.users.deleteMany({ _id: ownerId });
  await disconnectMongo?.().catch(() => {});
});

describe('Itinerary orderIndex (max + 1)', () => {
  it('các item thêm tuần tự trong cùng ngày nhận orderIndex 0,1,2', async () => {
    const tripId = await createTrip(ownerId);
    const placeId = await createPlace();

    const orders: number[] = [];
    for (let i = 0; i < 3; i++) {
      const res = await itineraryPOST(req(ownerId, { placeId, day: 1 }) as never, ctx(tripId) as never);
      expect(res.status).toBe(201);
      orders.push((await res.json()).data.orderIndex);
    }
    expect(orders).toEqual([0, 1, 2]);
  }, 20000);

  it('sau khi xóa item giữa, item mới vẫn nhận max + 1 (không trùng)', async () => {
    const tripId = await createTrip(ownerId);
    const placeId = await createPlace();

    const ids: string[] = [];
    for (let i = 0; i < 3; i++) {
      const res = await itineraryPOST(req(ownerId, { placeId, day: 1 }) as never, ctx(tripId) as never);
      ids.push((await res.json()).data._id);
    }

    const delRes = await itineraryDELETE(req(ownerId) as never, itemCtx(tripId, ids[1]) as never);
    expect(delRes.status).toBe(200);

    const res = await itineraryPOST(req(ownerId, { placeId, day: 1 }) as never, ctx(tripId) as never);
    expect(res.status).toBe(201);
    expect((await res.json()).data.orderIndex).toBe(3);
  }, 20000);

  it('orderIndex tách biệt theo từng ngày', async () => {
    const tripId = await createTrip(ownerId);
    const placeId = await createPlace();

    const day1 = await itineraryPOST(req(ownerId, { placeId, day: 1 }) as never, ctx(tripId) as never);
    const day2 = await itineraryPOST(req(ownerId, { placeId, day: 2 }) as never, ctx(tripId) as never);

    expect((await day1.json()).data.orderIndex).toBe(0);
    expect((await day2.json()).data.orderIndex).toBe(0);
  }, 20000);
});
