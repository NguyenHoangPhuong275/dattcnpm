import { NextRequest } from 'next/server';
import { createAuditLog, getDb, type TripBudget } from '@/lib/db';
import { getAuthUserFull } from '@/lib/auth';
import { getTripForEdit, getTripForMemberView } from '@/lib/trip-permission';
import { objectIdSchema } from '@/lib/validations/common';
import { createBudgetSchema } from '@/lib/validations/budget';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';
import { toBudgetResponse } from '@/lib/trip-formatters';

type RouteCtx = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, ctx: RouteCtx): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Phiên đăng nhập không hợp lệ hoặc tài khoản đã bị khóa', 401);
    }
    const userId = String(user._id);

    const { id } = await ctx.params;
    objectIdSchema.parse(id);

    await getTripForMemberView(id, userId);

    const db = await getDb();
    const items = (await db.tripBudgets.find({ tripId: id })) as TripBudget[];
    items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const totalPlanned = items.filter((i) => i.type === 'planned').reduce((sum, i) => sum + i.amount, 0);
    const totalActual = items.filter((i) => i.type === 'actual').reduce((sum, i) => sum + i.amount, 0);

    return sendSuccess({
      items: items.map(toBudgetResponse),
      totalPlanned,
      totalActual,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, ctx: RouteCtx): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Phiên đăng nhập không hợp lệ hoặc tài khoản đã bị khóa', 401);
    }
    const userId = String(user._id);

    const rate = await checkRateLimit({
      key: `rl:create-budget:${userId}`,
      limit: 40,
      windowSeconds: 60,
    });
    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Bạn đang thêm khoản chi quá nhanh. Vui lòng thử lại sau.', 429);
    }

    const { id } = await ctx.params;
    objectIdSchema.parse(id);

    await getTripForEdit(id, userId);

    const body = await request.json().catch(() => ({}));
    const parsed = createBudgetSchema.parse(body);

    const db = await getDb();
    const created = (await db.tripBudgets.insertOne({
      tripId: id,
      userId,
      category: parsed.category,
      amount: parsed.amount,
      currency: parsed.currency,
      note: parsed.note ?? null,
      date: parsed.date ? new Date(parsed.date) : null,
      type: parsed.type,
    })) as TripBudget;

    await createAuditLog(userId, 'CREATE_BUDGET', 'TRIP_BUDGET', created._id, { tripId: id }).catch(() => {}
    );

    return sendSuccess(toBudgetResponse(created), undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
