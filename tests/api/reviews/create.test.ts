import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getAuthUserFull: vi.fn(),
  getDb: vi.fn(),
  createAuditLog: vi.fn(),
  checkRateLimit: vi.fn(),
  recalculatePlaceRating: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  getAuthUserFull: mocks.getAuthUserFull,
}));

vi.mock('@/lib/db', () => ({
  getDb: mocks.getDb,
  createAuditLog: mocks.createAuditLog,
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: mocks.checkRateLimit,
}));

vi.mock('@/lib/review-utils', () => ({
  recalculatePlaceRating: mocks.recalculatePlaceRating,
}));

import { POST } from '@/app/api/reviews/route';

const userId = '507f1f77bcf86cd799439010';
const placeId = '507f1f77bcf86cd799439011';
const otherPlaceId = '507f1f77bcf86cd799439012';
const parentId = '507f1f77bcf86cd799439013';

function request(body: unknown): Request {
  return new Request('http://localhost/api/reviews', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function createDb(parentReview: Record<string, unknown> | undefined) {
  return {
    places: {
      findById: vi.fn().mockResolvedValue({ _id: placeId, name: 'Hà Nội' }),
    },
    reviews: {
      findById: vi.fn().mockResolvedValue(parentReview),
      findOne: vi.fn().mockResolvedValue(undefined),
      insertOne: vi.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439014',
        userId,
        placeId,
        parentId,
        rating: 5,
      }),
    },
  };
}

describe('POST /api/reviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAuthUserFull.mockResolvedValue({
      _id: userId,
      email: 'user@example.com',
      fullName: 'Người dùng',
      role: 'USER',
    });
    mocks.checkRateLimit.mockResolvedValue({ limited: false });
    mocks.createAuditLog.mockResolvedValue(undefined);
    mocks.recalculatePlaceRating.mockResolvedValue(undefined);
  });

  it('từ chối khi đánh giá cha không tồn tại', async () => {
    const db = createDb(undefined);
    mocks.getDb.mockResolvedValue(db);

    const response = await POST(request({ placeId, parentId, rating: 5 }) as never);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
    expect(db.reviews.insertOne).not.toHaveBeenCalled();
    expect(mocks.recalculatePlaceRating).not.toHaveBeenCalled();
  });

  it('từ chối khi đánh giá cha thuộc địa điểm khác', async () => {
    const db = createDb({
      _id: parentId,
      placeId: otherPlaceId,
      deletedAt: null,
    });
    mocks.getDb.mockResolvedValue(db);

    const response = await POST(request({ placeId, parentId, rating: 5 }) as never);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('BAD_REQUEST');
    expect(db.reviews.insertOne).not.toHaveBeenCalled();
    expect(mocks.recalculatePlaceRating).not.toHaveBeenCalled();
  });

  it('cho phép trả lời đánh giá cùng địa điểm và tính lại điểm an toàn', async () => {
    const db = createDb({
      _id: parentId,
      placeId,
      deletedAt: null,
    });
    mocks.getDb.mockResolvedValue(db);

    const response = await POST(request({ placeId, parentId, rating: 5 }) as never);

    expect(response.status).toBe(201);
    expect(db.reviews.insertOne).toHaveBeenCalledWith(expect.objectContaining({
      userId,
      placeId,
      parentId,
      rating: 5,
    }));
    expect(mocks.recalculatePlaceRating).toHaveBeenCalledWith(placeId, db);
  });
});
