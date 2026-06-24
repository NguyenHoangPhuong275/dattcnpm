import { NextRequest } from 'next/server';
import { getDb, createAuditLog, type HotelReview } from '@/lib/db';
import { getAuthUserFull } from '@/lib/auth';
import { objectIdSchema } from '@/lib/validations/common';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';

type RouteCtx = {
  params: Promise<{ id: string; reviewId: string }>;
};

export async function DELETE(request: NextRequest, ctx: RouteCtx): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Vui lòng đăng nhập', 401);
    }
    const userId = String(user._id);

    const { id, reviewId } = await ctx.params;
    objectIdSchema.parse(id);
    objectIdSchema.parse(reviewId);

    const db = await getDb();
    const review = (await db.hotelReviews.findById(reviewId)) as HotelReview | null;
    if (!review || String(review.hotelId) !== id || review.deletedAt) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy đánh giá', 404);
    }
    if (String(review.userId) !== userId) {
      throw new AppError('FORBIDDEN', 'Bạn chỉ có thể xóa đánh giá của mình', 403);
    }

    await db.hotelReviews.updateOne(reviewId, { $set: { deletedAt: new Date() } });

    await createAuditLog(userId, 'DELETE_HOTEL_REVIEW', 'HOTEL_REVIEW', reviewId, { hotelId: id }).catch(() => {}
    );

    return sendSuccess({ message: 'Đã xóa đánh giá' });
  } catch (error) {
    return handleApiError(error);
  }
}
