import { NextRequest } from 'next/server';
import { getDb, cacheGet, cacheSet, normalizePagination, type Hotel } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { hotelSearchSchema } from '@/lib/validations/hotel';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { matchHotels, resolveHotelProvinceFilterKey } from '@/lib/hotel-matching';
import { escapeRegex, normalizeVietnameseText } from '@/lib/string';

const CACHE_TTL = 60 * 60;
const DEFAULT_LIMIT = 20;
const SCAN_CAP = 500;

function toHotelResponse(hotel: Hotel) {
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
    source: hotel.source,
  };
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const { searchParams: params } = new URL(request.url);
    const parsed = hotelSearchSchema.parse({
      destination: params.get('destination') ?? undefined,
      province: params.get('province') ?? undefined,
      district: params.get('district') ?? undefined,
      lat: params.get('lat') ?? undefined,
      lng: params.get('lng') ?? undefined,
      limit: params.get('limit') ?? undefined,
      page: params.get('page') ?? undefined,
      priceLevel: params.get('priceLevel') ?? undefined,
      minRating: params.get('minRating') ?? undefined,
    });

    const userId = await getAuthUserId(request);
    const rateIdentity = userId || getClientIp(request);
    const rate = await checkRateLimit({
      key: `rl:hotel-search:${rateIdentity}`,
      limit: 80,
      windowSeconds: 60,
    });
    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Quá nhiều yêu cầu tìm kiếm. Vui lòng thử lại sau.', 429);
    }

    const criteria = {
      destination: parsed.destination ?? null,
      province: parsed.province ?? null,
      district: parsed.district ?? null,
      lat: parsed.lat ?? null,
      lng: parsed.lng ?? null,
    };

    const provinceFilterKey = resolveHotelProvinceFilterKey(criteria);

    const cacheKey = `hotels:search:v2:${normalizeVietnameseText(
      `${parsed.province ?? ''}|${parsed.destination ?? ''}|${parsed.district ?? ''}|${parsed.lat ?? ''}|${parsed.lng ?? ''}|${parsed.priceLevel ?? ''}|${parsed.minRating ?? ''}`
    )}`;

    let allItems: ReturnType<typeof toHotelResponse>[] | null = null;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      try {
        allItems = JSON.parse(cached) as ReturnType<typeof toHotelResponse>[];
      } catch {
        allItems = null;
      }
    }

    if (!allItems) {
      const db = await getDb();
      const filter: Record<string, unknown> = {};
      if (provinceFilterKey) {
        filter.provinceKey = provinceFilterKey;
      } else {
        const term = (parsed.destination || parsed.province || '').trim();
        if (term) {
          const pattern = escapeRegex(term);
          filter.$or = [
            { name: { $regex: pattern, $options: 'i' } },
            { address: { $regex: pattern, $options: 'i' } },
            { district: { $regex: pattern, $options: 'i' } },
          ];
        }
      }

      if (parsed.priceLevel) {
        filter.priceLevel = parsed.priceLevel;
      }
      if (typeof parsed.minRating === 'number') {
        filter.rating = { $gte: parsed.minRating };
      }

      const scanned = await db.hotels.findPaginated(filter, { page: 1, limit: SCAN_CAP });
      const candidates = scanned.data as Hotel[];
      allItems = matchHotels(candidates, criteria).map(toHotelResponse);
      await cacheSet(cacheKey, JSON.stringify(allItems), CACHE_TTL);
    }

    const { page, limit } = normalizePagination({ page: parsed.page, limit: parsed.limit ?? DEFAULT_LIMIT });
    const total = allItems.length;
    const start = (page - 1) * limit;
    const data = allItems.slice(start, start + limit);

    return sendSuccess({
      data,
      total,
      page,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      matchedBy: provinceFilterKey ? 'province' : 'keyword',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
