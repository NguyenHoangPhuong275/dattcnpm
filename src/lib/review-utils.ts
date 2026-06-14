import type { AppDatabase } from '@/lib/mongodb';

export async function recalculatePlaceRating(
  placeId: string,
  db: AppDatabase
): Promise<void> {
  try {
    const reviews = await db.reviews.find({ placeId, deletedAt: null });
    const count = reviews.length;
    const avg = count > 0
      ? reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / count
      : 0;
    await db.places.updateOne(placeId, {
      $set: {
        ratingAvg: Math.round(avg * 10) / 10,
        ratingCount: count,
      },
    });
  } catch (err) {
    console.error('recalculatePlaceRating failed for placeId', placeId, err);
  }
}
