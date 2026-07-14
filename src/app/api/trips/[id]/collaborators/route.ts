import { NextRequest } from 'next/server';
import { createAuditLog, findOwnedTrip, findUserByEmail, getDb, type Trip, type TripCollaborator, type User } from '@/lib/db';
import { getAuthUserFull } from '@/lib/auth';
import { objectIdSchema } from '@/lib/validations/common';
import { addCollaboratorSchema } from '@/lib/validations/collaborator';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';

type RouteCtx = {
  params: Promise<{ id: string }>;
};

type CollaboratorIdentity = Pick<User, '_id' | 'fullName' | 'email'>;

function toCollaboratorResponse(c: TripCollaborator, user?: CollaboratorIdentity) {
  return {
    userId: String(c.userId),
    displayName: user?.fullName?.trim() || user?.email || 'Cộng tác viên',
    email: user?.email ?? null,
    permission: c.permission,
    invitedAt: c.invitedAt ? new Date(c.invitedAt).toISOString() : null,
    acceptedAt: c.acceptedAt ? new Date(c.acceptedAt).toISOString() : null,
  };
}

type TripCollection = Awaited<ReturnType<typeof getDb>>['trips'];

async function updateExistingCollaborator(params: {
  trips: TripCollection;
  tripId: string;
  ownerId: string;
  collaboratorId: string;
  permission: TripCollaborator['permission'];
  acceptedAt: Date;
}): Promise<Trip | null> {
  const baseFilter = {
    _id: params.tripId,
    userId: params.ownerId,
    deletedAt: null,
  };
  const accepted = await params.trips.findOneAndUpdate(
    {
      ...baseFilter,
      collaborators: {
        $elemMatch: {
          userId: params.collaboratorId,
          acceptedAt: { $ne: null },
        },
      },
    },
    { $set: { 'collaborators.$.permission': params.permission } },
  );
  if (accepted) return accepted;

  return params.trips.findOneAndUpdate(
    {
      ...baseFilter,
      collaborators: {
        $elemMatch: {
          userId: params.collaboratorId,
          acceptedAt: null,
        },
      },
    },
    {
      $set: {
        'collaborators.$.permission': params.permission,
        'collaborators.$.acceptedAt': params.acceptedAt,
      },
    },
  );
}

export async function GET(request: NextRequest, ctx: RouteCtx): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Phiên đăng nhập không còn hiệu lực. Vui lòng đăng nhập lại.', 401);
    }
    const userId = String(user._id);

    const { id } = await ctx.params;
    objectIdSchema.parse(id);

    const trip = await findOwnedTrip(id, userId);
    if (!trip) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy hành trình', 404);
    }

    const collaborators = trip.collaborators ?? [];
    const collaboratorIds = collaborators.map((collaborator) => String(collaborator.userId));
    const db = await getDb();
    const collaboratorUsers = collaboratorIds.length > 0
      ? ((await db.users.find(
          { _id: { $in: collaboratorIds } },
          { projection: { _id: 1, fullName: 1, email: 1 } },
        )) as CollaboratorIdentity[])
      : [];
    const usersById = new Map(collaboratorUsers.map((collaborator) => [String(collaborator._id), collaborator]));

    return sendSuccess(
      collaborators.map((collaborator) => toCollaboratorResponse(
        collaborator,
        usersById.get(String(collaborator.userId)),
      )),
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, ctx: RouteCtx): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Phiên đăng nhập không còn hiệu lực. Vui lòng đăng nhập lại.', 401);
    }
    const userId = String(user._id);

    const rate = await checkRateLimit({
      key: `rl:add-collaborator:${userId}`,
      limit: 30,
      windowSeconds: 60,
    });
    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Bạn đang thêm cộng tác viên quá nhanh. Vui lòng thử lại sau.', 429);
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
      throw new AppError('VALIDATION_ERROR', 'Bạn không thể thêm chính mình', 400);
    }

    const now = new Date();
    const db = await getDb();
    const updateParams = {
      trips: db.trips,
      tripId: id,
      ownerId: userId,
      collaboratorId: inviteeId,
      permission: parsed.permission,
      acceptedAt: now,
    };
    let updated = await updateExistingCollaborator(updateParams);
    let created = false;

    if (!updated) {
      updated = await db.trips.findOneAndUpdate(
        {
          _id: id,
          userId,
          deletedAt: null,
          'collaborators.userId': { $ne: inviteeId },
        },
        {
          $push: {
            collaborators: {
              userId: inviteeId,
              permission: parsed.permission,
              invitedAt: now,
              acceptedAt: now,
            },
          },
        },
      );
      created = updated !== null;
    }

    if (!updated) {
      updated = await updateExistingCollaborator(updateParams);
    }

    const savedCollaborator = updated?.collaborators?.find(
      (collaborator) => String(collaborator.userId) === inviteeId,
    );
    if (!savedCollaborator) {
      throw new AppError('CONFLICT', 'Không thể cập nhật cộng tác viên. Vui lòng thử lại.', 409);
    }

    await createAuditLog(userId, 'ADD_COLLABORATOR', 'TRIP', id, {
      tripId: id,
      collaboratorId: inviteeId,
      permission: parsed.permission,
    }).catch(() => {});

    return sendSuccess(
      toCollaboratorResponse(
        savedCollaborator,
        invitee,
      ),
      'Đã thêm cộng tác viên',
      created ? 201 : 200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
