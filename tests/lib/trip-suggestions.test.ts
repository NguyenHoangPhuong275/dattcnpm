import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AppDatabase, Place } from '@/lib/db';

const tourismMocks = vi.hoisted(() => ({
  suggestions: [] as Array<{
    id: string;
    name: string;
    province: string;
    description: string;
    rating: string;
    image: string;
    keywords: string[];
  }>,
}));

vi.mock('@/lib/vietnam-tourism', () => ({
  getTourismDestinationsByRegion: () => tourismMocks.suggestions,
  tourismDestinationToSearchPlace: (suggestion: { id: string; name: string; province: string; keywords: string[] }) => ({
    osmId: `curated:${suggestion.id}`,
    name: suggestion.name,
    type: suggestion.keywords[0] || 'du lịch',
    lat: 21,
    lng: 107,
    address: suggestion.province,
    tags: suggestion.keywords,
  }),
}));

import { seedTripItinerary } from '@/lib/trip-suggestions';

type StoredItineraryItem = {
  tripId: string;
  placeId: string;
  day: number;
  orderIndex: number;
  note: string;
};

function createSuggestion(index: number) {
  return {
    id: `place-${index}`,
    name: `Địa điểm ${index}`,
    province: 'Quảng Ninh',
    description: `Mô tả ${index}`,
    rating: '4.8/5',
    image: '',
    keywords: ['tham quan'],
  };
}

function createPlace(id: string, osmId: string, name: string): Place {
  return {
    _id: id,
    osmId,
    name,
    type: 'tham quan',
    lat: 21,
    lng: 107,
    address: 'Quảng Ninh',
    ratingAvg: 4.8,
    ratingCount: 1,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };
}

function createDb(initialPlaces: Place[] = [], partialInsertCount = 0) {
  const placesByOsmId = new Map(
    initialPlaces
      .filter((place) => place.osmId)
      .map((place) => [String(place.osmId), place]),
  );
  const items: StoredItineraryItem[] = [];
  let placeSequence = initialPlaces.length;

  const placeFindOne = vi.fn(async (filter: Record<string, unknown>) => (
    placesByOsmId.get(String(filter.osmId))
  ));
  const placeInsertOne = vi.fn(async (input: Record<string, unknown>) => {
    placeSequence += 1;
    const place = createPlace(
      `generated-place-${placeSequence}`,
      String(input.osmId),
      String(input.name),
    );
    placesByOsmId.set(String(place.osmId), place);
    return place;
  });
  const itineraryInsertOne = vi.fn(async (input: Record<string, unknown>) => {
    const item = input as StoredItineraryItem;
    items.push(item);
    return { ...item, _id: `item-${items.length}` };
  });
  const itineraryInsertMany = vi.fn(async (inputs: Record<string, unknown>[]) => {
    const batch = inputs as StoredItineraryItem[];
    if (partialInsertCount > 0) {
      items.push(...batch.slice(0, partialInsertCount));
      throw new Error('Không thể ghi danh sách gợi ý');
    }
    items.push(...batch);
    return batch.map((item, index) => ({ ...item, _id: `batch-item-${index}` }));
  });
  const itineraryDeleteMany = vi.fn(async (filter: Record<string, unknown>) => {
    const initialLength = items.length;
    const placeFilter = filter.placeId as { $ne?: string } | undefined;
    const retained = items.filter((item) => (
      item.tripId !== filter.tripId
      || (placeFilter?.$ne !== undefined && item.placeId === placeFilter.$ne)
    ));
    items.splice(0, items.length, ...retained);
    return initialLength - items.length;
  });

  const db = {
    places: {
      findOne: placeFindOne,
      insertOne: placeInsertOne,
    },
    itineraryItems: {
      insertOne: itineraryInsertOne,
      insertMany: itineraryInsertMany,
      deleteMany: itineraryDeleteMany,
    },
  } as unknown as AppDatabase;

  return {
    db,
    items,
    placeFindOne,
    placeInsertOne,
    itineraryInsertOne,
    itineraryInsertMany,
    itineraryDeleteMany,
  };
}

const tripDates = {
  startDate: new Date('2026-07-14T00:00:00.000Z'),
  endDate: new Date('2026-07-19T00:00:00.000Z'),
};

beforeEach(() => {
  tourismMocks.suggestions = [];
});

describe('seedTripItinerary', () => {
  it('ghi địa điểm đã chọn trước các gợi ý', async () => {
    tourismMocks.suggestions = [createSuggestion(1), createSuggestion(2)];
    const initialPlace = createPlace('selected-place', 'osm:selected', 'Vịnh Hạ Long');
    const state = createDb([initialPlace]);

    await seedTripItinerary({
      db: state.db,
      tripId: 'trip-1',
      destination: 'Quảng Ninh',
      initialPlace,
      ...tripDates,
    });

    expect(state.items[0]).toMatchObject({
      placeId: initialPlace._id,
      day: 1,
      orderIndex: 0,
      note: initialPlace.name,
    });
    expect(state.itineraryInsertOne.mock.invocationCallOrder[0]).toBeLessThan(
      state.itineraryInsertMany.mock.invocationCallOrder[0],
    );
  });

  it('không thêm lại địa điểm curated đã được chọn', async () => {
    tourismMocks.suggestions = [createSuggestion(1), createSuggestion(2)];
    const initialPlace = createPlace('selected-place', 'curated:place-1', 'Địa điểm 1');
    const state = createDb([initialPlace]);

    await seedTripItinerary({
      db: state.db,
      tripId: 'trip-2',
      destination: 'Quảng Ninh',
      initialPlace,
      ...tripDates,
    });

    expect(state.items.filter((item) => item.placeId === initialPlace._id)).toHaveLength(1);
    expect(state.placeInsertOne).toHaveBeenCalledTimes(1);
    expect(state.items).toHaveLength(2);
  });

  it('tính ngày 14 đến 19 là sáu ngày và dùng đủ sức chứa ngày cuối', async () => {
    tourismMocks.suggestions = Array.from({ length: 12 }, (_, index) => createSuggestion(index + 1));
    const state = createDb();

    await seedTripItinerary({
      db: state.db,
      tripId: 'trip-3',
      destination: 'Quảng Ninh',
      ...tripDates,
    });

    expect(state.items).toHaveLength(12);
    expect(state.items.at(-1)).toMatchObject({ day: 6, orderIndex: 1 });
  });

  it('xóa mọi gợi ý ghi dở khi insertMany lỗi và giữ địa điểm đầu tiên', async () => {
    tourismMocks.suggestions = [createSuggestion(1), createSuggestion(2), createSuggestion(3)];
    const initialPlace = createPlace('selected-place', 'osm:selected', 'Vịnh Hạ Long');
    const state = createDb([initialPlace], 1);

    await seedTripItinerary({
      db: state.db,
      tripId: 'trip-4',
      destination: 'Quảng Ninh',
      initialPlace,
      ...tripDates,
    });

    expect(state.items).toEqual([
      expect.objectContaining({ placeId: initialPlace._id, day: 1, orderIndex: 0 }),
    ]);
    expect(state.itineraryDeleteMany).toHaveBeenCalledWith({
      tripId: 'trip-4',
      placeId: { $ne: initialPlace._id },
    });
  });
});
