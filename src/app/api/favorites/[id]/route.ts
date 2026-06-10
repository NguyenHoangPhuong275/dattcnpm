import { NextRequest } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getAuthUserId } from '@/lib/auth';
import { ObjectIdSchema } from '@/lib/validations/validation';
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
    ObjectIdSchema.parse(id);

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
