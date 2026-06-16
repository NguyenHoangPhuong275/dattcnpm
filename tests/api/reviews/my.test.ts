import { describe, expect, it, vi, beforeEach } from 'vitest';

import { GET } from '@/app/api/reviews/my/route';
import { getAuthUserFull } from '@/lib/auth';
import { getDb } from '@/lib/db';

vi.mock('@/lib/auth', () => ({
  getAuthUserFull: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(),
}));

const getAuthUserFullMock = vi.mocked(getAuthUserFull);
const getDbMock = vi.mocked(getDb);

function request(): Request {
  return new Request('http://localhost/api/reviews/my');
}

describe('GET /api/reviews/my', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('filters soft-deleted reviews and batch-loads unique places with $in', async () => {
    const reviewsFind = vi.fn().mockResolvedValue([
      {
        _id: 'review-1',
        placeId: 'place-1',
        rating: 5,
        comment: 'Tuyệt vời',
        images: null,
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
      },
      {
        _id: 'review-2',
        placeId: 'place-1',
        rating: 4,
        comment: null,
        images: [],
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      {
        _id: 'review-3',
        placeId: 'place-2',
        rating: 3,
        comment: 'Ổn',
        images: [],
        createdAt: new Date('2025-12-31T00:00:00.000Z'),
      },
    ]);
    const placesFind = vi.fn().mockResolvedValue([
      { _id: 'place-1', name: 'Hà Nội', type: 'city', address: 'Việt Nam' },
      { _id: 'place-2', name: 'Đà Nẵng', type: 'city', address: 'Miền Trung' },
    ]);

    getAuthUserFullMock.mockResolvedValue({
      _id: 'user-1',
      id: 'user-1',
      email: 'user@example.com',
      fullName: 'User',
      role: 'USER',
    });
    getDbMock.mockResolvedValue({
      reviews: { find: reviewsFind },
      places: { find: placesFind },
    } as never);

    const response = await GET(request() as never);
    const body = await response.json();

    expect(reviewsFind).toHaveBeenCalledWith({ userId: 'user-1', deletedAt: null });
    expect(placesFind).toHaveBeenCalledTimes(1);
    expect(placesFind).toHaveBeenCalledWith({ _id: { $in: ['place-1', 'place-2'] } });
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(3);
    expect(body.data[0].place).toEqual({
      id: 'place-1',
      name: 'Hà Nội',
      type: 'city',
      address: 'Việt Nam',
    });
  });
});
