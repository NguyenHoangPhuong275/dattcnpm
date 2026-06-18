import { NextRequest } from 'next/server';
import { createAuditLog, getDb, type ItineraryItem } from '@/lib/db';
import { getAuthUserFull } from '@/lib/auth';
import { getTripForEdit } from '@/lib/trip-permission';
import { objectIdSchema } from '@/lib/validations/common';
import { updateItineraryItemSchema } from '@/lib/validations/trip';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';
import { assertTripDayIsSchedulable } from '@/lib/itinerary-utils';
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

    const trip = await getTripForEdit(id, userId);

    const db = await getDb();
    const item = (await db.itineraryItems.findById(itemId)) as ItineraryItem | null;
    if (!item || String(item.tripId) !== id) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy hoạt động lịch trình', 404);
    }

    const body = await request.json().catch(() => ({}));
    const parsed = updateItineraryItemSchema.parse(body);

    const updates: Record<string, unknown> = {};

    if (parsed.placeId !== undefined) {
      const place = await db.places.findById(parsed.placeId);
      if (!place) {
        throw new AppError('NOT_FOUND', 'Không tìm thấy địa điểm', 404);
      }
      updates.placeId = parsed.placeId;
    }

    if (parsed.day !== undefined) {
      if (parsed.day !== item.day) {
        assertTripDayIsSchedulable(trip, parsed.day);
      }
      updates.day = parsed.day;
    }

    if (parsed.orderIndex !== undefined) updates.orderIndex = parsed.orderIndex;
    if (parsed.note !== undefined) updates.note = parsed.note;
    if (parsed.startTime !== undefined) updates.startTime = parsed.startTime ? new Date(parsed.startTime) : null;
    if (parsed.endTime !== undefined) updates.endTime = parsed.endTime ? new Date(parsed.endTime) : null;
    if (parsed.cost !== undefined) updates.cost = parsed.cost;
    if (parsed.currency !== undefined) updates.currency = parsed.currency;

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

    await getTripForEdit(id, userId);

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
