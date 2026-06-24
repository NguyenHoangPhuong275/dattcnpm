import { NextRequest } from 'next/server';
import { createAuditLog, getDb, type TripChecklist } from '@/lib/db';
import { getAuthUserFull } from '@/lib/auth';
import { getTripForEdit } from '@/lib/trip-permission';
import { objectIdSchema } from '@/lib/validations/common';
import { updateChecklistItemSchema, normalizeChecklistLabel } from '@/lib/validations/checklist';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';

type RouteCtx = {
  params: Promise<{ id: string; itemId: string }>;
};

function toChecklistResponse(item: TripChecklist) {
  return {
    id: String(item._id),
    tripId: String(item.tripId),
    title: item.label,
    completed: item.isDone,
    dueDate: item.dueDate ? new Date(item.dueDate).toISOString() : null,
    createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : null,
  };
}

export async function PATCH(request: NextRequest, ctx: RouteCtx): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials or user is locked', 401);
    }
    const userId = String(user._id);

    const rate = await checkRateLimit({
      key: `rl:update-checklist:${userId}`,
      limit: 60,
      windowSeconds: 60,
    });
    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Bạn đang cập nhật quá nhanh. Vui lòng thử lại sau.', 429);
    }

    const { id, itemId } = await ctx.params;
    objectIdSchema.parse(id);
    objectIdSchema.parse(itemId);

    await getTripForEdit(id, userId);

    const db = await getDb();
    const item = (await db.tripChecklists.findById(itemId)) as TripChecklist | null;
    if (!item || String(item.tripId) !== id) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy mục checklist', 404);
    }

    const body = await request.json().catch(() => ({}));
    const parsed = updateChecklistItemSchema.parse(body);

    const updates: Record<string, unknown> = {};
    if (parsed.title !== undefined) updates.label = normalizeChecklistLabel(parsed.title);
    if (parsed.completed !== undefined) updates.isDone = parsed.completed;
    if (parsed.dueDate !== undefined) updates.dueDate = parsed.dueDate ? new Date(parsed.dueDate) : null;

    const updated = (await db.tripChecklists.updateOne(itemId, { $set: updates })) as TripChecklist | null;
    if (!updated) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy mục checklist', 404);
    }

    await createAuditLog(userId, 'UPDATE_CHECKLIST_ITEM', 'TRIP_CHECKLIST', itemId, {
      tripId: id,
      fields: Object.keys(updates),
    }).catch(() => {});

    return sendSuccess(toChecklistResponse(updated));
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

    const { id, itemId } = await ctx.params;
    objectIdSchema.parse(id);
    objectIdSchema.parse(itemId);

    await getTripForEdit(id, userId);

    const db = await getDb();
    const item = (await db.tripChecklists.findById(itemId)) as TripChecklist | null;
    if (!item || String(item.tripId) !== id) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy mục checklist', 404);
    }

    const deleted = await db.tripChecklists.deleteOne(itemId);
    if (!deleted) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy mục checklist', 404);
    }

    await createAuditLog(userId, 'DELETE_CHECKLIST_ITEM', 'TRIP_CHECKLIST', itemId, { tripId: id }).catch(
      () => {}
    );

    return sendSuccess({ message: 'Đã xóa mục checklist' });
  } catch (error) {
    return handleApiError(error);
  }
}
