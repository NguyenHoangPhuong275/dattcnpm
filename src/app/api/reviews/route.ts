import { NextRequest } from 'next/server';
import { getDb, createAuditLog } from '@/lib/mongodb';
import { getAuthUserFull } from '@/lib/auth';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';
import { recalculatePlaceRating } from '@/lib/review-utils';
import { objectIdSchema } from '@/lib/validations/common';
import { z } from 'zod';

const createReviewSchema = z.object({
  placeId: objectIdSchema,
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional().nullable(),
  images: z.array(z.string()).optional().nullable(),
  parentId: objectIdSchema.optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials or user is locked', 401);
    }
    const userId = String(user._id);

    const rate = await checkRateLimit({
      key: `rl:create-review:${userId}`,
      limit: 15,
      windowSeconds: 60,
    });
    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Bạn đang đăng đánh giá quá nhanh. Vui lòng thử lại sau.', 429);
    }

    const body = await request.json().catch(() => ({}));
    const parsed = createReviewSchema.parse(body);

    const db = await getDb();
    const place = await db.places.findById(parsed.placeId);
    if (!place) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy địa điểm', 404);
    }

    if (!parsed.parentId) {
      const existingReview = await db.reviews.findOne({
        userId,
        placeId: parsed.placeId,
        parentId: null,
        deletedAt: null,
      });

      if (existingReview) {
        throw new AppError('CONFLICT', 'Bạn đã đánh giá địa điểm này rồi. Hãy chỉnh sửa đánh giá hiện tại.', 409);
      }
    }

    const created = await db.reviews.insertOne({
      userId,
      placeId: parsed.placeId,
      rating: parsed.rating,
      comment: parsed.comment || null,
      images: parsed.images || null,
      parentId: parsed.parentId || null,
      deletedAt: null,
    });

    
    await recalculatePlaceRating(parsed.placeId, db);

    try {
      await createAuditLog(userId, 'CREATE_REVIEW', 'REVIEW', created._id, {
        placeId: parsed.placeId,
        rating: parsed.rating,
      });
    } catch (err) {
      console.error('Lỗi khi ghi audit log CREATE_REVIEW:', err);
    }

    return sendSuccess(created, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
