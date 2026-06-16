import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { getDb, disconnectMongo } from '@/lib/db';
import { POST as sharePOST, DELETE as shareDELETE } from '@/app/api/trips/[id]/share/route';

const TEST_USER = '507f1f77bcf86cd799439021';

vi.mock('@/lib/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/db')>();
  return {
    ...actual,
    getUserById: vi.fn().mockImplementation(async (userId: string) => {
      if (userId === TEST_USER) {
        return {
          _id: TEST_USER,
          id: TEST_USER,
          email: 'share-test@example.com',
          fullName: 'Share Test User',
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

async function createTrip() {
  const db = await getDb();
  const trip = await db.trips.insertOne({
    userId: TEST_USER,
    title: 'Chuyến đi test share',
    destination: 'Đà Nẵng',
    startDate: new Date('2026-10-01'),
    endDate: new Date('2026-10-03'),
    isPublic: false,
  });
  return String(trip._id);
}

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe('Integration: Trip share code + revoke all', () => {
  beforeEach(async () => {
    const db = await getDb();
    await db.tripShares.deleteMany({ sharedByUserId: TEST_USER });
    await db.trips.deleteMany({ userId: TEST_USER });
  });

  afterAll(async () => {
    const db = await getDb();
    await db.tripShares.deleteMany({ sharedByUserId: TEST_USER });
    await db.trips.deleteMany({ userId: TEST_USER });
    await disconnectMongo?.().catch(() => {});
  });

  it('generates a non-trivial share code (crypto, length >= 8)', async () => {
    const tripId = await createTrip();
    const req = new Request(`http://localhost/api/trips/${tripId}/share`, {
      method: 'POST',
      headers: { 'x-user-id': TEST_USER },
    });
    const res = await sharePOST(req as never, ctx(tripId) as never);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(typeof body.data.shareCode).toBe('string');
    expect(body.data.shareCode.length).toBeGreaterThanOrEqual(8);
  });

  it('revokes ALL active shares of a trip, not just one', async () => {
    const tripId = await createTrip();
    const db = await getDb();

    const mkReq = () =>
      new Request(`http://localhost/api/trips/${tripId}/share`, {
        method: 'POST',
        headers: { 'x-user-id': TEST_USER },
      });
    await sharePOST(mkReq() as never, ctx(tripId) as never);
    await sharePOST(mkReq() as never, ctx(tripId) as never);

    const activeBefore = await db.tripShares.find({ tripId, isActive: true });
    expect(activeBefore.length).toBe(2);

    const delReq = new Request(`http://localhost/api/trips/${tripId}/share`, {
      method: 'DELETE',
      headers: { 'x-user-id': TEST_USER },
    });
    const delRes = await shareDELETE(delReq as never, ctx(tripId) as never);
    expect(delRes.status).toBe(200);

    const activeAfter = await db.tripShares.find({ tripId, isActive: true });
    expect(activeAfter.length).toBe(0);
  });
});
