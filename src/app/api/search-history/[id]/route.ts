import { NextRequest } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import { objectIdSchema } from '@/lib/validations/common';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';

type RouteCtx = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: NextRequest, ctx: RouteCtx) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials', 401);
    }

    const { id } = await ctx.params;
    objectIdSchema.parse(id);

    const db = await getDb();
    const item = await db.searchHistories.findById(id);
    if (!item) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy lịch sử tìm kiếm', 404);
    }

    if (String(item.userId || '') !== userId) {
      throw new AppError('FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này', 403);
    }

    await db.searchHistories.deleteOne(id);
    return sendSuccess({ message: 'Search history item deleted' });
  } catch (error) {
    return handleApiError(error);
  }
}
