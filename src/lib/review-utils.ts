import { Types } from 'mongoose';

import type { AppDatabase } from '@/lib/db';

type RatingSummary = {
  _id: null;
  ratingAvg: number;
  ratingCount: number;
};

export async function recalculatePlaceRating(
  placeId: string,
  db: AppDatabase
): Promise<void> {
  try {
    const [summary] = await db.reviews.aggregate<RatingSummary>([
      {
        $match: {
          placeId: new Types.ObjectId(placeId),
          parentId: null,
          deletedAt: null,
        },
      },
      {
        $group: {
          _id: null,
          ratingAvg: { $avg: '$rating' },
          ratingCount: { $sum: 1 },
        },
      },
    ]);

    await db.places.updateOne(placeId, {
      $set: {
        ratingAvg: Math.round((summary?.ratingAvg ?? 0) * 10) / 10,
        ratingCount: summary?.ratingCount ?? 0,
      },
    });
  } catch {}
}
