import { AppError } from '@/lib/api-response';
import { getDb } from '@/lib/db';
import type { Trip } from '@/lib/db';

export function isTripOwner(userId: string, trip: Pick<Trip, 'userId'>): boolean {
  return !!userId && String(trip.userId) === userId;
}

export function canViewTrip(userId: string, trip: Pick<Trip, 'userId' | 'collaborators' | 'isPublic'>): boolean {
  if (trip.isPublic) return true;
  if (!userId) return false;
  if (String(trip.userId) === userId) return true;
  return (trip.collaborators ?? []).some((c) => String(c.userId) === userId);
}

export function canEditTrip(userId: string, trip: Pick<Trip, 'userId' | 'collaborators'>): boolean {
  if (!userId) return false;
  if (String(trip.userId) === userId) return true;
  return (trip.collaborators ?? []).some((c) => String(c.userId) === userId && c.permission === 'EDIT');
}

export async function getTripForView(tripId: string, userId: string): Promise<Trip> {
  const db = await getDb();
  const trip = (await db.trips.findById(tripId)) as Trip | null;
  if (!trip || trip.deletedAt) {
    throw new AppError('NOT_FOUND', 'Không tìm thấy hành trình', 404);
  }
  if (!canViewTrip(userId, trip)) {
    throw new AppError('NOT_FOUND', 'Không tìm thấy hành trình', 404);
  }
  return trip;
}

export async function getTripForEdit(tripId: string, userId: string): Promise<Trip> {
  const db = await getDb();
  const trip = (await db.trips.findById(tripId)) as Trip | null;
  if (!trip || trip.deletedAt) {
    throw new AppError('NOT_FOUND', 'Không tìm thấy hành trình', 404);
  }
  if (!canViewTrip(userId, trip)) {
    throw new AppError('NOT_FOUND', 'Không tìm thấy hành trình', 404);
  }
  if (!canEditTrip(userId, trip)) {
    throw new AppError('FORBIDDEN', 'Bạn không có quyền chỉnh sửa hành trình này', 403);
  }
  return trip;
}
