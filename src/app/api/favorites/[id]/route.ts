import { NextRequest } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getAuthUserFull } from '@/lib/auth';
import { objectIdSchema } from '@/lib/validations/common';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';

type RouteCtx = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: NextRequest, ctx: RouteCtx): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials or user is locked', 401);
    }
    const userId = String(user._id);

    const rate = await checkRateLimit({
      key: `rl:delete-favorite:${userId}`,
      limit: 30,
      windowSeconds: 60,
    });
    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Bạn đang xóa địa điểm yêu thích quá nhanh. Vui lòng thử lại sau.', 429);
    }

    const { id } = await ctx.params;
    objectIdSchema.parse(id);

    const db = await getDb();
    const favorite = await db.favorites.findById(id);
    if (!favorite || String(favorite.userId) !== userId) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy địa điểm yêu thích', 404);
    }

    const deleted = await db.favorites.deleteOne(id);
    if (!deleted) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy địa điểm yêu thích', 404);
    }

    return sendSuccess({ message: 'Favorite removed' });
  } catch (error) {
    return handleApiError(error);
  }
}
