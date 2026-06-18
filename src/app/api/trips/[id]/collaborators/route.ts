import { NextRequest } from 'next/server';
import { createAuditLog, findOwnedTrip, findUserByEmail, getDb, type Trip, type TripCollaborator } from '@/lib/db';
import { getAuthUserFull } from '@/lib/auth';
import { objectIdSchema } from '@/lib/validations/common';
import { addCollaboratorSchema } from '@/lib/validations/collaborator';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';

type RouteCtx = {
  params: Promise<{ id: string }>;
};

function toCollaboratorResponse(c: TripCollaborator) {
  return {
    userId: String(c.userId),
    permission: c.permission,
    invitedAt: c.invitedAt ? new Date(c.invitedAt).toISOString() : null,
    acceptedAt: c.acceptedAt ? new Date(c.acceptedAt).toISOString() : null,
  };
}

export async function GET(request: NextRequest, ctx: RouteCtx): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials or user is locked', 401);
    }
    const userId = String(user._id);

    const { id } = await ctx.params;
    objectIdSchema.parse(id);

    const trip = await findOwnedTrip(id, userId);
    if (!trip) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy hành trình', 404);
    }

    return sendSuccess((trip.collaborators ?? []).map(toCollaboratorResponse));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, ctx: RouteCtx): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials or user is locked', 401);
    }
    const userId = String(user._id);

    const rate = await checkRateLimit({
      key: `rl:add-collaborator:${userId}`,
      limit: 30,
      windowSeconds: 60,
    });
    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Bạn đang mời quá nhanh. Vui lòng thử lại sau.', 429);
    }

    const { id } = await ctx.params;
    objectIdSchema.parse(id);

    const trip = (await findOwnedTrip(id, userId)) as Trip | null;
    if (!trip) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy hành trình', 404);
    }

    const body = await request.json().catch(() => ({}));
    const parsed = addCollaboratorSchema.parse(body);

    const invitee = await findUserByEmail(parsed.email);
    if (!invitee) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy người dùng với email này', 404);
    }

    const inviteeId = String(invitee._id);
    if (inviteeId === userId) {
      throw new AppError('VALIDATION_ERROR', 'Bạn không thể mời chính mình', 400);
    }

    const collaborators = [...(trip.collaborators ?? [])] as TripCollaborator[];
    const existingIndex = collaborators.findIndex((c) => String(c.userId) === inviteeId);
    const now = new Date();

    if (existingIndex >= 0) {
      collaborators[existingIndex] = { ...collaborators[existingIndex], permission: parsed.permission };
    } else {
      collaborators.push({
        userId: inviteeId as unknown as TripCollaborator['userId'],
        permission: parsed.permission,
        invitedAt: now,
        acceptedAt: null,
      });
    }

    const db = await getDb();
    await db.trips.updateOne(id, { $set: { collaborators } });

    await createAuditLog(userId, 'ADD_COLLABORATOR', 'TRIP', id, {
      tripId: id,
      collaboratorId: inviteeId,
      permission: parsed.permission,
    }).catch((err) => console.error('Lỗi khi ghi audit log ADD_COLLABORATOR:', err));

    return sendSuccess(
      { userId: inviteeId, permission: parsed.permission },
      'Đã thêm cộng tác viên',
      existingIndex >= 0 ? 200 : 201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
