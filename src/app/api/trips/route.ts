import { NextRequest } from 'next/server';
import { getDb, createAuditLog } from '@/lib/mongodb';
import { getAuthUserId } from '@/lib/auth';
import { createTripSchema } from '@/lib/validations/trip';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';
import type { Trip } from '@/types/trip';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials', 401);
    }
    const db = await getDb();
    const trips = (await db.trips.find({ userId })) as Trip[];

    trips.sort((a: Trip, b: Trip) => {
      const da = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
      const dbt = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
      return dbt - da;
    });

    const data = trips.map((t: Trip) => ({
      _id: t._id,
      title: t.title,
      destination: t.destination,
      startDate: t.startDate ? new Date(t.startDate).toISOString().split('T')[0] : '',
      endDate: t.endDate ? new Date(t.endDate).toISOString().split('T')[0] : '',
      isPublic: !!t.isPublic,
      description: t.description || '',
      coverImage: t.coverImage || null,
      createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : '',
    }));

    return sendSuccess(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials', 401);
    }

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

    const trip = {
      _id: created._id,
      title: created.title,
      destination: created.destination,
      startDate: created.startDate ? new Date(created.startDate).toISOString().split('T')[0] : '',
      endDate: created.endDate ? new Date(created.endDate).toISOString().split('T')[0] : '',
      isPublic: !!created.isPublic,
      description: created.description || '',
      coverImage: created.coverImage || null,
      createdAt: created.createdAt ? new Date(created.createdAt).toISOString() : '',
    };

    return sendSuccess(trip, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
