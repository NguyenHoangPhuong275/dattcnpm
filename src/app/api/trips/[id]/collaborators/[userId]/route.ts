import { NextRequest } from 'next/server';
import { createAuditLog, findOwnedTrip, getDb, type Trip, type TripCollaborator } from '@/lib/db';
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
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials or user is locked', 401);
    }
    const ownerId = String(user._id);

    const { id, userId: collaboratorId } = await ctx.params;
    objectIdSchema.parse(id);
    objectIdSchema.parse(collaboratorId);

    const trip = (await findOwnedTrip(id, ownerId)) as Trip | null;
    if (!trip) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy hành trình', 404);
    }

    const collaborators = (trip.collaborators ?? []) as TripCollaborator[];
    const next = collaborators.filter((c) => String(c.userId) !== collaboratorId);
    if (next.length === collaborators.length) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy cộng tác viên', 404);
    }

    const db = await getDb();
    await db.trips.updateOne(id, { $set: { collaborators: next } });

    await createAuditLog(ownerId, 'REMOVE_COLLABORATOR', 'TRIP', id, {
      tripId: id,
      collaboratorId,
    }).catch((err) => console.error('Lỗi khi ghi audit log REMOVE_COLLABORATOR:', err));

    return sendSuccess({ message: 'Đã xóa cộng tác viên' });
  } catch (error) {
    return handleApiError(error);
  }
}
