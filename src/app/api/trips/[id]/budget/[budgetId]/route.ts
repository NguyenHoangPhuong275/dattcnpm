import { NextRequest } from 'next/server';
import { createAuditLog, type TripBudget } from '@/lib/db';
import { getAuthUserFull } from '@/lib/auth';
import { getTripSubItemForEdit } from '@/lib/trip-permission';
import { objectIdSchema } from '@/lib/validations/common';
import { updateBudgetSchema } from '@/lib/validations/budget';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';
import { toBudgetResponse } from '@/lib/trip-formatters';

type RouteCtx = {
  params: Promise<{ id: string; budgetId: string }>;
};

export async function PATCH(request: NextRequest, ctx: RouteCtx): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials or user is locked', 401);
    }
    const userId = String(user._id);

    const rate = await checkRateLimit({
      key: `rl:update-budget:${userId}`,
      limit: 60,
      windowSeconds: 60,
    });
    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Bạn đang cập nhật quá nhanh. Vui lòng thử lại sau.', 429);
    }

    const { id, budgetId } = await ctx.params;
    objectIdSchema.parse(id);
    objectIdSchema.parse(budgetId);

    const { db } = await getTripSubItemForEdit<TripBudget>({
      tripId: id,
      itemId: budgetId,
      userId,
      select: (d) => d.tripBudgets,
      notFoundMessage: 'Không tìm thấy khoản chi',
    });

    const body = await request.json().catch(() => ({}));
    const parsed = updateBudgetSchema.parse(body);

    const updates: Record<string, unknown> = {};
    if (parsed.category !== undefined) updates.category = parsed.category;
    if (parsed.amount !== undefined) updates.amount = parsed.amount;
    if (parsed.currency !== undefined) updates.currency = parsed.currency;
    if (parsed.note !== undefined) updates.note = parsed.note;
    if (parsed.date !== undefined) updates.date = parsed.date ? new Date(parsed.date) : null;
    if (parsed.type !== undefined) updates.type = parsed.type;

    const updated = (await db.tripBudgets.updateOne(budgetId, { $set: updates })) as TripBudget | null;
    if (!updated) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy khoản chi', 404);
    }

    await createAuditLog(userId, 'UPDATE_BUDGET', 'TRIP_BUDGET', budgetId, {
      tripId: id,
      fields: Object.keys(updates),
    }).catch(() => {});

    return sendSuccess(toBudgetResponse(updated));
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

    const { id, budgetId } = await ctx.params;
    objectIdSchema.parse(id);
    objectIdSchema.parse(budgetId);

    const { db } = await getTripSubItemForEdit<TripBudget>({
      tripId: id,
      itemId: budgetId,
      userId,
      select: (d) => d.tripBudgets,
      notFoundMessage: 'Không tìm thấy khoản chi',
    });

    const deleted = await db.tripBudgets.deleteOne(budgetId);
    if (!deleted) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy khoản chi', 404);
    }

    await createAuditLog(userId, 'DELETE_BUDGET', 'TRIP_BUDGET', budgetId, { tripId: id }).catch(() => {}
    );

    return sendSuccess({ message: 'Đã xóa khoản chi' });
  } catch (error) {
    return handleApiError(error);
  }
}
