import { Types } from 'mongoose';
import { describe, expect, it, vi } from 'vitest';

import { recalculatePlaceRating } from '@/lib/review-utils';

describe('recalculatePlaceRating', () => {
  it('chỉ tổng hợp đánh giá cấp cao nhất trong MongoDB', async () => {
    const aggregate = vi.fn().mockResolvedValue([
      { _id: null, ratingAvg: 13 / 3, ratingCount: 3 },
    ]);
    const updateOne = vi.fn().mockResolvedValue(undefined);
    const db = {
      reviews: { aggregate },
      places: { updateOne },
    } as never;

    await recalculatePlaceRating('507f1f77bcf86cd799439011', db);

    expect(aggregate).toHaveBeenCalledTimes(1);
    const pipeline = aggregate.mock.calls[0][0];
    expect(pipeline[0].$match).toEqual({
      placeId: new Types.ObjectId('507f1f77bcf86cd799439011'),
      parentId: null,
      deletedAt: null,
    });
    expect(updateOne).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
      $set: { ratingAvg: 4.3, ratingCount: 3 },
    });
  });

  it('đặt lại điểm khi địa điểm chưa có đánh giá cấp cao nhất', async () => {
    const aggregate = vi.fn().mockResolvedValue([]);
    const updateOne = vi.fn().mockResolvedValue(undefined);
    const db = {
      reviews: { aggregate },
      places: { updateOne },
    } as never;

    await recalculatePlaceRating('507f1f77bcf86cd799439011', db);

    expect(updateOne).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
      $set: { ratingAvg: 0, ratingCount: 0 },
    });
  });
});
