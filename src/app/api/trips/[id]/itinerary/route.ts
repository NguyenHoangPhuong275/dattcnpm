import { NextRequest } from 'next/server';
import { createAuditLog, findOwnedTrip, getDb } from '@/lib/db';
import { getAuthUserFull } from '@/lib/auth';
import { objectIdSchema } from '@/lib/validations/common';
import { createItineraryItemSchema } from '@/lib/validations/trip';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';
import { parseValidDate } from '@/lib/date';
import { assertTripDayIsSchedulable } from '@/lib/itinerary-utils';
import { toItineraryItemResponse } from '@/lib/trip-formatters';
import type { ItineraryItem } from '@/types/trip';

type RouteCtx = {
  params: Promise<{ id: string }>;
};

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

    const db = await getDb();
    const items = (await db.itineraryItems.find({ tripId: id })) as ItineraryItem[];
    items.sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return a.orderIndex - b.orderIndex;
    });

    return sendSuccess(items.map((item) => toItineraryItemResponse(item)));
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
      key: `rl:create-itinerary:${userId}`,
      limit: 30,
      windowSeconds: 60,
    });
    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Bạn đang thêm địa điểm quá nhanh. Vui lòng thử lại sau.', 429);
    }

    const { id } = await ctx.params;
    objectIdSchema.parse(id);

    const trip = await findOwnedTrip(id, userId);
    if (!trip) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy hành trình', 404);
    }

    const body = await request.json().catch(() => ({}));
    const parsed = createItineraryItemSchema.parse(body);

    const db = await getDb();
    const place = await db.places.findById(parsed.placeId);
    if (!place) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy địa điểm', 404);
    }

    assertTripDayIsSchedulable(trip, parsed.day);

    const existingItems = await db.itineraryItems.find({ tripId: id });
    const fallbackOrder = existingItems.filter((item) => item.day === parsed.day).length;
    const orderIndex = parsed.orderIndex ?? fallbackOrder;

    const created = (await db.itineraryItems.insertOne({
      tripId: id,
      placeId: parsed.placeId,
      day: parsed.day,
      orderIndex,
      note: parsed.note ?? null,
      startTime: parseValidDate(parsed.startTime),
      endTime: parseValidDate(parsed.endTime),
      cost: parsed.cost ?? null,
      currency: parsed.currency ?? null,
      metadata: null,
    })) as ItineraryItem;

    try {
      await createAuditLog(userId, 'CREATE_ITINERARY_ITEM', 'ITINERARY_ITEM', created._id, {
        tripId: id,
        placeId: parsed.placeId,
      });
    } catch (err) {
      console.error('Lỗi khi ghi audit log CREATE_ITINERARY_ITEM:', err);
    }

    return sendSuccess(toItineraryItemResponse(created), 201);
  } catch (error) {
    return handleApiError(error);
  }
}
