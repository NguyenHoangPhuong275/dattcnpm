import { NextRequest } from 'next/server';
import { getDb, type ReviewReport } from '@/lib/db';
import { getAuthUserFull } from '@/lib/auth';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { REVIEW_REPORT_STATUSES } from '@/lib/db/models';

function toReportResponse(item: ReviewReport) {
  return {
    id: String(item._id),
    reviewId: String(item.reviewId),
    reportedBy: String(item.reportedBy),
    reason: item.reason,
    note: item.note ?? null,
    status: item.status,
    createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : null,
  };
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials or user is locked', 401);
    }
    if (user.role !== 'ADMIN') {
      throw new AppError('FORBIDDEN', 'Chỉ quản trị viên mới có quyền truy cập', 403);
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');

    const filter: Record<string, unknown> = {};
    if (statusParam && (REVIEW_REPORT_STATUSES as readonly string[]).includes(statusParam)) {
      filter.status = statusParam;
    }

    const db = await getDb();
    // Sắp xếp tại MongoDB thay vì in-memory để tránh tốn RAM/CPU khi số report lớn.
    const reports = (await db.reviewReports.find(filter, {
      sortBy: 'createdAt',
      sortOrder: -1,
    })) as ReviewReport[];

    return sendSuccess(reports.map(toReportResponse));
  } catch (error) {
    return handleApiError(error);
  }
}
