import { NextRequest } from 'next/server';
import { createAuditLog, getDb, type TripChecklist } from '@/lib/db';
import { getAuthUserFull } from '@/lib/auth';
import { getTripForEdit, getTripForMemberView } from '@/lib/trip-permission';
import { objectIdSchema } from '@/lib/validations/common';
import { createChecklistItemSchema, normalizeChecklistLabel } from '@/lib/validations/checklist';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';

type RouteCtx = {
  params: Promise<{ id: string }>;
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

export async function GET(request: NextRequest, ctx: RouteCtx): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials or user is locked', 401);
    }
    const userId = String(user._id);

    const { id } = await ctx.params;
    objectIdSchema.parse(id);

    await getTripForMemberView(id, userId);

    const db = await getDb();
    const items = (await db.tripChecklists.find({ tripId: id })) as TripChecklist[];
    items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return sendSuccess(items.map(toChecklistResponse));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, ctx: RouteCtx): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials or user is locked', 401);
    }
    const userId = String(user._id);

    const rate = await checkRateLimit({
      key: `rl:create-checklist:${userId}`,
      limit: 40,
      windowSeconds: 60,
    });
    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Bạn đang thêm mục quá nhanh. Vui lòng thử lại sau.', 429);
    }

    const { id } = await ctx.params;
    objectIdSchema.parse(id);

    await getTripForEdit(id, userId);

    const body = await request.json().catch(() => ({}));
    const parsed = createChecklistItemSchema.parse(body);

    const db = await getDb();
    const created = (await db.tripChecklists.insertOne({
      tripId: id,
      label: normalizeChecklistLabel(parsed.title),
      isDone: false,
      dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
    })) as TripChecklist;

    await createAuditLog(userId, 'CREATE_CHECKLIST_ITEM', 'TRIP_CHECKLIST', created._id, { tripId: id }).catch(
      () => {}
    );

    return sendSuccess(toChecklistResponse(created), undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
