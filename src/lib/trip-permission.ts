import { AppError } from '@/lib/api-response';
import { getDb } from '@/lib/db';
import type { Trip } from '@/lib/db';
import type { TripAccess } from '@/types/trip';

export type { TripAccess } from '@/types/trip';

type TripAccessSource = Pick<Trip, 'userId' | 'collaborators' | 'isPublic'>;

export function getTripAccess(userId: string, trip: TripAccessSource): TripAccess {
  if (userId && String(trip.userId) === userId) return 'OWNER';

  if (userId) {
    const collaborator = (trip.collaborators ?? []).find(
      (candidate) => String(candidate.userId) === userId && candidate.acceptedAt != null,
    );
    if (collaborator) return collaborator.permission;
  }

  return trip.isPublic ? 'PUBLIC' : 'NONE';
}

function isMemberAccess(access: TripAccess): boolean {
  return access === 'OWNER' || access === 'EDIT' || access === 'READ';
}

async function findTrip(tripId: string): Promise<Trip> {
  const db = await getDb();
  const trip = (await db.trips.findById(tripId)) as Trip | null;
  if (!trip || trip.deletedAt) {
    throw new AppError('NOT_FOUND', 'Không tìm thấy hành trình', 404);
  }
  return trip;
}

export async function getTripForView(tripId: string, userId: string): Promise<Trip> {
  const trip = await findTrip(tripId);
  if (getTripAccess(userId, trip) === 'NONE') {
    throw new AppError('NOT_FOUND', 'Không tìm thấy hành trình', 404);
  }
  return trip;
}

export async function getTripForMemberView(tripId: string, userId: string): Promise<Trip> {
  const trip = await findTrip(tripId);
  if (!isMemberAccess(getTripAccess(userId, trip))) {
    throw new AppError('NOT_FOUND', 'Không tìm thấy hành trình', 404);
  }
  return trip;
}

export async function getTripForEdit(tripId: string, userId: string): Promise<Trip> {
  const trip = await findTrip(tripId);
  const access = getTripAccess(userId, trip);
  if (access === 'NONE') {
    throw new AppError('NOT_FOUND', 'Không tìm thấy hành trình', 404);
  }
  if (access !== 'OWNER' && access !== 'EDIT') {
    throw new AppError('FORBIDDEN', 'Bạn không có quyền chỉnh sửa hành trình này', 403);
  }
  return trip;
}

type AppDb = Awaited<ReturnType<typeof getDb>>;

export async function getTripSubItemForEdit<T extends { tripId: unknown }>(params: {
  tripId: string;
  itemId: string;
  userId: string;
  select: (db: AppDb) => { findById: (id: string) => Promise<T | undefined> };
  notFoundMessage: string;
}): Promise<{ trip: Trip; item: T; db: AppDb }> {
  const trip = await getTripForEdit(params.tripId, params.userId);
  const db = await getDb();
  const item = await params.select(db).findById(params.itemId);
  if (!item || String(item.tripId) !== params.tripId) {
    throw new AppError('NOT_FOUND', params.notFoundMessage, 404);
  }
  return { trip, item, db };
}
