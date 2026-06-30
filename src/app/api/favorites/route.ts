import { NextRequest } from 'next/server';
import { getDb, type FavoritePlace } from '@/lib/db';
import { getAuthUserFull } from '@/lib/auth';
import { createFavoriteSchema } from '@/lib/validations/favorite';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';

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

    const db = await getDb();

    const paged = await db.favorites.findPaginated(
      { userId },
      { page, limit, sortBy: 'createdAt', sortOrder: -1 }
    );
    const total = paged.total;
    const items = paged.data as FavoritePlace[];

    const placeIds = items
      .map((f) => f.placeId)
      .filter((id): id is string => Boolean(id));

    const places = await db.places.find({ _id: { $in: placeIds } });
    const placeMap = new Map(places.map((p) => [String(p._id), p]));

    const data = items.map((f: FavoritePlace) => {
      const place = f.placeId ? placeMap.get(String(f.placeId)) : null;
      return {
        _id: f._id,
        placeId: f.placeId || null,
        name: place?.name || 'Địa điểm đã lưu',
        type: place?.type || 'custom',
        address: place?.address || '',
        lat: place?.lat ?? 0,
        lng: place?.lng ?? 0,
      };
    });

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

    const place = await db.places.findById(placeId!);
    const buildFav = (favId: unknown) => ({
      _id: favId,
      placeId: placeId!,
      name: place?.name || parsed.name || 'Địa điểm đã lưu',
      type: place?.type || 'custom',
      address: place?.address || parsed.address || '',
      lat: place?.lat ?? parsed.lat ?? 0,
      lng: place?.lng ?? parsed.lng ?? 0,
    });

    const existing = await db.favorites.findOne({ userId, placeId: placeId! });
    if (existing) {
      return sendSuccess(buildFav(existing._id), 'Địa điểm đã được lưu');
    }

    try {
      const created = await db.favorites.insertOne({
        userId,
        placeId: placeId!,
      });
      return sendSuccess(buildFav(created._id), undefined, 201);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: number }).code === 11000) {
        const dup = await db.favorites.findOne({ userId, placeId: placeId! });
        return sendSuccess(buildFav(dup?._id), 'Địa điểm đã được lưu');
      }
      throw err;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
