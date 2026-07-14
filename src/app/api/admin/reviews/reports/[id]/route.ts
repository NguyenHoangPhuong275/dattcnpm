import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAuditLog, getDb, type ReviewReport } from '@/lib/db';
import { getAuthUserFull } from '@/lib/auth';
import { hasAdminSession } from '@/lib/admin-auth';
import { objectIdSchema } from '@/lib/validations/common';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';

type RouteCtx = {
  params: Promise<{ id: string }>;
};

const updateReportSchema = z.object({
  status: z.enum(['resolved', 'dismissed']),
});

export async function PATCH(request: NextRequest, ctx: RouteCtx): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    const isEnvironmentAdmin = await hasAdminSession(request);
    if (!user && !isEnvironmentAdmin) {
      throw new AppError('UNAUTHORIZED', 'Phiên đăng nhập không hợp lệ hoặc tài khoản đã bị khóa', 401);
    }
    if (user && user.role !== 'ADMIN' && !isEnvironmentAdmin) {
      throw new AppError('FORBIDDEN', 'Chỉ quản trị viên mới có quyền truy cập', 403);
    }
    const auditActorId = user?.role === 'ADMIN' ? String(user._id) : null;
    const rateLimitActor = auditActorId ?? 'environment-admin';

    const rate = await checkRateLimit({
      key: `rl:resolve-review-report:${rateLimitActor}`,
      limit: 60,
      windowSeconds: 60,
    });
    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Bạn đang xử lý báo cáo quá nhanh. Vui lòng thử lại sau.', 429);
    }

    const { id } = await ctx.params;
    objectIdSchema.parse(id);

    const body = await request.json().catch(() => ({}));
    const parsed = updateReportSchema.parse(body);

    const db = await getDb();
    const report = (await db.reviewReports.findById(id)) as ReviewReport | null;
    if (!report) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy báo cáo đánh giá', 404);
    }
    if (report.status !== 'pending') {
      throw new AppError('CONFLICT', 'Báo cáo này đã được xử lý trước đó', 409);
    }

    const updated = await db.reviewReports.findOneAndUpdate(
      { _id: id, status: 'pending' },
      { $set: { status: parsed.status } },
    );
    if (!updated) {
      throw new AppError('CONFLICT', 'Báo cáo này vừa được xử lý. Vui lòng tải lại thông tin', 409);
    }

    await createAuditLog(auditActorId, 'RESOLVE_REVIEW_REPORT', 'REVIEW_REPORT', id, {
      reviewId: String(report.reviewId),
      status: parsed.status,
      actorType: auditActorId ? 'user-admin' : 'environment-admin',
    }).catch(() => {});

    return sendSuccess(
      { id, status: parsed.status },
      parsed.status === 'resolved' ? 'Đã ghi nhận báo cáo là đã xử lý' : 'Đã xác nhận nội dung không vi phạm',
    );
  } catch (error) {
    return handleApiError(error);
  }
}
