import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createAuditLog: vi.fn(),
  getAuthUserFull: vi.fn(),
  getDb: vi.fn(),
  checkRateLimit: vi.fn(),
  getTripForMemberView: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  getAuthUserFull: mocks.getAuthUserFull,
}));

vi.mock('@/lib/db', () => ({
  createAuditLog: mocks.createAuditLog,
  getDb: mocks.getDb,
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: mocks.checkRateLimit,
}));

vi.mock('@/lib/trip-permission', () => ({
  getTripForMemberView: mocks.getTripForMemberView,
}));

import { POST as checkoutPOST } from '@/app/api/trips/[id]/checkout/route';
import { POST as payCheckoutPOST } from '@/app/api/trips/[id]/checkout/pay/route';
import { AppError } from '@/lib/api-response';

const userId = '507f1f77bcf86cd799439010';
const tripId = '507f1f77bcf86cd799439011';
const hotelId = '507f1f77bcf86cd799439012';
const flightBookingId = '507f1f77bcf86cd799439013';
const hotelBookingId = '507f1f77bcf86cd799439014';

function futureDate(daysFromNow: number): string {
  return new Date(Date.now() + daysFromNow * 86_400_000).toLocaleDateString('sv-SE');
}

function context(id = tripId) {
  return { params: Promise.resolve({ id }) } as never;
}

