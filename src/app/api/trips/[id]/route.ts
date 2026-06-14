import { NextRequest } from 'next/server';
import { getDb, createAuditLog } from '@/lib/mongodb';
import { getAuthUserFull } from '@/lib/auth';
import { updateTripSchema } from '@/lib/validations/trip';
import { objectIdSchema } from '@/lib/validations/common';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';
import { toTripResponse, deleteTripCascade } from '@/lib/trip-utils';
import type { Trip } from '@/types/trip';

type RouteCtx = {
  params: Promise<{ id: string }>;
};

async function findOwnedTrip(id: string, userId: string): Promise<Trip | null> {
  const db = await getDb();
  const trip = (await db.trips.findById(id)) as Trip | null;
  if (!trip || String(trip.userId) !== userId) return null;
  return trip;
}

export async function GET(request: NextRequest, ctx: RouteCtx): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials or user is locked', 401);
    }
    const userId = String(user._id);

    const { id } = await ctx.params;
    objectIdSchema.parse(id);

    const trip = await findOwnedTrip(id, userId);
    if (!trip) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy hành trình', 404);
    }

    return sendSuccess(toTripResponse(trip));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, ctx: RouteCtx): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials or user is locked', 401);
    }
    const userId = String(user._id);

    const rate = await checkRateLimit({
      key: `rl:update-trip:${userId}`,
      limit: 30,
      windowSeconds: 60,
    });
    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Bạn đang cập nhật lịch trình quá nhanh. Vui lòng thử lại sau.', 429);
    }

    const { id } = await ctx.params;
    objectIdSchema.parse(id);

    const existing = await findOwnedTrip(id, userId);
    if (!existing) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy hành trình', 404);
    }

    const body = await request.json().catch(() => ({}));
    const parsed = updateTripSchema.parse(body);

    const updates: Record<string, unknown> = {};

    if (parsed.title !== undefined) updates.title = parsed.title;
    if (parsed.destination !== undefined) updates.destination = parsed.destination;
    if (parsed.description !== undefined) updates.description = parsed.description;
    if (parsed.coverImage !== undefined) updates.coverImage = parsed.coverImage;
    if (parsed.isPublic !== undefined) updates.isPublic = parsed.isPublic;
    if (parsed.startDate !== undefined) updates.startDate = parsed.startDate;
    if (parsed.endDate !== undefined) updates.endDate = parsed.endDate;

    const nextStart = updates.startDate instanceof Date ? updates.startDate : new Date(existing.startDate);
    const nextEnd = updates.endDate instanceof Date ? updates.endDate : new Date(existing.endDate);
    if (nextEnd.getTime() < nextStart.getTime()) {
      throw new AppError('VALIDATION_ERROR', 'Ngày kết thúc phải sau ngày bắt đầu', 400);
    }

    if (Object.keys(updates).length === 0) {
      throw new AppError('VALIDATION_ERROR', 'Không có trường hợp lệ để cập nhật', 400);
    }

    updates.updatedAt = new Date();

    const db = await getDb();
    const updated = (await db.trips.updateOne(id, { $set: updates })) as Trip | null;
    if (!updated) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy hành trình', 404);
    }

    try {
      await createAuditLog(userId, 'UPDATE_TRIP', 'TRIP', id, { fields: Object.keys(updates) });
    } catch (err) {
      console.error('Lỗi khi ghi audit log UPDATE_TRIP:', err);
    }

    return sendSuccess(toTripResponse(updated));
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
      key: `rl:delete-trip:${userId}`,
      limit: 15,
      windowSeconds: 60,
    });
    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Bạn đang xóa lịch trình quá nhanh. Vui lòng thử lại sau.', 429);
    }

    const { id } = await ctx.params;
    objectIdSchema.parse(id);

    const existing = await findOwnedTrip(id, userId);
    if (!existing) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy hành trình', 404);
    }

    const db = await getDb();
    const deleted = await db.trips.deleteOne(id);
    if (!deleted) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy hành trình', 404);
    }

    
    const cascadeCounts = await deleteTripCascade(id, db);

    try {
      await createAuditLog(userId, 'DELETE_TRIP', 'TRIP', id, {
        title: existing.title,
        cascadeCounts,
      });
    } catch (err) {
      console.error('Lỗi khi ghi audit log DELETE_TRIP:', err);
    }

    return sendSuccess({ message: 'Trip deleted' });
  } catch (error) {
    return handleApiError(error);
  }
}
