import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { getDb, disconnectMongo } from '@/lib/db';
import { GET as listGET, POST as createPOST } from '@/app/api/trips/[id]/accommodation/route';
import { PATCH as itemPATCH, DELETE as itemDELETE } from '@/app/api/trips/[id]/accommodation/[accommodationId]/route';

const OWNER = '507f1f77bcf86cd799439061';
const OTHER = '507f1f77bcf86cd799439062';

vi.mock('@/lib/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/db')>();
  const mk = (id: string) => ({ _id: id, id, email: `${id}@e.com`, fullName: 'U', role: 'USER', isLocked: false, emailVerified: true, createdAt: new Date(), updatedAt: new Date() });
  return {
    ...actual,
    getUserById: vi.fn().mockImplementation(async (uid: string) => {
      if (uid === OWNER || uid === OTHER) return mk(uid) as never;
      return actual.getUserById(uid);
    }),
  };
});

async function createTrip(owner: string) {
  const db = await getDb();
  const trip = await db.trips.insertOne({ userId: owner, title: 'T', destination: 'D', startDate: new Date('2026-10-01'), endDate: new Date('2026-10-10'), isPublic: false });
  return String(trip._id);
}

const ctx = (id: string, accommodationId?: string) => ({ params: Promise.resolve({ id, accommodationId }) });
function req(userId: string | null, method: string, body?: unknown) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (userId) headers['x-user-id'] = userId;
  return new Request('http://localhost/api/trips/x/accommodation', { method, headers, body: body ? JSON.stringify(body) : undefined });
}

const valid = (over: Record<string, unknown> = {}) => ({
  name: 'Khách sạn Mường Thanh',
  checkIn: '2026-10-02T14:00:00.000Z',
  checkOut: '2026-10-04T12:00:00.000Z',
  ...over,
});

describe('PROMPT 5 — Trip Accommodation CRUD', () => {
  beforeEach(async () => {
    const db = await getDb();
    for (const o of [OWNER, OTHER]) {
      const trips = await db.trips.find({ userId: o });
      for (const t of trips) await db.tripAccommodations.deleteMany({ tripId: String(t._id) });
      await db.trips.deleteMany({ userId: o });
    }
  });

  afterAll(async () => {
    const db = await getDb();
    await db.trips.deleteMany({ userId: OWNER });
    await db.trips.deleteMany({ userId: OTHER });
    await disconnectMongo?.().catch(() => {});
  });

  it('CRUD thành công + sort theo checkIn', async () => {
    const tripId = await createTrip(OWNER);

    await createPOST(req(OWNER, 'POST', valid({ name: 'B', checkIn: '2026-10-05T14:00:00.000Z', checkOut: '2026-10-06T12:00:00.000Z' })) as never, ctx(tripId) as never);
    const c1 = await createPOST(req(OWNER, 'POST', valid({ name: 'A' })) as never, ctx(tripId) as never);
    expect(c1.status).toBe(201);
    const aId = (await c1.json()).data.id;

    const listRes = await listGET(req(OWNER, 'GET') as never, ctx(tripId) as never);
    const list = await listRes.json();
    expect(listRes.status).toBe(200);
    expect(list.data).toHaveLength(2);
    expect(list.data[0].name).toBe('A');

    const patchRes = await itemPATCH(req(OWNER, 'PATCH', { note: 'đã đặt cọc' }) as never, ctx(tripId, aId) as never);
    expect(patchRes.status).toBe(200);

    const delRes = await itemDELETE(req(OWNER, 'DELETE') as never, ctx(tripId, aId) as never);
    expect(delRes.status).toBe(200);
  }, 20000);

  it('không gửi currency → lưu mặc định VND', async () => {
    const tripId = await createTrip(OWNER);
    const c = await createPOST(req(OWNER, 'POST', valid()) as never, ctx(tripId) as never);
    expect(c.status).toBe(201);
    expect((await c.json()).data.currency).toBe('VND');
  });

  it('gửi currency USD → lưu USD và GET trả đúng', async () => {
    const tripId = await createTrip(OWNER);
    const c = await createPOST(req(OWNER, 'POST', valid({ currency: 'USD' })) as never, ctx(tripId) as never);
    expect(c.status).toBe(201);
    expect((await c.json()).data.currency).toBe('USD');

    const listRes = await listGET(req(OWNER, 'GET') as never, ctx(tripId) as never);
    const list = await listRes.json();
    expect(list.data[0].currency).toBe('USD');
  });

  it('currency không hợp lệ → 400', async () => {
    const tripId = await createTrip(OWNER);
    const res = await createPOST(req(OWNER, 'POST', valid({ currency: 'XYZ' })) as never, ctx(tripId) as never);
    expect(res.status).toBe(400);
  });

  it('PATCH cập nhật currency', async () => {
    const tripId = await createTrip(OWNER);
    const c = await createPOST(req(OWNER, 'POST', valid()) as never, ctx(tripId) as never);
    const accId = (await c.json()).data.id;
    const patchRes = await itemPATCH(req(OWNER, 'PATCH', { currency: 'EUR' }) as never, ctx(tripId, accId) as never);
    expect(patchRes.status).toBe(200);
    expect((await patchRes.json()).data.currency).toBe('EUR');
  });

  it('checkOut trước checkIn → 400', async () => {
    const tripId = await createTrip(OWNER);
    const res = await createPOST(req(OWNER, 'POST', valid({ checkIn: '2026-10-04T14:00:00.000Z', checkOut: '2026-10-02T12:00:00.000Z' })) as never, ctx(tripId) as never);
    expect(res.status).toBe(400);
  });

  it('name rỗng → 400', async () => {
    const tripId = await createTrip(OWNER);
    const res = await createPOST(req(OWNER, 'POST', valid({ name: '   ' })) as never, ctx(tripId) as never);
    expect(res.status).toBe(400);
  });

  it('unauthenticated → 401', async () => {
    const tripId = await createTrip(OWNER);
    const res = await createPOST(req(null, 'POST', valid()) as never, ctx(tripId) as never);
    expect(res.status).toBe(401);
  });

  it('not owner trên trip riêng tư → 404', async () => {
    const tripId = await createTrip(OWNER);
    const res = await createPOST(req(OTHER, 'POST', valid()) as never, ctx(tripId) as never);
    expect(res.status).toBe(404);
  });

  it('accommodationId của trip khác → 404', async () => {
    const tripId = await createTrip(OWNER);
    const otherTrip = await createTrip(OWNER);
    const c = await createPOST(req(OWNER, 'POST', valid()) as never, ctx(otherTrip) as never);
    const otherId = (await c.json()).data.id;
    const res = await itemPATCH(req(OWNER, 'PATCH', { note: 'x' }) as never, ctx(tripId, otherId) as never);
    expect(res.status).toBe(404);
  });
});
