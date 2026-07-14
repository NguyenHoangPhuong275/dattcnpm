import { NextRequest } from 'next/server';
import { createAuditLog, findOwnedTrip, getDb } from '@/lib/db';
import { getAuthUserFull } from '@/lib/auth';
import { objectIdSchema } from '@/lib/validations/common';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';

type RouteCtx = {
  params: Promise<{ id: string; userId: string }>;
};

export async function DELETE(request: NextRequest, ctx: RouteCtx): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Phiên đăng nhập không hợp lệ hoặc tài khoản đã bị khóa', 401);
    }
    const ownerId = String(user._id);

    const { id, userId: collaboratorId } = await ctx.params;
    objectIdSchema.parse(id);
    objectIdSchema.parse(collaboratorId);

    const trip = await findOwnedTrip(id, ownerId);
    if (!trip) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy hành trình', 404);
    }

    if (!(trip.collaborators ?? []).some((collaborator) => String(collaborator.userId) === collaboratorId)) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy cộng tác viên', 404);
    }

    const db = await getDb();
    const updated = await db.trips.findOneAndUpdate(
      {
        _id: id,
        userId: ownerId,
        deletedAt: null,
        'collaborators.userId': collaboratorId,
      },
      { $pull: { collaborators: { userId: collaboratorId } } },
    );
    if (!updated) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy cộng tác viên', 404);
    }

    await createAuditLog(ownerId, 'REMOVE_COLLABORATOR', 'TRIP', id, {
      tripId: id,
      collaboratorId,
    }).catch(() => {});

    return sendSuccess({ message: 'Đã xóa cộng tác viên' });
  } catch (error) {
    return handleApiError(error);
  }
}
