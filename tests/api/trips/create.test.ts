import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createAuditLog: vi.fn(),
  getAuthUserFull: vi.fn(),
  getDb: vi.fn(),
  checkRateLimit: vi.fn(),
  seedTripItinerary: vi.fn(),
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

vi.mock('@/lib/trip-suggestions', () => ({
  seedTripItinerary: mocks.seedTripItinerary,
}));

import { POST } from '@/app/api/trips/route';

const userId = '507f1f77bcf86cd799439010';
const placeId = '507f1f77bcf86cd799439011';
const tripId = '507f1f77bcf86cd799439012';

function request(): Request {
  return new Request('http://localhost/api/trips', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      title: 'Chuyến đi Quảng Ninh',
      destination: 'Quảng Ninh',
      startDate: '2026-07-14',
      endDate: '2026-07-19',
      initialPlaceId: placeId,
    }),
  });
}

function createDb() {
  return {
    places: {
      findById: vi.fn().mockResolvedValue({
        _id: placeId,
        name: 'Vịnh Hạ Long',
      }),
    },
    trips: {
      insertOne: vi.fn().mockResolvedValue({
        _id: tripId,
        userId,
        title: 'Chuyến đi Quảng Ninh',
        destination: 'Quảng Ninh',
        startDate: new Date('2026-07-14T00:00:00.000Z'),
        endDate: new Date('2026-07-19T00:00:00.000Z'),
        isPublic: false,
        description: null,
        coverImage: null,
        createdAt: new Date('2026-07-01T00:00:00.000Z'),
        updatedAt: new Date('2026-07-01T00:00:00.000Z'),
      }),
      deleteOne: vi.fn().mockResolvedValue(true),
    },
    itineraryItems: {
      deleteMany: vi.fn().mockResolvedValue(0),
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getAuthUserFull.mockResolvedValue({ _id: userId });
  mocks.checkRateLimit.mockResolvedValue({ limited: false });
  mocks.createAuditLog.mockResolvedValue(undefined);
});

describe('POST /api/trips', () => {
  it('xóa chuyến đi vừa tạo khi địa điểm đầu tiên không thể ghi', async () => {
    const db = createDb();
    mocks.getDb.mockResolvedValue(db);
    mocks.seedTripItinerary.mockRejectedValue(new Error('Không thể ghi địa điểm đầu tiên'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await POST(request() as never);

    expect(response.status).toBe(500);
    expect(db.itineraryItems.deleteMany).toHaveBeenCalledWith({ tripId });
    expect(db.trips.deleteOne).toHaveBeenCalledWith(tripId);
    expect(mocks.createAuditLog).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
