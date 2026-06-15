import { NextRequest } from 'next/server';
import { createAuditLog, findOwnedTrip, getDb, type ItineraryItem } from '@/lib/db';
import { getAuthUserFull } from '@/lib/auth';
import { objectIdSchema } from '@/lib/validations/common';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';
import { parseValidDate } from '@/lib/date';
import { toItineraryItemResponse } from '@/lib/trip-formatters';

type RouteCtx = {
  params: Promise<{ id: string; itemId: string }>;
};

export async function PATCH(request: NextRequest, ctx: RouteCtx): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials or user is locked', 401);
    }
    const userId = String(user._id);

    const rate = await checkRateLimit({
      key: `rl:update-itinerary-item:${userId}`,
      limit: 45,
      windowSeconds: 60,
    });
    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Bạn đang cập nhật hoạt động quá nhanh. Vui lòng thử lại sau.', 429);
    }

    const { id, itemId } = await ctx.params;
    objectIdSchema.parse(id);
    objectIdSchema.parse(itemId);

    if (!(await findOwnedTrip(id, userId))) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy hành trình', 404);
    }

    const db = await getDb();
    const item = (await db.itineraryItems.findById(itemId)) as ItineraryItem | null;
    if (!item || String(item.tripId) !== id) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy hoạt động lịch trình', 404);
    }

    const body = await request.json().catch(() => ({}));
    const updates: Record<string, unknown> = {};

    if (body.placeId !== undefined) {
      const placeId = String(body.placeId || '').trim();
      objectIdSchema.parse(placeId);
      const place = await db.places.findById(placeId);
      if (!place) {
        throw new AppError('NOT_FOUND', 'Không tìm thấy địa điểm', 404);
      }
      updates.placeId = placeId;
    }

    if (body.day !== undefined) {
      const day = Math.floor(Number(body.day));
      if (!Number.isFinite(day) || day < 1) {
        throw new AppError('VALIDATION_ERROR', 'day không hợp lệ', 400);
      }
      updates.day = day;
    }

    if (body.orderIndex !== undefined) {
      const orderIndex = Math.floor(Number(body.orderIndex));
      if (!Number.isFinite(orderIndex) || orderIndex < 0) {
        throw new AppError('VALIDATION_ERROR', 'orderIndex không hợp lệ', 400);
      }
      updates.orderIndex = orderIndex;
    }

    if (body.note !== undefined) {
      const note = String(body.note || '').trim();
      updates.note = note || null;
    }

    if (body.startTime !== undefined) {
      updates.startTime = parseValidDate(body.startTime);
    }

    if (body.endTime !== undefined) {
      updates.endTime = parseValidDate(body.endTime);
    }

    if (body.cost !== undefined) {
      const cost = body.cost === null || body.cost === '' ? null : Number(body.cost);
      if (cost !== null && !Number.isFinite(cost)) {
        throw new AppError('VALIDATION_ERROR', 'Chi phí không hợp lệ', 400);
      }
      updates.cost = cost;
    }

    if (body.currency !== undefined) {
      const currency = String(body.currency || '').trim();
      updates.currency = currency || null;
    }

    if (Object.keys(updates).length === 0) {
      throw new AppError('VALIDATION_ERROR', 'Không có trường hợp lệ để cập nhật', 400);
    }

    updates.updatedAt = new Date();

    const updated = (await db.itineraryItems.updateOne(itemId, { $set: updates })) as ItineraryItem | null;
    if (!updated) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy hoạt động lịch trình', 404);
    }

    await createAuditLog(userId, 'UPDATE_ITINERARY_ITEM', 'ITINERARY_ITEM', itemId, {
      tripId: id,
      fields: Object.keys(updates),
    }).catch((err) => console.error('Lỗi khi ghi audit log UPDATE_ITINERARY_ITEM:', err));

    return sendSuccess(toItineraryItemResponse(updated, { includeUpdatedAt: true }));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, ctx: RouteCtx): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials or user is locked', 401);
    }
    const userId = String(user._id);

    const rate = await checkRateLimit({
      key: `rl:delete-itinerary-item:${userId}`,
      limit: 30,
      windowSeconds: 60,
    });
    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Bạn đang xóa hoạt động quá nhanh. Vui lòng thử lại sau.', 429);
    }

    const { id, itemId } = await ctx.params;
    objectIdSchema.parse(id);
    objectIdSchema.parse(itemId);

    if (!(await findOwnedTrip(id, userId))) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy hành trình', 404);
    }

    const db = await getDb();
    const item = await db.itineraryItems.findById(itemId);
    if (!item || String(item.tripId) !== id) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy hoạt động lịch trình', 404);
    }

    const deleted = await db.itineraryItems.deleteOne(itemId);
    if (!deleted) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy hoạt động lịch trình', 404);
    }

    await createAuditLog(userId, 'DELETE_ITINERARY_ITEM', 'ITINERARY_ITEM', itemId, {
      tripId: id,
      placeId: item.placeId,
    }).catch((err) => console.error('Lỗi khi ghi audit log DELETE_ITINERARY_ITEM:', err));

    return sendSuccess({ message: 'Itinerary item deleted' });
  } catch (error) {
    return handleApiError(error);
  }
}
