import { NextRequest } from 'next/server';
import { getDb, cacheGet, cacheSet, type Hotel } from '@/lib/db';
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

    const limit = parsed.limit ?? DEFAULT_LIMIT;
    const criteria = {
      destination: parsed.destination ?? null,
      province: parsed.province ?? null,
      district: parsed.district ?? null,
      lat: parsed.lat ?? null,
      lng: parsed.lng ?? null,
    };

    const provinceFilterKey = resolveHotelProvinceFilterKey(criteria);
    const cacheKey = `hotels:search:${normalizeVietnameseText(
      `${parsed.province ?? ''}|${parsed.destination ?? ''}|${parsed.district ?? ''}|${parsed.lat ?? ''}|${parsed.lng ?? ''}|${limit}`
    )}`;

    const cached = await cacheGet(cacheKey);
    if (cached) {
      try {
        const payload = JSON.parse(cached);
        return sendSuccess(payload);
      } catch {
        // fallthrough on corrupted cache entry
      }
    }

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

    const scanned = await db.hotels.findPaginated(filter, { page: 1, limit: SCAN_CAP });
    const candidates = scanned.data as Hotel[];
    const matched = matchHotels(candidates, criteria).slice(0, limit);

    const payload = {
      hotels: matched.map(toHotelResponse),
      total: matched.length,
      matchedBy: provinceFilterKey ? 'province' : 'keyword',
    };

    await cacheSet(cacheKey, JSON.stringify(payload), CACHE_TTL);
    return sendSuccess(payload);
  } catch (error) {
    return handleApiError(error);
  }
}
