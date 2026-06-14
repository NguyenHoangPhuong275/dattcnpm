import { NextRequest } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getAuthUserFull } from '@/lib/auth';
import { createFavoriteSchema } from '@/lib/validations/favorite';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';
import type { FavoritePlace } from '@/database/schema';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials or user is locked', 401);
    }
    const userId = String(user._id);
    const { searchParams } = new URL(request.url);
    const page  = Math.max(1, parseInt(searchParams.get('page')  ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const skip  = (page - 1) * limit;

    const db = await getDb();
    
    const allFavs = (await db.favorites.find({ userId })) as FavoritePlace[];
    
    const sortedFavs = allFavs
      .sort((a, b) => {
        const da = new Date(a.createdAt ?? 0).getTime();
        const dbDate = new Date(b.createdAt ?? 0).getTime();
        return dbDate - da;
      });

    const total = sortedFavs.length;
    const items = sortedFavs.slice(skip, skip + limit);

    const data = await Promise.all(
      items.map(async (f: FavoritePlace) => {
        const place = f.placeId ? await db.places.findById(f.placeId) : null;
        return {
          _id: f._id,
          placeId: f.placeId || null,
          name: place?.name || 'Địa điểm đã lưu',
          type: place?.type || 'custom',
          address: place?.address || '',
          lat: place?.lat ?? 0,
          lng: place?.lng ?? 0,
        };
      })
    );

    return sendSuccess({
      data,
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

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials or user is locked', 401);
    }
    const userId = String(user._id);

    const rate = await checkRateLimit({
      key: `rl:create-favorite:${userId}`,
      limit: 30,
      windowSeconds: 60,
    });
    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Bạn đang lưu địa điểm quá nhanh. Vui lòng thử lại sau.', 429);
    }

    const body = await request.json().catch(() => ({}));
    const parsed = createFavoriteSchema.parse(body);

    const db = await getDb();
    let placeId = parsed.placeId;

    const existingPlace = placeId ? await db.places.findById(placeId) : null;
    if (!existingPlace) {
      const createdPlace = await db.places.insertOne({
        name: parsed.name || 'Địa điểm đã lưu',
        type: 'custom',
        lat: parsed.lat ?? 0,
        lng: parsed.lng ?? 0,
        address: parsed.address || null,
        ratingAvg: 0,
        ratingCount: 0,
      });
      placeId = createdPlace._id;
    }

    const existing = await db.favorites.find({ userId, placeId: placeId! });
    if (existing.length > 0) {
      throw new AppError('CONFLICT', 'Địa điểm đã được lưu', 409);
    }

    const created = await db.favorites.insertOne({
      userId,
      placeId: placeId!,
    });

    const place = await db.places.findById(placeId!);
    const fav = {
      _id: created._id,
      placeId: placeId!,
      name: place?.name || parsed.name || 'Địa điểm đã lưu',
      type: place?.type || 'custom',
      address: place?.address || parsed.address || '',
      lat: place?.lat ?? parsed.lat ?? 0,
      lng: place?.lng ?? parsed.lng ?? 0,
    };

    return sendSuccess(fav, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
