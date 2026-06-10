import { NextRequest } from 'next/server';
import { getDb, createAuditLog } from '@/lib/mongodb';
import { getAuthUserId } from '@/lib/auth';
import { ObjectIdSchema } from '@/lib/validations/validation';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';

type RouteCtx = {
  params: Promise<{ id: string }>;
};

function toDateOrNull(value: unknown) {
  if (!value) return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function toNumber(value: unknown, fallback: number) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function toItemResponse(item: Record<string, unknown>) {
  return {
    _id: String(item._id || ''),
    tripId: String(item.tripId || ''),
    placeId: String(item.placeId || ''),
    day: Number(item.day || 1),
    orderIndex: Number(item.orderIndex || 0),
    note: item.note ? String(item.note) : '',
    startTime: item.startTime ? new Date(String(item.startTime)).toISOString() : null,
    endTime: item.endTime ? new Date(String(item.endTime)).toISOString() : null,
    cost: item.cost ?? null,
    currency: item.currency ? String(item.currency) : null,
    createdAt: item.createdAt ? new Date(String(item.createdAt)).toISOString() : '',
  };
}

async function findOwnedTrip(tripId: string, userId: string) {
  const db = await getDb();
  const trip = await db.trips.findById(tripId);
  if (!trip || String(trip.userId) !== userId) return null;
  return trip;
}

export async function GET(request: NextRequest, ctx: RouteCtx) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials', 401);
    }

    const { id } = await ctx.params;
    ObjectIdSchema.parse(id);

    const trip = await findOwnedTrip(id, userId);
    if (!trip) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy hành trình', 404);
    }

    const db = await getDb();
    const items = await db.itineraryItems.find({ tripId: id });
    items.sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return a.orderIndex - b.orderIndex;
    });

    return sendSuccess(items.map((item) => toItemResponse(item as unknown as Record<string, unknown>)));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, ctx: RouteCtx) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials', 401);
    }

    const { id } = await ctx.params;
    ObjectIdSchema.parse(id);

    const trip = await findOwnedTrip(id, userId);
    if (!trip) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy hành trình', 404);
    }

    const body = await request.json().catch(() => ({}));
    
    const placeId = body.placeId ? String(body.placeId).trim() : '';
    ObjectIdSchema.parse(placeId);

    const db = await getDb();
    const place = await db.places.findById(placeId);
    if (!place) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy địa điểm', 404);
    }

    const existingItems = await db.itineraryItems.find({ tripId: id });
    const day = Math.max(1, Math.floor(toNumber(body.day, 1)));
    const fallbackOrder = existingItems.filter((item) => item.day === day).length;
    const orderIndex = Math.max(0, Math.floor(toNumber(body.orderIndex, fallbackOrder)));
    const cost = body.cost === undefined || body.cost === null || body.cost === '' ? null : Number(body.cost);

    if (cost !== null && !Number.isFinite(cost)) {
      throw new AppError('VALIDATION_ERROR', 'Chi phí không hợp lệ', 400);
    }

    const created = await db.itineraryItems.insertOne({
      tripId: id,
      placeId,
      day,
      orderIndex,
      note: body.note ? String(body.note).trim() : null,
      startTime: toDateOrNull(body.startTime),
      endTime: toDateOrNull(body.endTime),
      cost,
      currency: body.currency ? String(body.currency).trim() : null,
      metadata: null,
    });

    try {
      await createAuditLog(userId, 'CREATE_ITINERARY_ITEM', 'ITINERARY_ITEM', created._id, {
        tripId: id,
        placeId,
      });
    } catch {}

    return sendSuccess(toItemResponse(created as unknown as Record<string, unknown>), 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, ctx: RouteCtx) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials', 401);
    }

    const { id: tripId } = await ctx.params;
    ObjectIdSchema.parse(tripId);

    const trip = await findOwnedTrip(tripId, userId);
    if (!trip) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy hành trình', 404);
    }

    const body = await request.json().catch(() => ({}));
    const itemId = body.itemId ? String(body.itemId).trim() : '';
    ObjectIdSchema.parse(itemId);

    const db = await getDb();
    const item = await db.itineraryItems.findById(itemId);
    if (!item || String(item.tripId) !== tripId) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy hoạt động lịch trình', 404);
    }

    const updates: Record<string, unknown> = {};
    if (body.day != null) updates.day = Math.max(1, Math.floor(Number(body.day)));
    if (body.orderIndex != null) updates.orderIndex = Math.max(0, Math.floor(Number(body.orderIndex)));
    if (body.note !== undefined) updates.note = body.note ? String(body.note).trim() : null;
    if (body.startTime !== undefined) updates.startTime = toDateOrNull(body.startTime);
    if (body.endTime !== undefined) updates.endTime = toDateOrNull(body.endTime);
    if (body.cost !== undefined) {
      const c = body.cost === null || body.cost === '' ? null : Number(body.cost);
      if (c !== null && !Number.isFinite(c)) {
        throw new AppError('VALIDATION_ERROR', 'Chi phí không hợp lệ', 400);
      }
      updates.cost = c;
    }
    if (body.currency !== undefined) updates.currency = body.currency ? String(body.currency).trim() : null;

    if (Object.keys(updates).length === 0) {
      throw new AppError('VALIDATION_ERROR', 'Không có trường hợp lệ để cập nhật', 400);
    }

    const updated = await db.itineraryItems.updateOne(itemId, updates);
    return sendSuccess(toItemResponse(updated as unknown as Record<string, unknown>));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, ctx: RouteCtx) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials', 401);
    }

    const { id: tripId } = await ctx.params;
    ObjectIdSchema.parse(tripId);

    const trip = await findOwnedTrip(tripId, userId);
    if (!trip) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy hành trình', 404);
    }

    const body = await request.json().catch(() => ({} as any));
    const itemId = body.itemId ? String(body.itemId).trim() : '';
    ObjectIdSchema.parse(itemId);

    const db = await getDb();
    const item = await db.itineraryItems.findById(itemId);
    if (!item || String(item.tripId) !== tripId) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy hoạt động lịch trình', 404);
    }

    await db.itineraryItems.deleteOne(itemId);

    try {
      await createAuditLog(userId, 'DELETE_ITINERARY_ITEM', 'ITINERARY_ITEM', itemId, { tripId });
    } catch {}

    return sendSuccess({ message: 'Itinerary item removed' });
  } catch (error) {
    return handleApiError(error);
  }
}

