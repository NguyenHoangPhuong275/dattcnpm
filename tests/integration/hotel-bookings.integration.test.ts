import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { getDb, getRedis, disconnectMongo, disconnectRedis } from '@/lib/db';
import { getHotelRooms } from '@/lib/hotel-rooms';
import { POST as createBookingPOST } from '@/app/api/hotels/[id]/bookings/route';
import { GET as myBookingsGET } from '@/app/api/bookings/my/route';
import { POST as payBookingPOST } from '@/app/api/bookings/[id]/pay/route';
import { GET as adminBookingsGET } from '@/app/api/admin/bookings/route';
import { PATCH as adminBookingPATCH } from '@/app/api/admin/bookings/[id]/route';
import { adminCookieName, signAdminSession } from '@/lib/admin-auth';
import type { HotelBookingListPage } from '@/types/booking';

const SOURCE = 'test-hotel-booking';

let hotelId = '';
let userA = '';
let userB = '';
let adminId = '';

function ctx(id: string) {
  return { params: Promise.resolve({ id }) } as never;
}

function adminGetReq() {
  return new Request('http://localhost/api/admin/bookings?status=pending', { headers: { 'x-user-id': adminId } }) as never;
}

function adminPatchReq(bookingId: string, actorId: string, status: string) {
  return new Request(`http://localhost/api/admin/bookings/${bookingId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'x-user-id': actorId },
    body: JSON.stringify({ status }),
  }) as never;
}

async function environmentAdminPatchReq(bookingId: string, status: string): Promise<Request> {
  const token = await signAdminSession();
  return new Request(`http://localhost/api/admin/bookings/${bookingId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      cookie: `${adminCookieName}=${token}`,
    },
    body: JSON.stringify({ status }),
  });
}

function createReq(userId: string | null, body: Record<string, unknown>) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (userId) headers['x-user-id'] = userId;
  return new Request(`http://localhost/api/hotels/${hotelId}/bookings`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  }) as never;
}

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    roomCode: 'standard',
    checkIn: futureDate(1),
    checkOut: futureDate(3),
    guests: 2,
    guestTitle: 'Ông',
    guestName: 'Nguyễn Văn Kiểm Thử',
    phone: '0912345678',
    contactEmail: 'guest@test.local',
    ...overrides,
  };
}

function futureDate(daysFromNow: number): string {
  return new Date(Date.now() + daysFromNow * 86_400_000).toLocaleDateString('sv-SE');
}

beforeAll(async () => {
  const db = await getDb();
  await db.hotels.deleteMany({ source: SOURCE });
  const hotel = await db.hotels.insertOne({
    name: 'KS Test Booking',
    province: 'Đà Nẵng',
    provinceKey: 'da nang',
    priceLevel: 'mid',
    rating: 4,
    source: SOURCE,
  });
  hotelId = String(hotel._id);

  const a = await db.users.insertOne({ email: `book-a-${Date.now()}@test.local`, passwordHash: 'x', fullName: 'Khách A' });
  const b = await db.users.insertOne({ email: `book-b-${Date.now()}@test.local`, passwordHash: 'x', fullName: 'Khách B' });
  const admin = await db.users.insertOne({ email: `book-admin-${Date.now()}@test.local`, passwordHash: 'x', fullName: 'Quản Trị', role: 'ADMIN' });
  userA = String(a._id);
  userB = String(b._id);
  adminId = String(admin._id);
});

beforeEach(async () => {
  await getRedis().del(
    `rl:create-booking:${userA}`,
    `rl:create-booking:${userB}`,
    `rl:resolve-booking:${adminId}`,
    `rl:pay-booking:${userA}`,
  );
});

afterAll(async () => {
  const db = await getDb();
  await db.hotelBookings.deleteMany({ hotelId });
  await db.hotels.deleteMany({ source: SOURCE });
  await db.users.deleteOne(userA);
  await db.users.deleteOne(userB);
  await db.users.deleteOne(adminId);
  await disconnectMongo?.().catch(() => {});
  await disconnectRedis().catch(() => {});
});

