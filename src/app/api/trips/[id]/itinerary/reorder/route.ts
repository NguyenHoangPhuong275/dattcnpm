import { NextRequest } from 'next/server';
import { createAuditLog, getDb, type ItineraryItem } from '@/lib/db';
import { getAuthUserFull } from '@/lib/auth';
import { getTripForEdit } from '@/lib/trip-permission';
import { objectIdSchema } from '@/lib/validations/common';
import { reorderItinerarySchema } from '@/lib/validations/trip';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';

type RouteCtx = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, ctx: RouteCtx): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials or user is locked', 401);
    }
    const userId = String(user._id);

    const rate = await checkRateLimit({
      key: `rl:reorder-itinerary:${userId}`,
      limit: 30,
      windowSeconds: 60,
    });
    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Bạn đang sắp xếp quá nhanh. Vui lòng thử lại sau.', 429);
    }

    const { id } = await ctx.params;
    objectIdSchema.parse(id);

    await getTripForEdit(id, userId);

    const body = await request.json().catch(() => ({}));
    const { orderedIds } = reorderItinerarySchema.parse(body);

    const db = await getDb();
    const existing = (await db.itineraryItems.find({ _id: { $in: orderedIds } })) as ItineraryItem[];
    const existingById = new Map(existing.map((item) => [String(item._id), item]));

    const missing = orderedIds.filter((itemId) => !existingById.has(itemId));
    if (missing.length > 0) {
      throw new AppError('NOT_FOUND', 'Một hoặc nhiều mục lịch trình không tồn tại', 404);
    }

    const foreign = orderedIds.filter((itemId) => String(existingById.get(itemId)!.tripId) !== id);
    if (foreign.length > 0) {
      throw new AppError('FORBIDDEN', 'Một hoặc nhiều mục không thuộc hành trình này', 403);
    }

    const now = new Date();
    const tempOps = orderedIds.map((itemId, index) => ({
      updateOne: {
        filter: { _id: itemId },
        update: { $set: { orderIndex: -(index + 1) } },
      },
    }));
    const finalOps = orderedIds.map((itemId, index) => ({
      updateOne: {
        filter: { _id: itemId },
        update: { $set: { orderIndex: index, updatedAt: now } },
      },
    }));

    const restoreOps = existing.map((item) => ({
      updateOne: {
        filter: { _id: String(item._id) },
        update: { $set: { orderIndex: item.orderIndex } },
      },
    }));

    const compensate = async (): Promise<void> => {
      try {
        await db.itineraryItems.bulkWrite(restoreOps);
      } catch {
        // Rollback cũng thất bại: orderIndex có thể còn ở trạng thái âm, cần xử lý thủ công.
      }
    };

    let result: { modifiedCount: number };
    try {
      await db.itineraryItems.bulkWrite(tempOps);
    } catch {
      await compensate();
      throw new AppError('INTERNAL_ERROR', 'Không thể cập nhật thứ tự lịch trình, đã hoàn tác thay đổi.', 500);
    }

    try {
      result = await db.itineraryItems.bulkWrite(finalOps);
    } catch {
      await compensate();
      throw new AppError('INTERNAL_ERROR', 'Không thể cập nhật thứ tự lịch trình, đã hoàn tác thay đổi.', 500);
    }

    await createAuditLog(userId, 'REORDER_ITINERARY', 'TRIP', id, {
      tripId: id,
      count: orderedIds.length,
    }).catch(() => {});

    return sendSuccess({
      message: 'Đã cập nhật thứ tự lịch trình',
      modified: result.modifiedCount,
      orderedIds,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
