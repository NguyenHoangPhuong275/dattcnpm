import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { POST as createFlightBookingPOST } from '@/app/api/flights/bookings/route';
import { GET as myFlightBookingsGET } from '@/app/api/flight-bookings/my/route';
import { POST as payFlightBookingPOST } from '@/app/api/flight-bookings/[id]/pay/route';
import { PATCH as adminBookingPATCH } from '@/app/api/admin/bookings/[id]/route';
import { getFlightScheduleById } from '@/data/vietnam-flights';
import { disconnectMongo, disconnectRedis, getDb, getRedis } from '@/lib/db';
import type { FlightBookingListPage } from '@/types/booking';

let userA = '';
let userB = '';
let adminId = '';

function futureDate(daysFromNow: number): string {
  return new Date(Date.now() + daysFromNow * 86_400_000).toLocaleDateString('sv-SE');
}

function ctx(id: string) {
  return { params: Promise.resolve({ id }) } as never;
}

function createReq(userId: string | null, body: Record<string, unknown>) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (userId) headers['x-user-id'] = userId;
  return new Request('http://localhost/api/flights/bookings', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  }) as never;
}

function adminPatchReq(bookingId: string, status: 'confirmed' | 'cancelled') {
  return new Request(`http://localhost/api/admin/bookings/${bookingId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'x-user-id': adminId },
    body: JSON.stringify({ status }),
  }) as never;
}

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    outboundFlightId: 'FL-SGN-HAN-01',
    returnFlightId: 'FL-HAN-SGN-01',
    departDate: futureDate(10),
    returnDate: futureDate(15),
    passengers: 2,
    passengerNames: ['Nguyễn Văn A', 'Trần Thị B'],
    contactName: 'Nguyễn Văn A',
    phone: '0912345678',
    contactEmail: 'flight@test.local',
    ...overrides,
  };
}

beforeAll(async () => {
  const db = await getDb();
  const timestamp = Date.now();
  const first = await db.users.insertOne({ email: `flight-a-${timestamp}@test.local`, passwordHash: 'x', fullName: 'Khách Bay A' });
  const second = await db.users.insertOne({ email: `flight-b-${timestamp}@test.local`, passwordHash: 'x', fullName: 'Khách Bay B' });
  const admin = await db.users.insertOne({ email: `flight-admin-${timestamp}@test.local`, passwordHash: 'x', fullName: 'Quản Trị', role: 'ADMIN' });
  userA = String(first._id);
  userB = String(second._id);
  adminId = String(admin._id);
});

beforeEach(async () => {
  await getRedis().del(
    `rl:create-flight-booking:${userA}`,
    `rl:create-flight-booking:${userB}`,
    `rl:pay-flight-booking:${userA}`,
    `rl:pay-flight-booking:${userB}`,
    `rl:resolve-booking:${adminId}`,
  );
});

afterAll(async () => {
  const db = await getDb();
  await db.flightBookings.deleteMany({ userId: { $in: [userA, userB] } });
  await db.users.deleteOne(userA);
  await db.users.deleteOne(userB);
  await db.users.deleteOne(adminId);
  await disconnectMongo().catch(() => {});
  await disconnectRedis().catch(() => {});
});

describe('Flight booking flow', () => {
  it('từ chối người chưa đăng nhập và dữ liệu hành khách không đầy đủ', async () => {
    expect((await createFlightBookingPOST(createReq(null, validBody()))).status).toBe(401);
    expect((await createFlightBookingPOST(createReq(userA, validBody({ passengerNames: ['Nguyễn Văn A'] })))).status).toBe(400);
  });

  it('kiểm tra đúng chiều chuyến về', async () => {
    const response = await createFlightBookingPOST(createReq(userA, validBody({
      returnFlightId: 'FL-DAD-SGN-01',
    })));
    expect(response.status).toBe(400);
  });

  it('từ chối ngày không tồn tại và chuyến về trước khi chuyến đi hạ cánh', async () => {
    const invalidDate = await createFlightBookingPOST(createReq(userA, validBody({
      departDate: '2026-02-31',
    })));
    expect(invalidDate.status).toBe(400);

    const departDate = futureDate(12);
    const invalidConnection = await createFlightBookingPOST(createReq(userA, validBody({
      departDate,
      returnDate: departDate,
      outboundFlightId: 'FL-SGN-HAN-01',
      returnFlightId: 'FL-HAN-SGN-01',
    })));
    expect(invalidConnection.status).toBe(400);
  });

  it('lưu đơn khứ hồi với giá do server tính và xuất hiện trong danh sách của tôi', async () => {
    const response = await createFlightBookingPOST(createReq(userA, validBody()));
    expect(response.status).toBe(201);
    const booking = (await response.json()).data.booking;
    const outbound = getFlightScheduleById('FL-SGN-HAN-01');
    const returnFlight = getFlightScheduleById('FL-HAN-SGN-01');

    expect(booking.status).toBe('pending');
    expect(booking.paymentStatus).toBe('unpaid');
    expect(booking.code).toBeNull();
    expect(booking.totalPrice).toBe((outbound!.basePrice + returnFlight!.basePrice) * 2);
    expect(booking.outbound.fromCity).toBe('Hồ Chí Minh');
    expect(booking.returnFlight.toCity).toBe('Hồ Chí Minh');

    const mineResponse = await myFlightBookingsGET(new Request('http://localhost/api/flight-bookings/my', {
      headers: { 'x-user-id': userA },
    }) as never);
    const mine = (await mineResponse.json()).data as FlightBookingListPage;
    expect(mine.items.some((item) => item.id === booking.id)).toBe(true);
    expect(mine.pagination.page).toBe(1);
    expect(mine.pagination.limit).toBe(20);
  });

  it('phân trang để mọi vé máy bay sau bản ghi thứ 20 vẫn truy cập được', async () => {
    const db = await getDb();
    const inserted = await db.flightBookings.insertMany(
      Array.from({ length: 21 }, (_, index) => ({
        userId: userB,
        outbound: {
          scheduleId: `PAGINATION-${index + 1}`,
          flightNumber: `VN${700 + index}`,
          airlineCode: 'VN',
          from: 'SGN',
          to: 'HAN',
          flightDate: new Date(Date.now() + (index + 30) * 86_400_000),
          departureTime: '08:00',
          arrivalTime: '10:00',
          duration: '2 giờ',
          pricePerPassenger: 1_000_000,
        },
        returnFlight: null,
        passengers: 1,
        passengerNames: ['Khách Phân Trang'],
        contactName: 'Khách Phân Trang',
        phone: '0912345678',
        contactEmail: 'pagination-flight@test.local',
        totalPrice: 1_000_000,
        currency: 'VND',
        status: 'pending',
        paymentStatus: 'unpaid',
      })),
    );

    const normalizedResponse = await myFlightBookingsGET(
      new Request('http://localhost/api/flight-bookings/my?page=-5&limit=1000', {
        headers: { 'x-user-id': userB },
      }) as never,
    );
    const normalized = (await normalizedResponse.json()).data as FlightBookingListPage;
    expect(normalized.pagination).toEqual({ page: 1, limit: 100, total: 21, totalPages: 1 });

    const firstResponse = await myFlightBookingsGET(
      new Request('http://localhost/api/flight-bookings/my?page=1&limit=20', {
        headers: { 'x-user-id': userB },
      }) as never,
    );
    const secondResponse = await myFlightBookingsGET(
      new Request('http://localhost/api/flight-bookings/my?page=2&limit=20', {
        headers: { 'x-user-id': userB },
      }) as never,
    );
    const firstPage = (await firstResponse.json()).data as FlightBookingListPage;
    const secondPage = (await secondResponse.json()).data as FlightBookingListPage;
    const visibleIds = new Set([...firstPage.items, ...secondPage.items].map((item) => item.id));

    expect(firstPage.pagination).toEqual({ page: 1, limit: 20, total: 21, totalPages: 2 });
    expect(secondPage.pagination).toEqual({ page: 2, limit: 20, total: 21, totalPages: 2 });
    expect(secondPage.items).toHaveLength(1);
    expect(inserted.every((booking) => visibleIds.has(String(booking._id)))).toBe(true);
  });

  it('chỉ chủ đơn được thanh toán và mã chỉ xuất hiện sau khi admin xác nhận', async () => {
    const createResponse = await createFlightBookingPOST(createReq(userA, validBody({
      returnFlightId: undefined,
      returnDate: undefined,
      passengers: 1,
      passengerNames: ['Nguyễn Văn A'],
    })));
    const bookingId = (await createResponse.json()).data.booking.id as string;

    const unpaidConfirmation = await adminBookingPATCH(adminPatchReq(bookingId, 'confirmed'), ctx(bookingId));
    expect(unpaidConfirmation.status).toBe(409);

    const stranger = await payFlightBookingPOST(new Request(`http://localhost/api/flight-bookings/${bookingId}/pay`, {
      method: 'POST',
      headers: { 'x-user-id': userB },
    }) as never, ctx(bookingId));
    expect(stranger.status).toBe(404);

    const paid = await payFlightBookingPOST(new Request(`http://localhost/api/flight-bookings/${bookingId}/pay`, {
      method: 'POST',
      headers: { 'x-user-id': userA },
    }) as never, ctx(bookingId));
    expect(paid.status).toBe(200);
    const booking = (await paid.json()).data;
    expect(booking.paymentStatus).toBe('paid');
    expect(booking.status).toBe('pending');
    expect(booking.confirmedAt).toBeNull();
    expect(booking.code).toBeNull();

    const confirmedResponse = await adminBookingPATCH(adminPatchReq(bookingId, 'confirmed'), ctx(bookingId));
    expect(confirmedResponse.status).toBe(200);
    const confirmed = (await confirmedResponse.json()).data.booking;
    expect(confirmed.status).toBe('confirmed');
    expect(confirmed.paymentStatus).toBe('paid');
    expect(confirmed.confirmedAt).toBeTruthy();
    expect(confirmed.code).toBe(`LT-FL-${bookingId.slice(-6).toUpperCase()}`);

    const again = await payFlightBookingPOST(new Request(`http://localhost/api/flight-bookings/${bookingId}/pay`, {
      method: 'POST',
      headers: { 'x-user-id': userA },
    }) as never, ctx(bookingId));
    expect(again.status).toBe(409);
  });

  it('chỉ một yêu cầu thanh toán vé đồng thời được ghi nhận', async () => {
    const createResponse = await createFlightBookingPOST(createReq(userA, validBody({
      returnFlightId: undefined,
      returnDate: undefined,
      passengers: 1,
      passengerNames: ['Nguyễn Văn A'],
      departDate: futureDate(20),
    })));
    const bookingId = (await createResponse.json()).data.booking.id as string;
    const pay = () => payFlightBookingPOST(new Request(`http://localhost/api/flight-bookings/${bookingId}/pay`, {
      method: 'POST',
      headers: { 'x-user-id': userA },
    }) as never, ctx(bookingId));

    const responses = await Promise.all([pay(), pay()]);
    expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);

    const db = await getDb();
    const audits = await db.auditLogs.find({ targetId: bookingId, action: 'PAY_FLIGHT_BOOKING' });
    expect(audits).toHaveLength(1);
  });
});
