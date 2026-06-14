import type { AppDatabase } from './mongodb';


export async function recalculatePlaceRating(placeId: string, db: AppDatabase): Promise<void> {
  try {
    const reviews = await db.reviews.find({ placeId, deletedAt: null });
    const ratingCount = reviews.length;
    const ratingAvg = ratingCount === 0
      ? 0
      : reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / ratingCount;

    await db.places.updateOne(placeId, {
      $set: {
        ratingAvg,
        ratingCount,
      },
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật điểm đánh giá địa điểm:', error);
  }
}
