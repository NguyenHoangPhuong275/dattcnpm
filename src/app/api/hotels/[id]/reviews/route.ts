import { NextRequest } from 'next/server';
import { getDb, createAuditLog, type HotelReview, type User } from '@/lib/db';
import { getAuthUserFull, getAuthUserId } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { objectIdSchema } from '@/lib/validations/common';
import { createHotelReviewSchema } from '@/lib/validations/hotel-review';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';

type RouteCtx = {
  params: Promise<{ id: string }>;
};

function buildDistribution(reviews: HotelReview[]): Record<string, number> {
  const distribution: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
  for (const review of reviews) {
    const key = String(review.rating);
    if (key in distribution) distribution[key] += 1;
  }
  return distribution;
}

export async function GET(request: NextRequest, ctx: RouteCtx): Promise<Response> {
  try {
    const { id } = await ctx.params;
    objectIdSchema.parse(id);

    const viewerId = await getAuthUserId(request);
    const rate = await checkRateLimit({
      key: `rl:hotel-reviews:${viewerId || getClientIp(request)}`,
      limit: 120,
      windowSeconds: 60,
    });
    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Quá nhiều yêu cầu. Vui lòng thử lại sau.', 429);
    }

    const db = await getDb();
    const reviews = (await db.hotelReviews.find(
      { hotelId: id, deletedAt: null },
      { sortBy: 'createdAt', sortOrder: -1 }
    )) as HotelReview[];

    const userIds = [...new Set(reviews.map((review) => String(review.userId)))];
    const users = userIds.length
      ? ((await db.users.find({ _id: { $in: userIds } })) as User[])
      : [];
    const nameById = new Map(users.map((user) => [String(user._id), user]));

    const items = reviews.map((review) => {
      const author = nameById.get(String(review.userId));
      return {
        id: String(review._id),
        author: author?.fullName?.trim() || 'Người dùng',
        avatarUrl: author?.avatarUrl ?? null,
        rating: review.rating,
        comment: review.comment ?? '',
        createdAt: new Date(review.createdAt).toISOString(),
        isMine: viewerId ? String(review.userId) === viewerId : false,
      };
    });

    const count = reviews.length;
    const sum = reviews.reduce((total, review) => total + review.rating, 0);
    const average = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;
    const mine = items.find((item) => item.isMine) ?? null;

    return sendSuccess({
      items,
      count,
      average,
      distribution: buildDistribution(reviews),
      mine,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, ctx: RouteCtx): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Vui lòng đăng nhập để đánh giá', 401);
    }
    const userId = String(user._id);

    const rate = await checkRateLimit({
      key: `rl:create-hotel-review:${userId}`,
      limit: 15,
      windowSeconds: 60,
    });
    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Bạn đang đánh giá quá nhanh. Vui lòng thử lại sau.', 429);
    }

    const { id } = await ctx.params;
    objectIdSchema.parse(id);

    const db = await getDb();
    const hotel = await db.hotels.findById(id);
    if (!hotel) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy khách sạn', 404);
    }

    const body = await request.json().catch(() => ({}));
    const parsed = createHotelReviewSchema.parse(body);

    const existing = (await db.hotelReviews.findOne({ hotelId: id, userId, deletedAt: null })) as HotelReview | null;

    let saved: HotelReview;
    if (existing) {
      saved = (await db.hotelReviews.updateOne(existing._id, {
        $set: { rating: parsed.rating, comment: parsed.comment ?? null },
      })) as HotelReview;
    } else {
      saved = (await db.hotelReviews.insertOne({
        hotelId: id,
        userId,
        rating: parsed.rating,
        comment: parsed.comment ?? null,
        deletedAt: null,
      })) as HotelReview;
    }

    await createAuditLog(userId, existing ? 'UPDATE_HOTEL_REVIEW' : 'CREATE_HOTEL_REVIEW', 'HOTEL_REVIEW', saved._id, {
      hotelId: id,
      rating: parsed.rating,
    }).catch((err) => console.error('Lỗi khi ghi audit log HOTEL_REVIEW:', err));

    return sendSuccess({ id: String(saved._id) }, undefined, existing ? 200 : 201);
  } catch (error) {
    return handleApiError(error);
  }
}