describe('Hotel booking flow (thông tin khách + email xác nhận)', () => {
  it('từ chối khi chưa đăng nhập', async () => {
    const res = await createBookingPOST(createReq(null, validBody()), ctx(hotelId));
    expect(res.status).toBe(401);
  });

  it('validate thông tin khách: SĐT, email, họ tên, danh xưng', async () => {
    expect((await createBookingPOST(createReq(userA, validBody({ phone: '12345' })), ctx(hotelId))).status).toBe(400);
    expect((await createBookingPOST(createReq(userA, validBody({ contactEmail: 'sai-dinh-dang' })), ctx(hotelId))).status).toBe(400);
    expect((await createBookingPOST(createReq(userA, validBody({ guestName: 'A' })), ctx(hotelId))).status).toBe(400);
    expect((await createBookingPOST(createReq(userA, validBody({ guestTitle: 'Bạn' })), ctx(hotelId))).status).toBe(400);
  });

  it('validate ngày và sức chứa phòng', async () => {
    expect((await createBookingPOST(createReq(userA, validBody({ checkIn: futureDate(-2) })), ctx(hotelId))).status).toBe(400);
    expect(
      (await createBookingPOST(createReq(userA, validBody({ checkIn: futureDate(3), checkOut: futureDate(3) })), ctx(hotelId))).status,
    ).toBe(400);
    expect((await createBookingPOST(createReq(userA, validBody({ guests: 5 })), ctx(hotelId))).status).toBe(400);
    expect((await createBookingPOST(createReq(userA, validBody({ checkIn: '2026-02-31' })), ctx(hotelId))).status).toBe(400);
  });

  it('đặt phòng tạo trạng thái pending, đúng tổng tiền và thông tin khách', async () => {
    const rooms = getHotelRooms({ id: hotelId, priceLevel: 'mid', rating: 4 });
    const deluxe = rooms.find((room) => room.code === 'deluxe');
    expect(deluxe).toBeDefined();

    const res = await createBookingPOST(
      createReq(userA, validBody({ roomCode: 'deluxe', checkIn: futureDate(5), checkOut: futureDate(8), note: 'Đến muộn sau 22h' })),
      ctx(hotelId),
    );
    expect(res.status).toBe(201);
    const booking = (await res.json()).data.booking;

    expect(booking.status).toBe('pending');
    expect(booking.confirmedAt).toBeNull();
    expect(booking.paymentStatus).toBe('unpaid');
    expect(booking.nights).toBe(3);
    expect(booking.totalPrice).toBe(deluxe!.pricePerNight * 3);
    expect(booking.code).toBeNull();
    expect(booking.guestName).toBe('Nguyễn Văn Kiểm Thử');
    expect(booking.contactEmail).toBe('guest@test.local');
    expect(booking.payment.amount).toBe(deluxe!.pricePerNight * 3);
    expect(booking.payment.content).toBe(`LT-TT-${booking.id.slice(-6).toUpperCase()}`);
    expect(booking.payment.mode).toBe('demo');
    expect(booking.payment.qrImageUrl).toContain('api.qrserver.com');

    const myRes = await myBookingsGET(
      new Request('http://localhost/api/bookings/my', { headers: { 'x-user-id': userA } }) as never,
    );
    const mine = await myRes.json();
    const myBookings = mine.data as HotelBookingListPage;
    expect(myBookings.items.find((item) => item.id === booking.id)?.status).toBe('pending');
    expect(myBookings.pagination.page).toBe(1);
    expect(myBookings.pagination.limit).toBe(20);
  });

  it('phân trang để mọi đơn đặt phòng sau bản ghi thứ 20 vẫn truy cập được', async () => {
    const db = await getDb();
    const inserted = await db.hotelBookings.insertMany(
      Array.from({ length: 21 }, (_, index) => ({
        hotelId,
        userId: userB,
        roomCode: 'standard',
        roomName: `Phòng phân trang ${index + 1}`,
        checkIn: new Date(Date.now() + (index + 30) * 86_400_000),
        checkOut: new Date(Date.now() + (index + 31) * 86_400_000),
        nights: 1,
        guests: 1,
        guestTitle: 'Ông',
        guestName: 'Khách Phân Trang',
        phone: '0912345678',
        contactEmail: 'pagination-hotel@test.local',
        pricePerNight: 500_000,
        totalPrice: 500_000,
        currency: 'VND',
        status: 'pending',
        paymentStatus: 'unpaid',
      })),
    );

    const normalizedResponse = await myBookingsGET(
      new Request('http://localhost/api/bookings/my?page=0&limit=9999', {
        headers: { 'x-user-id': userB },
      }) as never,
    );
    const normalized = (await normalizedResponse.json()).data as HotelBookingListPage;
    expect(normalized.pagination).toEqual({ page: 1, limit: 100, total: 21, totalPages: 1 });

    const firstResponse = await myBookingsGET(
      new Request('http://localhost/api/bookings/my?page=1&limit=20', {
        headers: { 'x-user-id': userB },
      }) as never,
    );
    const secondResponse = await myBookingsGET(
      new Request('http://localhost/api/bookings/my?page=2&limit=20', {
        headers: { 'x-user-id': userB },
      }) as never,
    );
    const firstPage = (await firstResponse.json()).data as HotelBookingListPage;
    const secondPage = (await secondResponse.json()).data as HotelBookingListPage;
    const visibleIds = new Set([...firstPage.items, ...secondPage.items].map((item) => item.id));

    expect(firstPage.pagination).toEqual({ page: 1, limit: 20, total: 21, totalPages: 2 });
    expect(secondPage.pagination).toEqual({ page: 2, limit: 20, total: 21, totalPages: 2 });
    expect(secondPage.items).toHaveLength(1);
    expect(inserted.every((booking) => visibleIds.has(String(booking._id)))).toBe(true);
  });

  it('thanh toán QR: chủ đơn đánh dấu paid, không thể trả lại, người khác bị chặn', async () => {
    const createRes = await createBookingPOST(
      createReq(userA, validBody({ checkIn: futureDate(20), checkOut: futureDate(22) })),
      ctx(hotelId),
    );
    const bookingId = (await createRes.json()).data.booking.id as string;

    const stranger = await payBookingPOST(
      new Request(`http://localhost/api/bookings/${bookingId}/pay`, { method: 'POST', headers: { 'x-user-id': userB } }) as never,
      ctx(bookingId),
    );
    expect(stranger.status).toBe(404);

    const payRes = await payBookingPOST(
      new Request(`http://localhost/api/bookings/${bookingId}/pay`, { method: 'POST', headers: { 'x-user-id': userA } }) as never,
      ctx(bookingId),
    );
    expect(payRes.status).toBe(200);
    expect((await payRes.json()).data.paymentStatus).toBe('paid');

    const again = await payBookingPOST(
      new Request(`http://localhost/api/bookings/${bookingId}/pay`, { method: 'POST', headers: { 'x-user-id': userA } }) as never,
      ctx(bookingId),
    );
    expect(again.status).toBe(409);
  });

  it('chỉ một yêu cầu thanh toán đồng thời được chuyển trạng thái', async () => {
    const createRes = await createBookingPOST(
      createReq(userA, validBody({ checkIn: futureDate(24), checkOut: futureDate(26) })),
      ctx(hotelId),
    );
    const bookingId = (await createRes.json()).data.booking.id as string;
    const pay = () => payBookingPOST(
      new Request(`http://localhost/api/bookings/${bookingId}/pay`, {
        method: 'POST',
        headers: { 'x-user-id': userA },
      }) as never,
      ctx(bookingId),
    );

    const responses = await Promise.all([pay(), pay()]);
    expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);

    const db = await getDb();
    const audits = await db.auditLogs.find({ targetId: bookingId, action: 'PAY_HOTEL_BOOKING' });
    expect(audits).toHaveLength(1);
  });

  it('đơn về admin để xác nhận: user thường bị chặn, admin xác nhận → confirmed, không thể xử lý lại', async () => {
    const createRes = await createBookingPOST(
      createReq(userA, validBody({ checkIn: futureDate(10), checkOut: futureDate(12) })),
      ctx(hotelId),
    );
    const bookingId = (await createRes.json()).data.booking.id as string;

    const listRes = await adminBookingsGET(adminGetReq());
    expect(listRes.status).toBe(200);
    const list = await listRes.json();
    expect((list.data as Array<{ id: string; status: string }>).some((item) => item.id === bookingId && item.status === 'pending')).toBe(true);

    const forbidden = await adminBookingPATCH(adminPatchReq(bookingId, userB, 'confirmed'), ctx(bookingId));
    expect(forbidden.status).toBe(403);

    const unpaidConfirmation = await adminBookingPATCH(adminPatchReq(bookingId, adminId, 'confirmed'), ctx(bookingId));
    expect(unpaidConfirmation.status).toBe(409);

    const payRes = await payBookingPOST(
      new Request(`http://localhost/api/bookings/${bookingId}/pay`, { method: 'POST', headers: { 'x-user-id': userA } }) as never,
      ctx(bookingId),
    );
    expect(payRes.status).toBe(200);
    expect((await payRes.json()).data.code).toBeNull();

    const confirmRes = await adminBookingPATCH(adminPatchReq(bookingId, adminId, 'confirmed'), ctx(bookingId));
    expect(confirmRes.status).toBe(200);
    const confirmPayload = await confirmRes.json();
    const confirmed = confirmPayload.data.booking;
    expect(confirmed.status).toBe('confirmed');
    expect(confirmed.confirmedAt).toBeTruthy();
    expect(confirmed.code).toBe(`LT-${bookingId.slice(-6).toUpperCase()}`);
    expect(confirmPayload.message).toBe('Đã xác nhận đặt phòng. Email thông báo chưa được gửi');

    const again = await adminBookingPATCH(adminPatchReq(bookingId, adminId, 'cancelled'), ctx(bookingId));
    expect(again.status).toBe(409);
  });

  it('chỉ một quyết định admin đồng thời được ghi nhận', async () => {
    const createRes = await createBookingPOST(
      createReq(userA, validBody({ checkIn: futureDate(27), checkOut: futureDate(29) })),
      ctx(hotelId),
    );
    const bookingId = (await createRes.json()).data.booking.id as string;
    await payBookingPOST(
      new Request(`http://localhost/api/bookings/${bookingId}/pay`, {
        method: 'POST',
        headers: { 'x-user-id': userA },
      }) as never,
      ctx(bookingId),
    );

    const confirm = () => adminBookingPATCH(adminPatchReq(bookingId, adminId, 'confirmed'), ctx(bookingId));
    const responses = await Promise.all([confirm(), confirm()]);
    expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);

    const db = await getDb();
    const audits = await db.auditLogs.find({ targetId: bookingId, action: 'CONFIRM_HOTEL_BOOKING' });
    expect(audits).toHaveLength(1);
  });

  it('admin hủy đơn → cancelled', async () => {
    const createRes = await createBookingPOST(
      createReq(userA, validBody({ checkIn: futureDate(14), checkOut: futureDate(15) })),
      ctx(hotelId),
    );
    const bookingId = (await createRes.json()).data.booking.id as string;

    const cancelRes = await adminBookingPATCH(adminPatchReq(bookingId, adminId, 'cancelled'), ctx(bookingId));
    expect(cancelRes.status).toBe(200);
    const cancelled = (await cancelRes.json()).data.booking;
    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.confirmedAt).toBeNull();
  });

  it('ghi audit hợp lệ khi quản trị viên dùng phiên quản trị hệ thống', async () => {
    const createRes = await createBookingPOST(
      createReq(userA, validBody({ checkIn: futureDate(30), checkOut: futureDate(31) })),
      ctx(hotelId),
    );
    const bookingId = (await createRes.json()).data.booking.id as string;
    const request = await environmentAdminPatchReq(bookingId, 'cancelled');
    const response = await adminBookingPATCH(request as never, ctx(bookingId));
    expect(response.status).toBe(200);

    const db = await getDb();
    const audit = await db.auditLogs.findOne({ targetId: bookingId, action: 'CANCEL_HOTEL_BOOKING' });
    expect(audit?.userId ?? null).toBeNull();
    expect(audit?.metadata?.actorType).toBe('environment-admin');
  });
});
