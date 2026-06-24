import { NextRequest } from 'next/server';
import { createAuditLog, getDb, type ReviewReport } from '@/lib/db';
import { getAuthUserFull } from '@/lib/auth';
import { objectIdSchema } from '@/lib/validations/common';
import { reportReviewSchema } from '@/lib/validations/report';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';

type RouteCtx = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, ctx: RouteCtx): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials or user is locked', 401);
    }
    const userId = String(user._id);

    const rate = await checkRateLimit({
      key: `rl:report-review:${userId}`,
      limit: 20,
      windowSeconds: 60,
    });
    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Bạn đang báo cáo quá nhanh. Vui lòng thử lại sau.', 429);
    }

    const { id: reviewId } = await ctx.params;
    objectIdSchema.parse(reviewId);

    const body = await request.json().catch(() => ({}));
    const parsed = reportReviewSchema.parse(body);

    const db = await getDb();
    const review = await db.reviews.findById(reviewId);
    if (!review || review.deletedAt) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy đánh giá', 404);
    }

    if (String(review.userId) === userId) {
      throw new AppError('FORBIDDEN', 'Bạn không thể báo cáo đánh giá của chính mình', 403);
    }

    let created: ReviewReport;
    try {
      created = (await db.reviewReports.insertOne({
        reviewId,
        reportedBy: userId,
        reason: parsed.reason,
        note: parsed.note ?? null,
        status: 'pending',
      })) as ReviewReport;
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: number }).code === 11000) {
        throw new AppError('CONFLICT', 'Bạn đã báo cáo đánh giá này rồi', 409);
      }
      throw err;
    }

    await createAuditLog(userId, 'REPORT_REVIEW', 'REVIEW', reviewId, { reason: parsed.reason }).catch(() => {}
    );

    return sendSuccess({ id: String(created._id), status: created.status }, 'Đã gửi báo cáo', 201);
  } catch (error) {
    return handleApiError(error);
  }
}
