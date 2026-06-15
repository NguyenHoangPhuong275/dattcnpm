import { NextRequest } from 'next/server';
import { getDb, createAuditLog } from '@/lib/db';
import { getAuthUserFull } from '@/lib/auth';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';
import { recalculatePlaceRating } from '@/lib/review-utils';
import { objectIdSchema } from '@/lib/validations/common';
import { z } from 'zod';

type RouteCtx = {
  params: Promise<{ id: string }>;
};

const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().trim().max(1000).optional().nullable(),
  images: z.array(z.string()).optional().nullable(),
}).refine(d => Object.keys(d).length > 0, {
  message: 'Không có trường hợp lệ để cập nhật',
});

type AppDb = Awaited<ReturnType<typeof getDb>>;

async function findOwnedReviewOrThrow(
  db: AppDb,
  reviewId: string,
  userId: string,
  forbiddenMessage: string
) {
  const review = await db.reviews.findById(reviewId);
  if (!review || review.deletedAt) {
    throw new AppError('NOT_FOUND', 'Không tìm thấy đánh giá', 404);
  }

  if (String(review.userId) !== userId) {
    throw new AppError('FORBIDDEN', forbiddenMessage, 403);
  }

  return review;
}

export async function PATCH(request: NextRequest, ctx: RouteCtx) {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials or user is locked', 401);
    }
    const userId = String(user._id);

    const { id } = await ctx.params;
    objectIdSchema.parse(id);

    const rate = await checkRateLimit({
      key: `rl:update-review:${userId}`,
      limit: 30,
      windowSeconds: 60,
    });
    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Bạn đang cập nhật đánh giá quá nhanh. Vui lòng thử lại sau.', 429);
    }

    const db = await getDb();
    const review = await findOwnedReviewOrThrow(db, id, userId, 'Bạn không có quyền sửa đánh giá này');

    const body = await request.json().catch(() => ({}));
    const parsed = updateReviewSchema.parse(body);

    const updates: Record<string, unknown> = {};
    if (parsed.rating !== undefined) updates.rating = parsed.rating;
    if (parsed.comment !== undefined) updates.comment = parsed.comment;
    if (parsed.images !== undefined) updates.images = parsed.images;

    const updated = await db.reviews.updateOne(id, { $set: updates });

    
    await recalculatePlaceRating(review.placeId, db);

    try {
      await createAuditLog(userId, 'UPDATE_REVIEW', 'REVIEW', id, {
        placeId: review.placeId,
        fields: Object.keys(updates),
      });
    } catch (err) {
      console.error('Lỗi khi ghi audit log UPDATE_REVIEW:', err);
    }

    return sendSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, ctx: RouteCtx) {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials or user is locked', 401);
    }
    const userId = String(user._id);

    const { id } = await ctx.params;
    objectIdSchema.parse(id);

    const rate = await checkRateLimit({
      key: `rl:delete-review:${userId}`,
      limit: 15,
      windowSeconds: 60,
    });
    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Bạn đang xóa đánh giá quá nhanh. Vui lòng thử lại sau.', 429);
    }

    const db = await getDb();
    const review = await findOwnedReviewOrThrow(db, id, userId, 'Bạn không có quyền xóa đánh giá này');

    
    await db.reviews.updateOne(id, { $set: { deletedAt: new Date() } });

    
    await recalculatePlaceRating(review.placeId, db);

    try {
      await createAuditLog(userId, 'DELETE_REVIEW', 'REVIEW', id, {
        placeId: review.placeId,
      });
    } catch (err) {
      console.error('Lỗi khi ghi audit log DELETE_REVIEW:', err);
    }

    return sendSuccess({ message: 'Review deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
