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
    // Pha 1: gán orderIndex âm tạm thời để tránh vi phạm unique index { tripId, day, orderIndex }
    // khi hoán vị. Pha 2: gán giá trị cuối cùng theo vị trí mảng.
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

    // MongoDB ở môi trường này chạy standalone (docker compose) → không có replica set,
    // không dùng được session.withTransaction(). Vì vậy dùng compensating write thủ công:
    // nếu pha nào thất bại, khôi phục orderIndex về giá trị gốc để tránh kẹt ở giá trị âm.
    const restoreOps = existing.map((item) => ({
      updateOne: {
        filter: { _id: String(item._id) },
        update: { $set: { orderIndex: item.orderIndex } },
      },
    }));

    const compensate = async (phase: 1 | 2): Promise<void> => {
      try {
        await db.itineraryItems.bulkWrite(restoreOps);
      } catch (rollbackErr) {
        // Rollback cũng thất bại: orderIndex có thể còn ở trạng thái âm. Log để xử lý thủ công.
        console.error(
          `Rollback reorder itinerary thất bại sau lỗi pha ${phase} (orderIndex có thể còn âm, cần audit):`,
          rollbackErr,
        );
      }
    };

    let result: { modifiedCount: number };
    try {
      await db.itineraryItems.bulkWrite(tempOps);
    } catch (phase1Err) {
      console.error('Reorder itinerary thất bại ở pha 1:', { phase: 1, failedOps: tempOps.length, error: phase1Err });
      await compensate(1);
      throw new AppError('INTERNAL_ERROR', 'Không thể cập nhật thứ tự lịch trình, đã hoàn tác thay đổi.', 500);
    }

    try {
      result = await db.itineraryItems.bulkWrite(finalOps);
    } catch (phase2Err) {
      console.error('Reorder itinerary thất bại ở pha 2:', { phase: 2, failedOps: finalOps.length, error: phase2Err });
      await compensate(2);
      throw new AppError('INTERNAL_ERROR', 'Không thể cập nhật thứ tự lịch trình, đã hoàn tác thay đổi.', 500);
    }

    await createAuditLog(userId, 'REORDER_ITINERARY', 'TRIP', id, {
      tripId: id,
      count: orderedIds.length,
    }).catch((err) => console.error('Lỗi khi ghi audit log REORDER_ITINERARY:', err));

    return sendSuccess({
      message: 'Đã cập nhật thứ tự lịch trình',
      modified: result.modifiedCount,
      orderedIds,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
