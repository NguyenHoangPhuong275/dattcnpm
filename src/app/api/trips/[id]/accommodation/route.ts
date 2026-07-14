import { NextRequest } from 'next/server';
import { createAuditLog, getDb, type Hotel, type TripAccommodation } from '@/lib/db';
import { getAuthUserFull } from '@/lib/auth';
import { getTripForEdit, getTripForMemberView } from '@/lib/trip-permission';
import { objectIdSchema } from '@/lib/validations/common';
import { createAccommodationSchema } from '@/lib/validations/accommodation';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';
import { toAccommodationResponse } from '@/lib/trip-formatters';
import { normalizeVietnameseText } from '@/lib/string';

type RouteCtx = {
  params: Promise<{ id: string }>;
};

type AppDb = Awaited<ReturnType<typeof getDb>>;

function normalizedHotelText(value?: string | null): string {
  return normalizeVietnameseText(value ?? '');
}

async function resolveLegacyHotelIds(
  db: AppDb,
  items: TripAccommodation[],
): Promise<Map<string, string>> {
  const legacyItems = items.filter((item) => !item.hotelId && item.name.trim());
  const names = [...new Set(legacyItems.map((item) => item.name))];
  if (names.length === 0) return new Map();

  const hotels = (await db.hotels.find({ name: { $in: names } })) as Hotel[];
  const result = new Map<string, string>();

  for (const item of legacyItems) {
    const normalizedName = normalizedHotelText(item.name);
    const candidates = hotels.filter((hotel) => normalizedHotelText(hotel.name) === normalizedName);
    const normalizedAddress = normalizedHotelText(item.address);
    const addressMatches = normalizedAddress
      ? candidates.filter((hotel) => normalizedHotelText(hotel.address) === normalizedAddress)
      : [];
    let matched: Hotel | null = null;
    if (normalizedAddress && addressMatches.length === 1) {
      matched = addressMatches[0];
    } else if (!normalizedAddress && candidates.length === 1) {
      matched = candidates[0];
    }

    if (matched) result.set(String(item._id), String(matched._id));
  }

  return result;
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
    const items = (await db.tripAccommodations.find({ tripId: id })) as TripAccommodation[];
    items.sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());
    const legacyHotelIds = await resolveLegacyHotelIds(db, items);

    const bookings = await db.hotelBookings.find({ tripId: id, userId }) as any[];
    const bookingByKeys = new Map<string, string>();
    for (const b of bookings) {
      const key = `${b.hotelId}_${new Date(b.checkIn).getTime()}_${new Date(b.checkOut).getTime()}`;
      bookingByKeys.set(key, String(b._id));
    }

    return sendSuccess(items.map((item) => {
      const resolvedHotelId = item.hotelId ?? legacyHotelIds.get(String(item._id)) ?? null;
      let bookingRef = item.bookingRef;
      if (!bookingRef && resolvedHotelId) {
        const key = `${resolvedHotelId}_${new Date(item.checkIn).getTime()}_${new Date(item.checkOut).getTime()}`;
        bookingRef = bookingByKeys.get(key) ?? null;
      }
      return toAccommodationResponse(item, {
        hotelId: resolvedHotelId,
        bookingRef,
      });
    }));
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
      key: `rl:create-accommodation:${userId}`,
      limit: 40,
      windowSeconds: 60,
    });
    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Bạn đang thêm nơi lưu trú quá nhanh. Vui lòng thử lại sau.', 429);
    }

    const { id } = await ctx.params;
    objectIdSchema.parse(id);

    await getTripForEdit(id, userId);

    const body = await request.json().catch(() => ({}));
    const parsed = createAccommodationSchema.parse(body);

    const db = await getDb();
    const hotel = parsed.hotelId ? await db.hotels.findById(parsed.hotelId) : null;
    if (parsed.hotelId && !hotel) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy khách sạn', 404);
    }
    const created = (await db.tripAccommodations.insertOne({
      tripId: id,
      hotelId: hotel?._id ?? null,
      name: hotel?.name ?? parsed.name,
      address: hotel ? hotel.address ?? parsed.address ?? null : parsed.address ?? null,
      checkIn: new Date(parsed.checkIn),
      checkOut: new Date(parsed.checkOut),
      bookingRef: parsed.bookingCode ?? null,
      note: parsed.note ?? null,
      currency: parsed.currency,
    })) as TripAccommodation;

    await createAuditLog(userId, 'CREATE_ACCOMMODATION', 'TRIP_ACCOMMODATION', created._id, {
      tripId: id,
      hotelId: hotel?._id ?? null,
    }).catch(() => {});

    return sendSuccess(toAccommodationResponse(created), undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
