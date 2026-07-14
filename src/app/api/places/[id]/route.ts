import { NextRequest } from 'next/server';
import { getDb, type Place, type Review, type User } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { objectIdSchema } from '@/lib/validations/common';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';

type RouteCtx = {
  params: Promise<{ id: string }>;
};

const REVIEWS_LIMIT = 10;

function toPlaceDetail(place: Place) {
  return {
    id: String(place._id),
    name: place.name,
    type: place.type,
    lat: place.lat,
    lng: place.lng,
    address: place.address ?? null,
    openingHours: place.openingHours ?? null,
    images: Array.isArray(place.images) ? place.images : [],
    tags: Array.isArray(place.tags) ? place.tags : [],
    ratingAvg: place.ratingAvg ?? 0,
    ratingCount: place.ratingCount ?? 0,
  };
}

export async function GET(request: NextRequest, ctx: RouteCtx): Promise<Response> {
  try {
    const { id } = await ctx.params;
    objectIdSchema.parse(id);

    const userId = await getAuthUserId(request);
    const rateIdentity = userId || getClientIp(request);
    const rate = await checkRateLimit({
      key: `rl:place-detail:${rateIdentity}`,
      limit: 120,
      windowSeconds: 60,
    });
    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Quá nhiều yêu cầu. Vui lòng thử lại sau.', 429);
    }

    const db = await getDb();
    const place = (await db.places.findById(id)) as Place | null;
    if (!place) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy địa điểm', 404);
    }

    const reviews = (await db.reviews.find(
      { placeId: id, parentId: null, deletedAt: null },
      { sortBy: 'createdAt', sortOrder: -1, limit: REVIEWS_LIMIT },
    )) as Review[];

    const reviewerIds = [...new Set(reviews.map((review) => String(review.userId)).filter(Boolean))];
    const reviewers = reviewerIds.length
      ? ((await db.users.find(
          { _id: { $in: reviewerIds } },
          { projection: { _id: 1, fullName: 1 } },
        )) as Pick<User, '_id' | 'fullName'>[])
      : [];
    const reviewerById = new Map(reviewers.map((reviewer) => [String(reviewer._id), reviewer.fullName]));

    return sendSuccess({
      place: toPlaceDetail(place),
      reviews: reviews.map((review) => ({
        id: String(review._id),
        rating: review.rating,
        comment: review.comment ?? null,
        createdAt: review.createdAt,
        authorName: reviewerById.get(String(review.userId)) ?? 'Người dùng',
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
