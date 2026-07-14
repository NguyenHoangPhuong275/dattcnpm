import { NextRequest } from 'next/server';

import { getDb, cacheGet, cacheSet } from '@/lib/db';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';

const CACHE_KEY = 'hotels:areas:v2';
const CACHE_TTL = 3600;

interface AreaAggregate {
  _id: string | null;
  count: number;
  avgRating: number | null;
  budget: number;
  mid: number;
  luxury: number;
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const ip = getClientIp(request);
    const rate = await checkRateLimit({ key: `rl:hotel-areas:${ip}`, limit: 60, windowSeconds: 60 });
    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Quá nhiều yêu cầu. Vui lòng thử lại sau.', 429);
    }

    const cached = await cacheGet(CACHE_KEY);
    if (cached) {
      try {
        return sendSuccess(JSON.parse(cached));
      } catch {}
    }

    const db = await getDb();
    const rows = await db.hotels.aggregate<AreaAggregate>([
      { $match: { province: { $ne: null } } },
      {
        $group: {
          _id: '$province',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          budget: { $sum: { $cond: [{ $eq: ['$priceLevel', 'budget'] }, 1, 0] } },
          mid: { $sum: { $cond: [{ $eq: ['$priceLevel', 'mid'] }, 1, 0] } },
          luxury: { $sum: { $cond: [{ $eq: ['$priceLevel', 'luxury'] }, 1, 0] } },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const areas = rows
      .filter((row): row is AreaAggregate & { _id: string } => typeof row._id === 'string' && row._id.length > 0)
      .map((row) => ({
        province: row._id,
        count: row.count,
        avgRating: typeof row.avgRating === 'number' ? Math.round(row.avgRating * 10) / 10 : null,
        budget: row.budget,
        mid: row.mid,
        luxury: row.luxury,
      }));

    await cacheSet(CACHE_KEY, JSON.stringify(areas), CACHE_TTL);
    return sendSuccess(areas);
  } catch (error) {
    return handleApiError(error);
  }
}
