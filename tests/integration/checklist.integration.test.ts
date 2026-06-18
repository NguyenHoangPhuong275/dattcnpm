import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { getDb, disconnectMongo } from '@/lib/db';
import { GET as listGET, POST as createPOST } from '@/app/api/trips/[id]/checklist/route';
import { PATCH as itemPATCH, DELETE as itemDELETE } from '@/app/api/trips/[id]/checklist/[itemId]/route';

const OWNER = '507f1f77bcf86cd799439031';
const OTHER = '507f1f77bcf86cd799439032';

vi.mock('@/lib/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/db')>();
  const mkUser = (id: string) => ({
    _id: id, id, email: `${id}@example.com`, fullName: 'U', role: 'USER',
    isLocked: false, emailVerified: true, createdAt: new Date(), updatedAt: new Date(),
  });
  return {
    ...actual,
    getUserById: vi.fn().mockImplementation(async (userId: string) => {
      if (userId === OWNER || userId === OTHER) return mkUser(userId) as never;
      return actual.getUserById(userId);
    }),
  };
});

async function createTrip(ownerId: string) {
  const db = await getDb();
  const trip = await db.trips.insertOne({
    userId: ownerId,
    title: 'Trip checklist test',
    destination: 'Huế',
    startDate: new Date('2026-10-01'),
    endDate: new Date('2026-10-03'),
    isPublic: false,
  });
  return String(trip._id);
}

const ctx = (id: string, itemId?: string) => ({ params: Promise.resolve({ id, itemId }) });

function req(userId: string | null, method: string, body?: unknown) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (userId) headers['x-user-id'] = userId;
  return new Request('http://localhost/api/trips/x/checklist', {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('PROMPT 2 — Trip Checklist CRUD', () => {
  beforeEach(async () => {
    const db = await getDb();
    await db.trips.deleteMany({ userId: OWNER });
    await db.trips.deleteMany({ userId: OTHER });
  });

  afterAll(async () => {
    const db = await getDb();
    await db.trips.deleteMany({ userId: OWNER });
    await db.trips.deleteMany({ userId: OTHER });
    await disconnectMongo?.().catch(() => {});
  });

  it('owner: full CRUD', async () => {
    const tripId = await createTrip(OWNER);

    const createRes = await createPOST(req(OWNER, 'POST', { title: 'Mang hộ chiếu' }) as never, ctx(tripId) as never);
    expect(createRes.status).toBe(201);
    const createBody = await createRes.json();
    expect(createBody.data.title).toBe('Mang hộ chiếu');
    expect(createBody.data.completed).toBe(false);
    const itemId = createBody.data.id;

    const listRes = await listGET(req(OWNER, 'GET') as never, ctx(tripId) as never);
    const listBody = await listRes.json();
    expect(listRes.status).toBe(200);
    expect(listBody.data).toHaveLength(1);

    const patchRes = await itemPATCH(req(OWNER, 'PATCH', { completed: true }) as never, ctx(tripId, itemId) as never);
    const patchBody = await patchRes.json();
    expect(patchRes.status).toBe(200);
    expect(patchBody.data.completed).toBe(true);

    const delRes = await itemDELETE(req(OWNER, 'DELETE') as never, ctx(tripId, itemId) as never);
    expect(delRes.status).toBe(200);

    const db = await getDb();
    const remaining = await db.tripChecklists.find({ tripId });
    expect(remaining.length).toBe(0);
  }, 15000);

  it('unauthenticated → 401', async () => {
    const tripId = await createTrip(OWNER);
    const res = await createPOST(req(null, 'POST', { title: 'x' }) as never, ctx(tripId) as never);
    expect(res.status).toBe(401);
  });

  it('not owner trên trip riêng tư → 404', async () => {
    const tripId = await createTrip(OWNER);
    const res = await createPOST(req(OTHER, 'POST', { title: 'x' }) as never, ctx(tripId) as never);
    expect(res.status).toBe(404);
  });

  it('trip không tồn tại → 404', async () => {
    const res = await listGET(req(OWNER, 'GET') as never, ctx('507f1f77bcf86cd799439099') as never);
    expect(res.status).toBe(404);
  });

  it('title rỗng → 400', async () => {
    const tripId = await createTrip(OWNER);
    const res = await createPOST(req(OWNER, 'POST', { title: '   ' }) as never, ctx(tripId) as never);
    expect(res.status).toBe(400);
  });

  it('itemId không tồn tại → 404', async () => {
    const tripId = await createTrip(OWNER);
    const res = await itemPATCH(req(OWNER, 'PATCH', { completed: true }) as never, ctx(tripId, '507f1f77bcf86cd799439098') as never);
    expect(res.status).toBe(404);
  });

  it('PATCH completed:true hai lần liên tiếp → vẫn completed true (idempotent)', async () => {
    const tripId = await createTrip(OWNER);
    const createRes = await createPOST(req(OWNER, 'POST', { title: 'Mang sạc' }) as never, ctx(tripId) as never);
    const itemId = (await createRes.json()).data.id;

    const first = await itemPATCH(req(OWNER, 'PATCH', { completed: true }) as never, ctx(tripId, itemId) as never);
    const second = await itemPATCH(req(OWNER, 'PATCH', { completed: true }) as never, ctx(tripId, itemId) as never);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect((await second.json()).data.completed).toBe(true);

    const db = await getDb();
    const items = await db.tripChecklists.find({ tripId });
    expect(items).toHaveLength(1);
    expect(items[0].isDone).toBe(true);
  });

  it('double-click toggle đồng thời → trạng thái cuối cùng nhất quán', async () => {
    const tripId = await createTrip(OWNER);
    const createRes = await createPOST(req(OWNER, 'POST', { title: 'Đặt vé' }) as never, ctx(tripId) as never);
    const itemId = (await createRes.json()).data.id;

    const [a, b] = await Promise.all([
      itemPATCH(req(OWNER, 'PATCH', { completed: true }) as never, ctx(tripId, itemId) as never),
      itemPATCH(req(OWNER, 'PATCH', { completed: true }) as never, ctx(tripId, itemId) as never),
    ]);
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);

    const db = await getDb();
    const item = (await db.tripChecklists.find({ tripId }))[0];
    expect(item.isDone).toBe(true);
  });
});
