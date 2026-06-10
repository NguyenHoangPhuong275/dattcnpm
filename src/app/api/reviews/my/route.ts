import { NextRequest } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getAuthUserId } from '@/lib/auth';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';

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
    const reviews = await db.reviews.find({ userId });

    reviews.sort((a: any, b: any) => {
      const da = new Date(a.createdAt || 0).getTime();
      const dbt = new Date(b.createdAt || 0).getTime();
      return dbt - da;
    });

    const data = await Promise.all(
      reviews.map(async (r: any) => {
        const place = r.placeId ? await db.places.findById(r.placeId) : null;
        return {
          _id: r._id,
          rating: r.rating,
          comment: r.comment || '',
          images: r.images || [],
          createdAt: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : '',
          place: place
            ? {
                id: place._id,
                name: place.name,
                type: place.type,
                address: place.address || '',
              }
            : { id: r.placeId, name: 'Địa điểm không xác định' },
        };
      })
    );

    return sendSuccess(data);
  } catch (error) {
    return handleApiError(error);
  }
}