function request(path: string, body: unknown): Request {
  return new Request(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function validContact() {
  return {
    contactName: 'Nguyễn Văn A',
    phone: '0912345678',
    contactEmail: 'user@example.com',
  };
}

function validFlight() {
  return {
    outboundFlightId: 'FL-SGN-HAN-01',
    returnFlightId: 'FL-HAN-SGN-01',
    departDate: futureDate(10),
    returnDate: futureDate(15),
    passengers: 2,
    passengerNames: ['Nguyễn Văn A', 'Trần Thị B'],
  };
}

function validHotel() {
  return {
    hotelId,
    roomCode: 'standard',
    checkIn: futureDate(10),
    checkOut: futureDate(15),
    guests: 2,
    guestTitle: 'Ông',
    guestName: 'Nguyễn Văn A',
  };
}

function createDb() {
  return {
    hotels: {
      findById: vi.fn().mockResolvedValue({
        _id: hotelId,
        priceLevel: 'mid',
        rating: 4,
      }),
    },
    flightBookings: {
      findById: vi.fn(),
      insertOne: vi.fn().mockResolvedValue({ _id: flightBookingId }),
      deleteOne: vi.fn().mockResolvedValue(true),
      findOneAndUpdate: vi.fn(),
    },
    hotelBookings: {
      findById: vi.fn(),
      insertOne: vi.fn().mockResolvedValue({ _id: hotelBookingId }),
      deleteOne: vi.fn().mockResolvedValue(true),
      findOneAndUpdate: vi.fn(),
    },
  };
}

function unpaidFlightBooking(overrides: Record<string, unknown> = {}) {
  return {
    _id: flightBookingId,
    userId,
    tripId,
    status: 'pending',
    paymentStatus: 'unpaid',
    totalPrice: 2_000_000,
    ...overrides,
  };
}

function unpaidHotelBooking(overrides: Record<string, unknown> = {}) {
  return {
    _id: hotelBookingId,
    hotelId,
    userId,
    tripId,
    status: 'pending',
    paymentStatus: 'unpaid',
    totalPrice: 3_000_000,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getAuthUserFull.mockResolvedValue({ _id: userId });
  mocks.checkRateLimit.mockResolvedValue({ limited: false });
  mocks.getTripForMemberView.mockResolvedValue({ _id: tripId, userId });
  mocks.createAuditLog.mockResolvedValue(undefined);
});

describe('POST /api/trips/:id/checkout', () => {
  it('rejects an invalid trip identifier before checking membership', async () => {
    const response = await checkoutPOST(request('/api/trips/invalid/checkout', {
      contact: validContact(),
      flight: validFlight(),
    }) as never, context('invalid'));

    expect(response.status).toBe(400);
    expect(mocks.getTripForMemberView).not.toHaveBeenCalled();
  });

  it('requires membership in the target trip', async () => {
    mocks.getTripForMemberView.mockRejectedValueOnce(
      new AppError('NOT_FOUND', 'Không tìm thấy hành trình', 404),
    );

    const response = await checkoutPOST(request(`/api/trips/${tripId}/checkout`, {
      contact: validContact(),
      flight: validFlight(),
    }) as never, context());

    expect(response.status).toBe(404);
    expect(mocks.getDb).not.toHaveBeenCalled();
  });

  it('validates every selected service before inserting any booking', async () => {
    const db = createDb();
    db.hotels.findById.mockResolvedValue(undefined);
    mocks.getDb.mockResolvedValue(db);

    const response = await checkoutPOST(request(`/api/trips/${tripId}/checkout`, {
      contact: validContact(),
      flight: validFlight(),
      hotel: validHotel(),
    }) as never, context());

    expect(response.status).toBe(404);
    expect(db.flightBookings.insertOne).not.toHaveBeenCalled();
    expect(db.hotelBookings.insertOne).not.toHaveBeenCalled();
  });

  it('removes the first booking if the second insert fails', async () => {
    const db = createDb();
    db.hotelBookings.insertOne.mockRejectedValue(new Error('insert failed'));
    mocks.getDb.mockResolvedValue(db);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await checkoutPOST(request(`/api/trips/${tripId}/checkout`, {
      contact: validContact(),
      flight: validFlight(),
      hotel: validHotel(),
    }) as never, context());

    expect(response.status).toBe(500);
    expect(db.flightBookings.deleteOne).toHaveBeenCalledWith(flightBookingId);
    expect(db.hotelBookings.deleteOne).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('creates both bookings with the trip binding and audit logs', async () => {
    const db = createDb();
    mocks.getDb.mockResolvedValue(db);

    const response = await checkoutPOST(request(`/api/trips/${tripId}/checkout`, {
      contact: validContact(),
      flight: validFlight(),
      hotel: validHotel(),
    }) as never, context());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual(expect.objectContaining({ flightBookingId, hotelBookingId }));
    expect(db.flightBookings.insertOne).toHaveBeenCalledWith(expect.objectContaining({
      userId,
      tripId,
      paymentStatus: 'unpaid',
      paidAt: null,
    }));
    expect(db.hotelBookings.insertOne).toHaveBeenCalledWith(expect.objectContaining({
      userId,
      tripId,
      paymentStatus: 'unpaid',
      paidAt: null,
    }));
    expect(mocks.createAuditLog).toHaveBeenCalledTimes(2);
  });
});

describe('POST /api/trips/:id/checkout/pay', () => {
  it('rejects an empty body before reading or updating bookings', async () => {
    const db = createDb();
    mocks.getDb.mockResolvedValue(db);

    const response = await payCheckoutPOST(
      request(`/api/trips/${tripId}/checkout/pay`, {}) as never,
      context(),
    );

    expect(response.status).toBe(400);
    expect(db.flightBookings.findById).not.toHaveBeenCalled();
    expect(db.hotelBookings.findById).not.toHaveBeenCalled();
  });

  it('binds every booking identifier to both the user and trip', async () => {
    const db = createDb();
    db.flightBookings.findById.mockResolvedValue(unpaidFlightBooking({
      tripId: '507f1f77bcf86cd799439099',
    }));
    mocks.getDb.mockResolvedValue(db);

    const response = await payCheckoutPOST(request(`/api/trips/${tripId}/checkout/pay`, {
      flightBookingId,
    }) as never, context());

    expect(response.status).toBe(404);
    expect(db.flightBookings.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('validates both payment targets before changing either booking', async () => {
    const db = createDb();
    db.flightBookings.findById.mockResolvedValue(unpaidFlightBooking());
    db.hotelBookings.findById.mockResolvedValue(unpaidHotelBooking({ paymentStatus: 'paid' }));
    mocks.getDb.mockResolvedValue(db);

    const response = await payCheckoutPOST(request(`/api/trips/${tripId}/checkout/pay`, {
      flightBookingId,
      hotelBookingId,
    }) as never, context());

    expect(response.status).toBe(409);
    expect(db.flightBookings.findOneAndUpdate).not.toHaveBeenCalled();
    expect(db.hotelBookings.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('restores the first payment if the second conditional update loses a race', async () => {
    const db = createDb();
    db.flightBookings.findById.mockResolvedValue(unpaidFlightBooking());
    db.hotelBookings.findById.mockResolvedValue(unpaidHotelBooking());
    db.flightBookings.findOneAndUpdate
      .mockResolvedValueOnce(unpaidFlightBooking({ paymentStatus: 'paid', paidAt: new Date() }))
      .mockResolvedValueOnce(unpaidFlightBooking());
    db.hotelBookings.findOneAndUpdate.mockResolvedValue(null);
    mocks.getDb.mockResolvedValue(db);

    const response = await payCheckoutPOST(request(`/api/trips/${tripId}/checkout/pay`, {
      flightBookingId,
      hotelBookingId,
    }) as never, context());

    expect(response.status).toBe(409);
    expect(db.flightBookings.findOneAndUpdate).toHaveBeenCalledTimes(2);
    expect(db.flightBookings.findOneAndUpdate.mock.calls[1]?.[1]).toEqual({
      $set: { paymentStatus: 'unpaid', paidAt: null },
    });
    expect(mocks.createAuditLog).not.toHaveBeenCalled();
  });

  it('sets a paid status once and records both audits', async () => {
    const db = createDb();
    db.flightBookings.findById.mockResolvedValue(unpaidFlightBooking());
    db.hotelBookings.findById.mockResolvedValue(unpaidHotelBooking());
    db.flightBookings.findOneAndUpdate.mockImplementation(async (_filter, update) => ({
      ...unpaidFlightBooking(),
      paymentStatus: 'paid',
      paidAt: update.$set.paidAt,
    }));
    db.hotelBookings.findOneAndUpdate.mockImplementation(async (_filter, update) => ({
      ...unpaidHotelBooking(),
      paymentStatus: 'paid',
      paidAt: update.$set.paidAt,
    }));
    mocks.getDb.mockResolvedValue(db);

    const response = await payCheckoutPOST(request(`/api/trips/${tripId}/checkout/pay`, {
      flightBookingId,
      hotelBookingId,
    }) as never, context());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual(expect.objectContaining({
      flightBookingId,
      hotelBookingId,
      paymentStatus: 'paid',
    }));
    expect(db.flightBookings.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ userId, tripId, paymentStatus: { $ne: 'paid' } }),
      expect.objectContaining({ $set: expect.objectContaining({ paymentStatus: 'paid' }) }),
    );
    expect(mocks.createAuditLog).toHaveBeenCalledTimes(2);
  });
});
