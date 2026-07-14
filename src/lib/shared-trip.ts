import { AppError } from '@/lib/api-response';
import { getDb, type TripAccommodation, type TripBudget } from '@/lib/db';

export interface PublicSharedTrip {
  _id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  description: string | null;
  coverImage: string | null;
  isPublic: boolean;
}

export interface PublicSharedItineraryItem {
  _id: string;
  day: number;
  orderIndex: number;
  note: string;
  placeId: string;
  place: { name: string; address: string | null } | null;
  startTime: string | null;
  endTime: string | null;
  cost: number | null;
  currency: string | null;
}

export interface PublicSharedAccommodation {
  _id: string;
  hotelId: string | null;
  name: string;
  address: string | null;
  checkIn: string;
  checkOut: string;
}

export interface PublicSharedBudgetItem {
  _id: string;
  category: string;
  amount: number;
  currency: string;
  note: string | null;
  type: 'planned' | 'actual';
}

export interface SharedTripData {
  trip: PublicSharedTrip;
  items: PublicSharedItineraryItem[];
  accommodations: PublicSharedAccommodation[];
  budget: {
    items: PublicSharedBudgetItem[];
    totalPlanned: number;
    totalActual: number;
  };
  shareCode: string;
}

export async function loadSharedTrip(code: string): Promise<SharedTripData> {
  const db = await getDb();
  const share = await db.tripShares.findOne({ shareCode: code, isActive: true });

  if (!share) {
    throw new AppError('NOT_FOUND', 'Liên kết chia sẻ không tồn tại hoặc đã bị thu hồi', 404);
  }
  if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
    throw new AppError('NOT_FOUND', 'Liên kết chia sẻ đã hết hạn', 404);
  }

  const trip = await db.trips.findById(share.tripId);
  if (!trip || trip.deletedAt) {
    throw new AppError('NOT_FOUND', 'Chuyến đi không tồn tại hoặc đã bị xóa', 404);
  }

  const [items, accommodations, budgets] = await Promise.all([
    db.itineraryItems.find({ tripId: share.tripId }),
    db.tripAccommodations.find({ tripId: share.tripId }) as Promise<TripAccommodation[]>,
    db.tripBudgets.find({ tripId: share.tripId }) as Promise<TripBudget[]>,
  ]);
  const placeIds = [...new Set(items.map((item) => String(item.placeId)).filter(Boolean))];
  const places = placeIds.length > 0
    ? await db.places.find(
        { _id: { $in: placeIds } },
        { projection: { name: 1, address: 1 } },
      )
    : [];
  const placesById = new Map(
    places.map((place) => [
      String(place._id),
      { name: place.name, address: place.address || null },
    ]),
  );

  const publicItems = items.map((item) => ({
    _id: String(item._id),
    day: item.day,
    orderIndex: item.orderIndex ?? 0,
    note: item.note || '',
    placeId: String(item.placeId),
    place: placesById.get(String(item.placeId)) || null,
    startTime: item.startTime ? new Date(item.startTime).toISOString() : null,
    endTime: item.endTime ? new Date(item.endTime).toISOString() : null,
    cost: item.cost ?? null,
    currency: item.currency ?? null,
  }));

  const publicAccommodations = [...accommodations]
    .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())
    .map((item) => ({
      _id: String(item._id),
      hotelId: item.hotelId ? String(item.hotelId) : null,
      name: item.name,
      address: item.address || null,
      checkIn: new Date(item.checkIn).toISOString(),
      checkOut: new Date(item.checkOut).toISOString(),
    }));

  const budgetItems = [...budgets]
    .sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime())
    .map((item) => ({
      _id: String(item._id),
      category: item.category,
      amount: item.amount,
      currency: item.currency,
      note: item.note ?? null,
      type: item.type,
    }));

  return {
    trip: {
      _id: String(trip._id),
      title: trip.title,
      destination: trip.destination,
      startDate: new Date(trip.startDate).toISOString(),
      endDate: new Date(trip.endDate).toISOString(),
      description: trip.description || null,
      coverImage: trip.coverImage || null,
      isPublic: Boolean(trip.isPublic),
    },
    items: publicItems,
    accommodations: publicAccommodations,
    budget: {
      items: budgetItems,
      totalPlanned: budgets.filter((item) => item.type === 'planned').reduce((sum, item) => sum + item.amount, 0),
      totalActual: budgets.filter((item) => item.type === 'actual').reduce((sum, item) => sum + item.amount, 0),
    },
    shareCode: code,
  };
}
