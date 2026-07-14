import { NextRequest } from 'next/server';
import { createAuditLog, type TripAccommodation } from '@/lib/db';
import { getAuthUserFull } from '@/lib/auth';
import { getTripSubItemForEdit } from '@/lib/trip-permission';
import { objectIdSchema } from '@/lib/validations/common';
import { updateAccommodationSchema } from '@/lib/validations/accommodation';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';
import { toAccommodationResponse } from '@/lib/trip-formatters';

type RouteCtx = {
  params: Promise<{ id: string; accommodationId: string }>;
};

export async function PATCH(request: NextRequest, ctx: RouteCtx): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Phiên đăng nhập không hợp lệ hoặc tài khoản đã bị khóa', 401);
    }
    const userId = String(user._id);

    const rate = await checkRateLimit({
      key: `rl:update-accommodation:${userId}`,
      limit: 60,
      windowSeconds: 60,
    });
    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Bạn đang cập nhật quá nhanh. Vui lòng thử lại sau.', 429);
    }

    const { id, accommodationId } = await ctx.params;
    objectIdSchema.parse(id);
    objectIdSchema.parse(accommodationId);

    const { item, db } = await getTripSubItemForEdit<TripAccommodation>({
      tripId: id,
      itemId: accommodationId,
      userId,
      select: (d) => d.tripAccommodations,
      notFoundMessage: 'Không tìm thấy nơi lưu trú',
    });

    const body = await request.json().catch(() => ({}));
    const parsed = updateAccommodationSchema.parse(body);

    const nextCheckIn = parsed.checkIn ? new Date(parsed.checkIn) : new Date(item.checkIn);
    const nextCheckOut = parsed.checkOut ? new Date(parsed.checkOut) : new Date(item.checkOut);
    if (nextCheckOut.getTime() <= nextCheckIn.getTime()) {
      throw new AppError('VALIDATION_ERROR', 'Ngày trả phòng phải sau ngày nhận phòng', 400);
    }

    const updates: Record<string, unknown> = {};
    if (parsed.name !== undefined) updates.name = parsed.name;
    if (parsed.address !== undefined) updates.address = parsed.address;
    if (parsed.checkIn !== undefined) updates.checkIn = nextCheckIn;
    if (parsed.checkOut !== undefined) updates.checkOut = nextCheckOut;
    if (parsed.bookingCode !== undefined) updates.bookingRef = parsed.bookingCode;
    if (parsed.note !== undefined) updates.note = parsed.note;
    if (parsed.currency !== undefined) updates.currency = parsed.currency;

    const updated = (await db.tripAccommodations.updateOne(accommodationId, { $set: updates })) as TripAccommodation | null;
    if (!updated) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy nơi lưu trú', 404);
    }

    await createAuditLog(userId, 'UPDATE_ACCOMMODATION', 'TRIP_ACCOMMODATION', accommodationId, {
      tripId: id,
      fields: Object.keys(updates),
    }).catch(() => {});

    return sendSuccess(toAccommodationResponse(updated));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, ctx: RouteCtx): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Phiên đăng nhập không hợp lệ hoặc tài khoản đã bị khóa', 401);
    }
    const userId = String(user._id);

    const { id, accommodationId } = await ctx.params;
    objectIdSchema.parse(id);
    objectIdSchema.parse(accommodationId);

    const { db } = await getTripSubItemForEdit<TripAccommodation>({
      tripId: id,
      itemId: accommodationId,
      userId,
      select: (d) => d.tripAccommodations,
      notFoundMessage: 'Không tìm thấy nơi lưu trú',
    });

    const deleted = await db.tripAccommodations.deleteOne(accommodationId);
    if (!deleted) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy nơi lưu trú', 404);
    }

    await createAuditLog(userId, 'DELETE_ACCOMMODATION', 'TRIP_ACCOMMODATION', accommodationId, { tripId: id }).catch(
      () => {}
    );

    return sendSuccess({ message: 'Đã xóa nơi lưu trú' });
  } catch (error) {
    return handleApiError(error);
  }
}
