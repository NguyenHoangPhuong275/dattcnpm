import { getDb } from './connection';
import type { Trip } from './schema';

export async function findOwnedTrip(tripId: string, userId: string): Promise<Trip | null> {
  const db = await getDb();
  const trip = (await db.trips.findById(tripId)) as Trip | null;
  if (!trip || trip.deletedAt || String(trip.userId) !== userId) return null;
  return trip;
}
