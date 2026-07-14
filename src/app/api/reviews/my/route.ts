import { NextRequest } from 'next/server';

import { getDb } from '@/lib/db';
import { getAuthUserFull } from '@/lib/auth';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { formatUtcDateOnlyStrict } from '@/lib/date';

type ReviewListItem = {
  _id: string;
  placeId?: string | null;
  rating?: number;
  comment?: string | null;
  images?: string[] | null;
  createdAt?: Date | string;
};

type ReviewPlace = {
  _id: string;
  name?: string;
  type?: string;
  address?: string | null;
};

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Phiên đăng nhập không hợp lệ hoặc tài khoản đã bị khóa', 401);
    }
    const userId = String(user._id);

    const db = await getDb();
    const reviews = await db.reviews.find(
      { userId, deletedAt: null },
      { sortBy: 'createdAt', sortOrder: -1 }
    );

    const placeIds = Array.from(
      new Set(reviews.map((review: ReviewListItem) => review.placeId).filter(Boolean))
    ) as string[];
    const places = placeIds.length > 0
      ? await db.places.find({ _id: { $in: placeIds } })
      : [];
    const placeMap = new Map(places.map((place: ReviewPlace) => [String(place._id), place]));

    const data = reviews.map((r: ReviewListItem) => {
      const place = r.placeId ? placeMap.get(String(r.placeId)) : null;
      return {
        _id: r._id,
        rating: r.rating,
        comment: r.comment || '',
        images: r.images || [],
        createdAt: r.createdAt ? formatUtcDateOnlyStrict(r.createdAt) : '',
        place: place
          ? {
              id: place._id,
              name: place.name,
              type: place.type,
              address: place.address || '',
            }
          : { id: r.placeId, name: 'Địa điểm không xác định' },
      };
    });

    return sendSuccess(data);
  } catch (error) {
    return handleApiError(error);
  }
}
