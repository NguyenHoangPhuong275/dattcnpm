import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { getDb, disconnectMongo } from '@/lib/db';
import { GET as listGET, POST as createPOST } from '@/app/api/trips/[id]/budget/route';
import { PATCH as itemPATCH, DELETE as itemDELETE } from '@/app/api/trips/[id]/budget/[budgetId]/route';

const OWNER = '507f1f77bcf86cd799439051';
const OTHER = '507f1f77bcf86cd799439052';

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
  const trip = await db.trips.insertOne({ userId: owner, title: 'T', destination: 'D', startDate: new Date('2026-10-01'), endDate: new Date('2026-10-03'), isPublic: false });
  return String(trip._id);
}

const ctx = (id: string, budgetId?: string) => ({ params: Promise.resolve({ id, budgetId }) });
function req(userId: string | null, method: string, body?: unknown) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (userId) headers['x-user-id'] = userId;
  return new Request('http://localhost/api/trips/x/budget', { method, headers, body: body ? JSON.stringify(body) : undefined });
}

describe('Chức năng quản lý ngân sách chuyến đi (CRUD)', () => {
  beforeEach(async () => {
    const db = await getDb();
    for (const o of [OWNER, OTHER]) {
      const trips = await db.trips.find({ userId: o });
      for (const t of trips) await db.tripBudgets.deleteMany({ tripId: String(t._id) });
      await db.trips.deleteMany({ userId: o });
    }
  });

  afterAll(async () => {
    const db = await getDb();
    await db.trips.deleteMany({ userId: OWNER });
    await db.trips.deleteMany({ userId: OTHER });
    await disconnectMongo?.().catch(() => {});
  });

  it('CRUD + summary tính đúng', async () => {
    const tripId = await createTrip(OWNER);

    const c1 = await createPOST(req(OWNER, 'POST', { category: 'transport', amount: 100, type: 'planned' }) as never, ctx(tripId) as never);
    expect(c1.status).toBe(201);
    const b1 = (await c1.json()).data.id;

    await createPOST(req(OWNER, 'POST', { category: 'food', amount: 50, type: 'actual' }) as never, ctx(tripId) as never);

    const listRes = await listGET(req(OWNER, 'GET') as never, ctx(tripId) as never);
    const list = await listRes.json();
    expect(listRes.status).toBe(200);
    expect(list.data.items).toHaveLength(2);
    expect(list.data.totalPlanned).toBe(100);
    expect(list.data.totalActual).toBe(50);

    const patchRes = await itemPATCH(req(OWNER, 'PATCH', { amount: 120 }) as never, ctx(tripId, b1) as never);
    expect(patchRes.status).toBe(200);
    expect((await patchRes.json()).data.amount).toBe(120);

    const delRes = await itemDELETE(req(OWNER, 'DELETE') as never, ctx(tripId, b1) as never);
    expect(delRes.status).toBe(200);
  }, 20000);

  it('amount ≤ 0 → 400', async () => {
    const tripId = await createTrip(OWNER);
    const res = await createPOST(req(OWNER, 'POST', { category: 'food', amount: 0 }) as never, ctx(tripId) as never);
    expect(res.status).toBe(400);
  });

  it('category sai → 400', async () => {
    const tripId = await createTrip(OWNER);
    const res = await createPOST(req(OWNER, 'POST', { category: 'invalid', amount: 10 }) as never, ctx(tripId) as never);
    expect(res.status).toBe(400);
  });

  it('unauthenticated → 401', async () => {
    const tripId = await createTrip(OWNER);
    const res = await createPOST(req(null, 'POST', { category: 'food', amount: 10 }) as never, ctx(tripId) as never);
    expect(res.status).toBe(401);
  });

  it('not owner trên trip riêng tư → 404', async () => {
    const tripId = await createTrip(OWNER);
    const res = await createPOST(req(OTHER, 'POST', { category: 'food', amount: 10 }) as never, ctx(tripId) as never);
    expect(res.status).toBe(404);
  });

  it('budgetId của trip khác → 404', async () => {
    const tripId = await createTrip(OWNER);
    const otherTrip = await createTrip(OWNER);
    const c = await createPOST(req(OWNER, 'POST', { category: 'food', amount: 10 }) as never, ctx(otherTrip) as never);
    const otherBudgetId = (await c.json()).data.id;
    const res = await itemPATCH(req(OWNER, 'PATCH', { amount: 5 }) as never, ctx(tripId, otherBudgetId) as never);
    expect(res.status).toBe(404);
  });
});
