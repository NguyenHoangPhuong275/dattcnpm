import { NextRequest } from 'next/server';
import { getDb, type Place } from '@/lib/db';
import { getAuthUserFull } from '@/lib/auth';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { hasPreferences, rankPlaces, type UserPreferences } from '@/lib/recommendation';

const CANDIDATE_POOL_SIZE = 300;

function toPlaceResponse(place: Place) {
  return {
    id: String(place._id),
    name: place.name,
    type: place.type,
    address: place.address ?? null,
    lat: place.lat,
    lng: place.lng,
    tags: place.tags ?? [],
    ratingAvg: place.ratingAvg ?? 0,
    ratingCount: place.ratingCount ?? 0,
  };
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const rate = await checkRateLimit({
      key: `rl:places-recommended:${getClientIp(request)}`,
      limit: 120,
      windowSeconds: 60,
    });
    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Bạn đang tải gợi ý quá nhanh. Vui lòng thử lại sau.', 429);
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.max(1, Math.min(50, Number(searchParams.get('limit') || 20)));

    const db = await getDb();
    const candidates = await db.places.find(
      {},
      { limit: CANDIDATE_POOL_SIZE, sortBy: 'ratingCount', sortOrder: -1 }
    );

    const user = await getAuthUserFull(request).catch(() => null);
    const prefs: UserPreferences = {
      interests: user?.interests ?? null,
      travelStyles: user?.travelStyles ?? null,
      budgetLevel: user?.budgetLevel ?? null,
      preferredDestinations: user?.preferredDestinations ?? null,
    };

    const personalized = hasPreferences(prefs);
    const ranked = personalized ? rankPlaces(candidates as Place[], prefs) : (candidates as Place[]);

    const start = (page - 1) * limit;
    const pageItems = ranked.slice(start, start + limit);

    const total = ranked.length;

    return sendSuccess({
      data: pageItems.map(toPlaceResponse),
      personalized,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
