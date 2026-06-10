import { NextRequest } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import { SearchHistoryCreateSchema } from '@/lib/validations/validation';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';

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
    const userId = await getAuthUserId(request);
    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials', 401);
    }

    const db = await getDb();
    const histories = await db.searchHistories.find({ userId });
    const data = histories
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50)
      .map((item) => toHistoryResponse(item as unknown as Record<string, unknown>));

    return sendSuccess(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials', 401);
    }

    const body = await request.json().catch(() => ({}));
    const parsed = SearchHistoryCreateSchema.parse(body);

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

    const histories = await db.searchHistories.find({ userId });
    const excess = histories
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(50);

    await Promise.all(excess.map((item) => db.searchHistories.deleteOne(item._id)));

    return sendSuccess(toHistoryResponse(created as unknown as Record<string, unknown>), 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials', 401);
    }

    const db = await getDb();
    const histories = await db.searchHistories.find({ userId });
    await Promise.all(histories.map((item) => db.searchHistories.deleteOne(item._id)));

    return sendSuccess({ message: 'Search history cleared' });
  } catch (error) {
    return handleApiError(error);
  }
}
