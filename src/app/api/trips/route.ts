import { NextRequest } from 'next/server';
import { getDb, createAuditLog } from '@/lib/mongodb';
import { getAuthUserFull } from '@/lib/auth';
import { createTripSchema } from '@/lib/validations/trip';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';
import { toTripResponse } from '@/lib/trip-utils';
import type { Trip } from '@/types/trip';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials or user is locked', 401);
    }
    const userId = String(user._id);

    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit') || 20)));

    const db = await getDb();
    const paginated = await db.trips.findPaginated(
      { userId },
      { page, limit, sortBy: 'updatedAt', sortOrder: -1 }
    );

    
    const sortCompare = (a: Trip, b: Trip) => {
      const da = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
      const dateB = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
      return dateB - da;
    };
    paginated.data.sort(sortCompare);

    const mappedData = paginated.data.map((t: Trip) => toTripResponse(t));

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

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials or user is locked', 401);
    }
    const userId = String(user._id);

    const rate = await checkRateLimit({
      key: `rl:create-trip:${userId}`,
      limit: 15,
      windowSeconds: 60,
    });
    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Bạn đang tạo chuyến đi quá nhanh. Vui lòng thử lại sau.', 429);
    }

    const body = await request.json().catch(() => ({}));
    const parsed = createTripSchema.parse(body);

    const startDate: Date = parsed.startDate ? new Date(parsed.startDate) : new Date();
    const endDate: Date = parsed.endDate ? new Date(parsed.endDate) : new Date(Date.now() + 86_400_000 * 3);

    if (endDate.getTime() < startDate.getTime()) {
      throw new AppError('VALIDATION_ERROR', 'Ngày kết thúc phải sau ngày bắt đầu', 400);
    }

    const db = await getDb();
    const created = await db.trips.insertOne({
      userId,
      title: parsed.title,
      destination: parsed.destination,
      startDate,
      endDate,
      description: parsed.description || null,
      coverImage: parsed.coverImage || null,
      isPublic: parsed.isPublic === true,
      metadata: null,
    });

    try {
      await createAuditLog(userId, 'CREATE_TRIP', 'TRIP', created._id, {
        title: parsed.title,
        destination: parsed.destination,
      });
    } catch (err) {
      console.error('Lỗi khi ghi audit log CREATE_TRIP:', err);
    }

    return sendSuccess(toTripResponse(created), undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
