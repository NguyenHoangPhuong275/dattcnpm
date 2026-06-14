import { NextRequest } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { toTripResponse } from '@/lib/trip-utils';
import type { CollectionFilter } from '@/lib/mongodb';
import type { Trip } from '@/database/schema';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const ip = getClientIp(request);
    
    
    const rate = await checkRateLimit({
      key: `rl:public-trips:${ip}`,
      limit: 60,
      windowSeconds: 60,
    });

    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Bạn đang yêu cầu quá nhanh. Vui lòng thử lại sau.', 429);
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit') || 20)));
    const destination = searchParams.get('destination')?.trim() || '';

    const filter: CollectionFilter = { isPublic: true };
    if (destination) {
      filter.destination = { $regex: destination, $options: 'i' };
    }

    const db = await getDb();
    const paginated = await db.trips.findPaginated(
      filter,
      { page, limit, sortBy: 'updatedAt', sortOrder: -1 }
    );

    const mappedData = paginated.data.map((trip: Trip) => toTripResponse(trip, { omitUserId: true }));

    return sendSuccess({
      data: mappedData,
      pagination: {
        page: paginated.page,
        limit,
        total: paginated.total,
        totalPages: paginated.totalPages,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
