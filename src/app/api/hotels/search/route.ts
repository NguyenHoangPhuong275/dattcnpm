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
const EARTH_RADIUS_KM = 6378.1;

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toHotelResponse(hotel: Hotel, distanceKm: number | null = null) {
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
    amenities: Array.isArray(hotel.amenities) ? hotel.amenities : [],
    image: Array.isArray(hotel.images) && hotel.images.length > 0 ? hotel.images[0] : null,
    distanceKm,
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
      radiusKm: params.get('radiusKm') ?? undefined,
      amenities: params.get('amenities') ?? undefined,
      sort: params.get('sort') ?? undefined,
      featured: params.get('featured') ?? undefined,
    });

    const featured = parsed.featured === true;

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

    const geoMode = typeof parsed.radiusKm === 'number' && typeof parsed.lat === 'number' && typeof parsed.lng === 'number';
    const provinceFilterKey = geoMode || featured ? null : resolveHotelProvinceFilterKey(criteria);
    const matchedBy = featured ? 'featured' : geoMode ? 'geo' : provinceFilterKey ? 'province' : 'keyword';

    const cacheKey = `hotels:search:v3:${normalizeVietnameseText(
      `${parsed.province ?? ''}|${parsed.destination ?? ''}|${parsed.district ?? ''}|${parsed.lat ?? ''}|${parsed.lng ?? ''}|${parsed.priceLevel ?? ''}|${parsed.minRating ?? ''}|${parsed.radiusKm ?? ''}|${(parsed.amenities ?? []).join('+')}|${parsed.sort ?? ''}`
    )}`;

    let allItems: ReturnType<typeof toHotelResponse>[] | null = null;
    const cached = featured ? null : await cacheGet(cacheKey);
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
      if (geoMode) {
        filter.location = {
          $geoWithin: { $centerSphere: [[parsed.lng, parsed.lat], (parsed.radiusKm as number) / EARTH_RADIUS_KM] },
        };
      } else if (provinceFilterKey) {
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
      } else if (featured) {
        filter.rating = { $gt: 0 };
      }
      if (parsed.amenities && parsed.amenities.length > 0) {
        filter.amenities = { $all: parsed.amenities };
      }

      const candidates = (await db.hotels.find(
        filter,
        featured ? { sortBy: 'rating', sortOrder: -1, limit: SCAN_CAP } : { limit: SCAN_CAP }
      )) as Hotel[];
      const ranked = geoMode ? candidates : featured ? shuffle(candidates) : matchHotels(candidates, criteria);

      const hasOrigin = typeof parsed.lat === 'number' && typeof parsed.lng === 'number';
      let items = ranked.map((hotel) => {
        const distance =
          hasOrigin && typeof hotel.lat === 'number' && typeof hotel.lng === 'number'
            ? Math.round(haversineKm(parsed.lat as number, parsed.lng as number, hotel.lat, hotel.lng) * 10) / 10
            : null;
        return toHotelResponse(hotel, distance);
      });

      if (parsed.sort === 'rating' || (featured && !parsed.sort)) {
        items = [...items].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      } else if (parsed.sort === 'distance' || (geoMode && !parsed.sort)) {
        items = [...items].sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
      }

      allItems = items;
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
      matchedBy,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
