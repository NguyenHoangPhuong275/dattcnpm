import { NextRequest } from 'next/server';
import { getAuthUserFull } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { searchHistoryCreateSchema } from '@/lib/validations/search';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { pruneSearchHistory } from '@/lib/search-history';
import { checkRateLimit } from '@/lib/rate-limit';

function toHistoryResponse(item: Record<string, unknown>) {
  return {
    _id: String(item._id || ''),
    query: String(item.query || ''),
    lat: item.lat ?? null,
    lng: item.lng ?? null,
    resultCount: item.resultCount ?? null,
    metadata: item.metadata ?? null,
    createdAt: item.createdAt ? new Date(String(item.createdAt)).toISOString() : '',
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials or user is locked', 401);
    }
    const userId = String(user._id ?? user.id);

    const db = await getDb();
    const histories = await db.searchHistories.find(
      { userId },
      { sortBy: 'createdAt', sortOrder: -1, limit: 50 }
    );
    const data = histories.map((item) => toHistoryResponse(item as unknown as Record<string, unknown>));

    return sendSuccess(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials or user is locked', 401);
    }
    const userId = String(user._id ?? user.id);

    const rate = await checkRateLimit({
      key: `rl:create-search-history:${userId}`,
      limit: 60,
      windowSeconds: 60,
    });
    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Bạn đang thao tác quá nhanh. Vui lòng thử lại sau.', 429);
    }

    const body = await request.json().catch(() => ({}));
    const parsed = searchHistoryCreateSchema.parse(body);

    const db = await getDb();
    const created = await db.searchHistories.insertOne({
      userId,
      query: parsed.query,
      lat: parsed.lat ?? null,
      lng: parsed.lng ?? null,
      resultCount: parsed.resultCount ?? null,
      metadata: parsed.metadata ?? null,
      createdAt: new Date(),
    });

    await pruneSearchHistory(db, userId);

    return sendSuccess(toHistoryResponse(created as unknown as Record<string, unknown>), 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials or user is locked', 401);
    }
    const userId = String(user._id ?? user.id);

    const db = await getDb();
    await db.searchHistories.deleteMany({ userId });

    return sendSuccess({ message: 'Search history cleared' });
  } catch (error) {
    return handleApiError(error);
  }
}
