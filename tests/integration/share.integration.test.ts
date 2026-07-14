import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { getDb, disconnectMongo } from '@/lib/db';
import { POST as sharePOST, DELETE as shareDELETE } from '@/app/api/trips/[id]/share/route';
import { GET as sharedTripGET } from '@/app/api/share/[code]/route';
import { loadSharedTrip } from '@/lib/shared-trip';

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
const shareCtx = (code: string) => ({ params: Promise.resolve({ code }) });

async function cleanupShareData(): Promise<void> {
  const db = await getDb();
  const trips = await db.trips.find({ userId: TEST_USER });
  const tripIds = trips.map((trip) => String(trip._id));
  await db.tripShares.deleteMany({ sharedByUserId: TEST_USER });
  if (tripIds.length > 0) {
    await db.itineraryItems.deleteMany({ tripId: { $in: tripIds } });
    await db.tripAccommodations.deleteMany({ tripId: { $in: tripIds } });
    await db.tripBudgets.deleteMany({ tripId: { $in: tripIds } });
  }
  await db.trips.deleteMany({ userId: TEST_USER });
  await db.places.deleteMany({ osmId: 'share-test-place' });
  await db.hotels.deleteMany({ source: 'share-test' });
}

describe('Integration: Trip share code + revoke all', () => {
  beforeEach(async () => {
    await cleanupShareData();
  });

  afterAll(async () => {
    await cleanupShareData();
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

  it('tái sử dụng liên kết còn hiệu lực và thu hồi liên kết đang hoạt động', async () => {
    const tripId = await createTrip();
    const db = await getDb();

    const mkReq = () =>
      new Request(`http://localhost/api/trips/${tripId}/share`, {
        method: 'POST',
        headers: { 'x-user-id': TEST_USER },
      });
    const firstResponse = await sharePOST(mkReq() as never, ctx(tripId) as never);
    const firstBody = await firstResponse.json();
    const secondResponse = await sharePOST(mkReq() as never, ctx(tripId) as never);
    const secondBody = await secondResponse.json();

    expect(firstResponse.status).toBe(201);
    expect(secondResponse.status).toBe(200);
    expect(secondBody.data.reused).toBe(true);
    expect(secondBody.data.shareCode).toBe(firstBody.data.shareCode);

    const activeBefore = await db.tripShares.find({ tripId, isActive: true });
    expect(activeBefore.length).toBe(1);

    const delReq = new Request(`http://localhost/api/trips/${tripId}/share`, {
      method: 'DELETE',
      headers: { 'x-user-id': TEST_USER },
    });
    const delRes = await shareDELETE(delReq as never, ctx(tripId) as never);
    expect(delRes.status).toBe(200);

    const activeAfter = await db.tripShares.find({ tripId, isActive: true });
    expect(activeAfter.length).toBe(0);
  });

  it('trả tên và địa chỉ địa điểm an toàn cho trang chia sẻ công khai', async () => {
    const tripId = await createTrip();
    const db = await getDb();
    const place = await db.places.insertOne({
      osmId: 'share-test-place',
      name: 'Cầu Rồng',
      type: 'attraction',
      lat: 16.0611,
      lng: 108.227,
      address: 'Đà Nẵng',
      ratingAvg: 0,
      ratingCount: 0,
    });
    await db.itineraryItems.insertOne({
      tripId,
      placeId: String(place._id),
      day: 1,
      orderIndex: 0,
      note: 'Ngắm cầu về đêm',
    });

    const shareResponse = await sharePOST(
      new Request(`http://localhost/api/trips/${tripId}/share`, {
        method: 'POST',
        headers: { 'x-user-id': TEST_USER },
      }) as never,
      ctx(tripId) as never,
    );
    const shareBody = await shareResponse.json();
    const code = shareBody.data.shareCode as string;

    const response = await sharedTripGET(
      new Request(`http://localhost/api/share/${code}`) as never,
      shareCtx(code) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.items[0].place).toEqual({ name: 'Cầu Rồng', address: 'Đà Nẵng' });

    const direct = await loadSharedTrip(code);
    expect(direct.items[0].place).toEqual({ name: 'Cầu Rồng', address: 'Đà Nẵng' });
  });

  it('trả khách sạn và chi phí cho trang chia sẻ nhưng ẩn mã đặt phòng', async () => {
    const tripId = await createTrip();
    const db = await getDb();
    const hotel = await db.hotels.insertOne({
      name: 'Perla Home',
      province: 'Đà Nẵng',
      district: 'Liên Chiểu',
      address: 'Liên Chiểu, Đà Nẵng',
      source: 'share-test',
    });
    await db.tripAccommodations.insertOne({
      tripId,
      hotelId: hotel._id,
      name: 'Perla Home',
      address: 'Liên Chiểu, Đà Nẵng',
      checkIn: new Date('2026-10-01'),
      checkOut: new Date('2026-10-03'),
      bookingRef: 'SECRET-BOOKING-123',
      note: 'Ghi chú riêng tư',
      currency: 'VND',
    });
    await db.tripBudgets.insertOne({
      tripId,
      userId: TEST_USER,
      category: 'food',
      amount: 500000,
      currency: 'VND',
      note: 'Ăn hải sản',
      date: null,
      type: 'planned',
    });
    await db.tripBudgets.insertOne({
      tripId,
      userId: TEST_USER,
      category: 'transport',
      amount: 200000,
      currency: 'VND',
      note: null,
      date: null,
      type: 'actual',
    });

    const shareResponse = await sharePOST(
      new Request(`http://localhost/api/trips/${tripId}/share`, {
        method: 'POST',
        headers: { 'x-user-id': TEST_USER },
      }) as never,
      ctx(tripId) as never,
    );
    const shareBody = await shareResponse.json();
    const code = shareBody.data.shareCode as string;

    const response = await sharedTripGET(
      new Request(`http://localhost/api/share/${code}`) as never,
      shareCtx(code) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.accommodations).toHaveLength(1);
    expect(body.data.accommodations[0].name).toBe('Perla Home');
    expect(body.data.accommodations[0].address).toBe('Liên Chiểu, Đà Nẵng');
    expect(body.data.accommodations[0].hotelId).toBe(String(hotel._id));
    expect(body.data.accommodations[0]).not.toHaveProperty('bookingRef');
    expect(body.data.accommodations[0]).not.toHaveProperty('bookingCode');
    expect(body.data.accommodations[0]).not.toHaveProperty('note');

    expect(body.data.budget.items).toHaveLength(2);
    expect(body.data.budget.totalPlanned).toBe(500000);
    expect(body.data.budget.totalActual).toBe(200000);
  });
});
