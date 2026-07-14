import type { AppDatabase, Place } from '@/lib/db';
import {
  getTourismDestinationsByRegion,
  tourismDestinationToSearchPlace,
  type TourismDestination,
} from '@/lib/vietnam-tourism';

const DAY_MS = 86_400_000;
const SUGGESTIONS_PER_DAY = 2;

interface SeedTripItineraryInput {
  db: AppDatabase;
  tripId: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  initialPlace?: Place | null;
}

async function resolveSuggestionPlace(
  db: AppDatabase,
  suggestion: TourismDestination,
): Promise<Place> {
  const searchPlace = tourismDestinationToSearchPlace(suggestion);
  const existing = await db.places.findOne({ osmId: searchPlace.osmId });
  if (existing) return existing;

  return db.places.insertOne({
    ...searchPlace,
    ratingAvg: Number.parseFloat(suggestion.rating) || 4.5,
    ratingCount: 1,
  });
}

function getTripDayCount(startDate: Date, endDate: Date): number {
  return Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / DAY_MS) + 1);
}

export async function seedTripItinerary({
  db,
  tripId,
  destination,
  startDate,
  endDate,
  initialPlace,
}: SeedTripItineraryInput): Promise<void> {
  if (initialPlace) {
    await db.itineraryItems.insertOne({
      tripId,
      placeId: String(initialPlace._id),
      day: 1,
      orderIndex: 0,
      note: initialPlace.name,
      startTime: null,
      endTime: null,
      cost: null,
      currency: 'VND',
      metadata: null,
    });
  }

  const suggestions = getTourismDestinationsByRegion(destination);
  if (suggestions.length === 0) return;

  try {
    const resolved = await Promise.all(
      suggestions.map(async (suggestion) => ({
        suggestion,
        place: await resolveSuggestionPlace(db, suggestion),
      })),
    );
    const initialPlaceId = initialPlace ? String(initialPlace._id) : null;
    const candidates = resolved.filter(({ place }) => String(place._id) !== initialPlaceId);
    const dayCount = getTripDayCount(startDate, endDate);
    const availableSlots = dayCount * SUGGESTIONS_PER_DAY - (initialPlace ? 1 : 0);
    let day = 1;
    let orderIndex = initialPlace ? 1 : 0;

    const items = candidates.slice(0, Math.max(0, availableSlots)).map(({ suggestion, place }) => {
      const item = {
        tripId,
        placeId: String(place._id),
        day,
        orderIndex,
        note: suggestion.description || '',
        startTime: null,
        endTime: null,
        cost: null,
        currency: 'VND',
        metadata: null,
      };

      orderIndex += 1;
      if (orderIndex >= SUGGESTIONS_PER_DAY) {
        day += 1;
        orderIndex = 0;
      }
      return item;
    });

    await db.itineraryItems.insertMany(items);
  } catch {
    await db.itineraryItems.deleteMany({
      tripId,
      ...(initialPlace ? { placeId: { $ne: String(initialPlace._id) } } : {}),
    }).catch(() => 0);
  }
}
