import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { hash } from 'bcryptjs';
import { getDb, disconnectMongo } from '@/lib/db';
import { GET as listGET, POST as addPOST } from '@/app/api/trips/[id]/collaborators/route';
import { DELETE as removeDELETE } from '@/app/api/trips/[id]/collaborators/[userId]/route';
import { POST as checklistPOST } from '@/app/api/trips/[id]/checklist/route';
import { POST as budgetPOST } from '@/app/api/trips/[id]/budget/route';
import { POST as accommodationPOST } from '@/app/api/trips/[id]/accommodation/route';
import { POST as itineraryPOST } from '@/app/api/trips/[id]/itinerary/route';
import { PATCH as itineraryPATCH, DELETE as itineraryDELETE } from '@/app/api/trips/[id]/itinerary/[itemId]/route';

let ownerId = '';
let editorId = '';
let readerId = '';
let strangerId = '';
let editorEmail = '';
let readerEmail = '';

async function mkUser(tag: string) {
  const db = await getDb();
  const email = `collab-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  const u = await db.users.insertOne({
    email,
    passwordHash: await hash('password123', 8),
    fullName: tag,
    role: 'USER',
    isLocked: false,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  });
  return { id: String(u._id), email };
}

async function createTrip(owner: string, isPublic = false) {
  const db = await getDb();
  const t = await db.trips.insertOne({
    userId: owner,
    title: 'T',
    destination: 'D',
    startDate: new Date('2026-10-01'),
    endDate: new Date('2026-10-03'),
    isPublic,
    collaborators: [],
  });
  return String(t._id);
}

async function createPlace() {
  const db = await getDb();
  const p = await db.places.insertOne({ name: 'P', type: 'custom', lat: 0, lng: 0, ratingAvg: 0, ratingCount: 0 });
  return String(p._id);
}

const accommodationBody = { name: 'KS', checkIn: '2026-10-01T14:00:00.000Z', checkOut: '2026-10-02T12:00:00.000Z' };

const ctx = (id: string, userId?: string) => ({ params: Promise.resolve({ id, userId }) });
const itemCtx = (id: string, itemId: string) => ({ params: Promise.resolve({ id, itemId }) });

function req(userId: string | null, method: string, body?: unknown) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (userId) headers['x-user-id'] = userId;
  return new Request('http://localhost/api/trips/x/collaborators', {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeAll(async () => {
  const o = await mkUser('owner'); ownerId = o.id;
  const e = await mkUser('editor'); editorId = e.id; editorEmail = e.email;
  const r = await mkUser('reader'); readerId = r.id; readerEmail = r.email;
  const s = await mkUser('stranger'); strangerId = s.id;
});

beforeEach(async () => {
  const db = await getDb();
  await db.trips.deleteMany({ userId: ownerId });
});

afterAll(async () => {
  const db = await getDb();
  await db.trips.deleteMany({ userId: ownerId });
  for (const id of [ownerId, editorId, readerId, strangerId]) await db.users.deleteMany({ _id: id });
  await disconnectMongo?.().catch(() => {});
});

describe('PROMPT 8 - Collaborative Trip Editing', () => {
  it('owner moi collaborator thanh cong', async () => {
    const tripId = await createTrip(ownerId);
    const res = await addPOST(req(ownerId, 'POST', { email: editorEmail, permission: 'EDIT' }) as never, ctx(tripId) as never);
    expect(res.status).toBe(201);
  });

  it('collaborator EDIT thao tac ghi checklist thanh cong', async () => {
    const tripId = await createTrip(ownerId);
    await addPOST(req(ownerId, 'POST', { email: editorEmail, permission: 'EDIT' }) as never, ctx(tripId) as never);

    const res = await checklistPOST(req(editorId, 'POST', { title: 'do something' }) as never, ctx(tripId) as never);
    expect(res.status).toBe(201);
  });

  it('collaborator READ bi chan 403 khi ghi checklist', async () => {
    const tripId = await createTrip(ownerId);
    await addPOST(req(ownerId, 'POST', { email: readerEmail, permission: 'READ' }) as never, ctx(tripId) as never);

    const res = await checklistPOST(req(readerId, 'POST', { title: 'x' }) as never, ctx(tripId) as never);
    expect(res.status).toBe(403);
  });

  it('non-collaborator thao tac ghi checklist tren trip rieng tu bi chan 404', async () => {
    const tripId = await createTrip(ownerId);
    const res = await checklistPOST(req(strangerId, 'POST', { title: 'x' }) as never, ctx(tripId) as never);
    expect(res.status).toBe(404);
  });

  it('unauthenticated collaborator route tra 401', async () => {
    const tripId = await createTrip(ownerId);
    const res = await addPOST(req(null, 'POST', { email: editorEmail }) as never, ctx(tripId) as never);
    expect(res.status).toBe(401);
  });

  it('owner moi email khong ton tai tra 404', async () => {
    const tripId = await createTrip(ownerId);
    const res = await addPOST(req(ownerId, 'POST', { email: 'nobody-xyz@example.com' }) as never, ctx(tripId) as never);
    expect(res.status).toBe(404);
  });

  it('GET danh sach va DELETE thu hoi quyen', async () => {
    const tripId = await createTrip(ownerId);
    await addPOST(req(ownerId, 'POST', { email: editorEmail, permission: 'EDIT' }) as never, ctx(tripId) as never);

    const listRes = await listGET(req(ownerId, 'GET') as never, ctx(tripId) as never);
    const list = await listRes.json();
    expect(list.data).toHaveLength(1);

    const delRes = await removeDELETE(req(ownerId, 'DELETE') as never, ctx(tripId, editorId) as never);
    expect(delRes.status).toBe(200);

    const res = await checklistPOST(req(editorId, 'POST', { title: 'x' }) as never, ctx(tripId) as never);
    expect(res.status).toBe(404);
  }, 20000);

  it('collaborator EDIT ghi duoc Itinerary CRUD / Budget / Accommodation', async () => {
    const tripId = await createTrip(ownerId);
    await addPOST(req(ownerId, 'POST', { email: editorEmail, permission: 'EDIT' }) as never, ctx(tripId) as never);
    const placeId = await createPlace();

    const budgetRes = await budgetPOST(req(editorId, 'POST', { category: 'food', amount: 10 }) as never, ctx(tripId) as never);
    expect(budgetRes.status).toBe(201);

    const accRes = await accommodationPOST(req(editorId, 'POST', accommodationBody) as never, ctx(tripId) as never);
    expect(accRes.status).toBe(201);

    const itinRes = await itineraryPOST(req(editorId, 'POST', { placeId, day: 1 }) as never, ctx(tripId) as never);
    expect(itinRes.status).toBe(201);
    const itineraryItemId = (await itinRes.json()).data._id;

    const patchRes = await itineraryPATCH(req(editorId, 'PATCH', { note: 'updated' }) as never, itemCtx(tripId, itineraryItemId) as never);
    expect(patchRes.status).toBe(200);

    const deleteRes = await itineraryDELETE(req(editorId, 'DELETE') as never, itemCtx(tripId, itineraryItemId) as never);
    expect(deleteRes.status).toBe(200);
  }, 20000);

  it('collaborator READ bi chan 403 tren Itinerary CRUD / Budget / Accommodation', async () => {
    const tripId = await createTrip(ownerId);
    await addPOST(req(ownerId, 'POST', { email: readerEmail, permission: 'READ' }) as never, ctx(tripId) as never);
    const placeId = await createPlace();

    const budgetRes = await budgetPOST(req(readerId, 'POST', { category: 'food', amount: 10 }) as never, ctx(tripId) as never);
    expect(budgetRes.status).toBe(403);

    const accRes = await accommodationPOST(req(readerId, 'POST', accommodationBody) as never, ctx(tripId) as never);
    expect(accRes.status).toBe(403);

    const itinRes = await itineraryPOST(req(readerId, 'POST', { placeId, day: 1 }) as never, ctx(tripId) as never);
    expect(itinRes.status).toBe(403);

    const ownerItin = await itineraryPOST(req(ownerId, 'POST', { placeId, day: 1 }) as never, ctx(tripId) as never);
    const itineraryItemId = (await ownerItin.json()).data._id;

    const patchRes = await itineraryPATCH(req(readerId, 'PATCH', { note: 'blocked' }) as never, itemCtx(tripId, itineraryItemId) as never);
    expect(patchRes.status).toBe(403);

    const deleteRes = await itineraryDELETE(req(readerId, 'DELETE') as never, itemCtx(tripId, itineraryItemId) as never);
    expect(deleteRes.status).toBe(403);
  }, 20000);

  it('non-collaborator ghi tren trip rieng tu bi chan 404 tren Itinerary / Budget / Accommodation', async () => {
    const tripId = await createTrip(ownerId, false);
    const placeId = await createPlace();

    const budgetRes = await budgetPOST(req(strangerId, 'POST', { category: 'food', amount: 10 }) as never, ctx(tripId) as never);
    expect(budgetRes.status).toBe(404);

    const accRes = await accommodationPOST(req(strangerId, 'POST', accommodationBody) as never, ctx(tripId) as never);
    expect(accRes.status).toBe(404);

    const itinRes = await itineraryPOST(req(strangerId, 'POST', { placeId, day: 1 }) as never, ctx(tripId) as never);
    expect(itinRes.status).toBe(404);
  }, 20000);

  it('unauthenticated ghi tra 401 tren Itinerary CRUD / Budget / Accommodation', async () => {
    const tripId = await createTrip(ownerId);
    const placeId = await createPlace();
    const ownerItin = await itineraryPOST(req(ownerId, 'POST', { placeId, day: 1 }) as never, ctx(tripId) as never);
    const itineraryItemId = (await ownerItin.json()).data._id;

    expect((await budgetPOST(req(null, 'POST', { category: 'food', amount: 10 }) as never, ctx(tripId) as never)).status).toBe(401);
    expect((await accommodationPOST(req(null, 'POST', accommodationBody) as never, ctx(tripId) as never)).status).toBe(401);
    expect((await itineraryPOST(req(null, 'POST', { placeId, day: 1 }) as never, ctx(tripId) as never)).status).toBe(401);
    expect((await itineraryPATCH(req(null, 'PATCH', { note: 'blocked' }) as never, itemCtx(tripId, itineraryItemId) as never)).status).toBe(401);
    expect((await itineraryDELETE(req(null, 'DELETE') as never, itemCtx(tripId, itineraryItemId) as never)).status).toBe(401);
  }, 20000);
});
