import { NextRequest } from 'next/server';
import { createAuditLog, type TripChecklist } from '@/lib/db';
import { getAuthUserFull } from '@/lib/auth';
import { getTripSubItemForEdit } from '@/lib/trip-permission';
import { objectIdSchema } from '@/lib/validations/common';
import { updateChecklistItemSchema, normalizeChecklistLabel } from '@/lib/validations/checklist';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';
import { toChecklistResponse } from '@/lib/trip-formatters';

type RouteCtx = {
  params: Promise<{ id: string; itemId: string }>;
};

export async function PATCH(request: NextRequest, ctx: RouteCtx): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Phiên đăng nhập không hợp lệ hoặc tài khoản đã bị khóa', 401);
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

    const { db } = await getTripSubItemForEdit<TripChecklist>({
      tripId: id,
      itemId,
      userId,
      select: (d) => d.tripChecklists,
      notFoundMessage: 'Không tìm thấy mục chuẩn bị',
    });

    const body = await request.json().catch(() => ({}));
    const parsed = updateChecklistItemSchema.parse(body);

    const updates: Record<string, unknown> = {};
    if (parsed.title !== undefined) updates.label = normalizeChecklistLabel(parsed.title);
    if (parsed.completed !== undefined) updates.isDone = parsed.completed;
    if (parsed.dueDate !== undefined) updates.dueDate = parsed.dueDate ? new Date(parsed.dueDate) : null;

    const updated = (await db.tripChecklists.updateOne(itemId, { $set: updates })) as TripChecklist | null;
    if (!updated) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy mục chuẩn bị', 404);
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
      throw new AppError('UNAUTHORIZED', 'Phiên đăng nhập không hợp lệ hoặc tài khoản đã bị khóa', 401);
    }
    const userId = String(user._id);

    const { id, itemId } = await ctx.params;
    objectIdSchema.parse(id);
    objectIdSchema.parse(itemId);

    const { db } = await getTripSubItemForEdit<TripChecklist>({
      tripId: id,
      itemId,
      userId,
      select: (d) => d.tripChecklists,
      notFoundMessage: 'Không tìm thấy mục chuẩn bị',
    });

    const deleted = await db.tripChecklists.deleteOne(itemId);
    if (!deleted) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy mục chuẩn bị', 404);
    }

    await createAuditLog(userId, 'DELETE_CHECKLIST_ITEM', 'TRIP_CHECKLIST', itemId, { tripId: id }).catch(
      () => {}
    );

    return sendSuccess({ message: 'Đã xóa mục chuẩn bị' });
  } catch (error) {
    return handleApiError(error);
  }
}
