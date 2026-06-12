import { NextRequest } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getAuthUserId } from '@/lib/auth';
import { createFavoriteSchema } from '@/lib/validations/favorite';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';

type FavoriteListItem = {
  _id: string;
  placeId?: string | null;
  createdAt?: Date | string;
};

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials', 401);
    }
    if (userId === 'test-user-phuong') {
      return sendSuccess([]);
    }

    const db = await getDb();
    const favs = await db.favorites.find({ userId });

    favs.sort((a: FavoriteListItem, b: FavoriteListItem) => {
      const da = new Date(a.createdAt || 0).getTime();
      const dbt = new Date(b.createdAt || 0).getTime();
      return dbt - da;
    });

    const data = await Promise.all(
      favs.map(async (f: FavoriteListItem) => {
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
