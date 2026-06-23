import { NextRequest } from 'next/server';
import { getDb, type Hotel } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { objectIdSchema } from '@/lib/validations/common';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';

type RouteCtx = {
  params: Promise<{ id: string }>;
};

function toHotelDetail(hotel: Hotel) {
  return {
    id: hotel._id,
    name: hotel.name,
    province: hotel.province ?? null,
    district: hotel.district ?? null,
    address: hotel.address ?? null,
    lat: typeof hotel.lat === 'number' ? hotel.lat : null,
    lng: typeof hotel.lng === 'number' ? hotel.lng : null,
    rating: typeof hotel.rating === 'number' ? hotel.rating : null,
    priceLevel: hotel.priceLevel ?? null,
    images: Array.isArray(hotel.images) ? hotel.images : [],
    source: hotel.source,
  };
}

export async function GET(request: NextRequest, ctx: RouteCtx): Promise<Response> {
  try {
    const { id } = await ctx.params;
    objectIdSchema.parse(id);

    const userId = await getAuthUserId(request);
    const rateIdentity = userId || getClientIp(request);
    const rate = await checkRateLimit({
      key: `rl:hotel-detail:${rateIdentity}`,
      limit: 120,
      windowSeconds: 60,
    });
    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Quá nhiều yêu cầu. Vui lòng thử lại sau.', 429);
    }

    const db = await getDb();
    const hotel = (await db.hotels.findById(id)) as Hotel | null;
    if (!hotel) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy khách sạn', 404);
    }

    return sendSuccess(toHotelDetail(hotel));
  } catch (error) {
    return handleApiError(error);
  }
}
