import type { TripSummary } from '@/types/profile';
import type { ItineraryItem, TripBudget, TripAccommodation } from '@/types/trip';

export function toBudgetResponse(item: TripBudget) {
  return {
    id: String(item._id),
    tripId: String(item.tripId),
    category: item.category,
    amount: item.amount,
    currency: item.currency,
    note: item.note ?? null,
    date: item.date ? new Date(item.date).toISOString() : null,
    type: item.type,
    createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : null,
  };
}

export function toAccommodationResponse(item: TripAccommodation) {
  return {
    id: String(item._id),
    tripId: String(item.tripId),
    name: item.name,
    address: item.address ?? null,
    checkIn: new Date(item.checkIn).toISOString(),
    checkOut: new Date(item.checkOut).toISOString(),
    bookingCode: item.bookingRef ?? null,
    note: item.note ?? null,
    currency: item.currency ?? 'VND',
    createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : null,
  };
}

export interface TripsPagination {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface TripsPage {
  data?: TripSummary[];
  pagination?: TripsPagination;
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface TripsListResponse {
  success?: boolean;
  data?: TripSummary[] | TripsPage;
  message?: string;
  error?: string | { message?: string } | null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isTripSummary(value: unknown): value is TripSummary {
  return isObject(value)
    && typeof value._id === 'string'
    && typeof value.title === 'string'
    && typeof value.destination === 'string';
}

export function extractTrips(payload: TripsListResponse | unknown): TripSummary[] {
  if (!isObject(payload)) return [];

  const data = payload.data;
  if (Array.isArray(data)) return data.filter(isTripSummary);

  if (isObject(data) && Array.isArray(data.data)) {
    return data.data.filter(isTripSummary);
  }

  return [];
}

export function extractTripsPagination(payload: TripsListResponse | unknown): TripsPagination | null {
  if (!isObject(payload) || !isObject(payload.data)) return null;

  if (isObject(payload.data.pagination)) {
    const { page, limit, total, totalPages } = payload.data.pagination;
    return {
      page: typeof page === 'number' ? page : undefined,
      limit: typeof limit === 'number' ? limit : undefined,
      total: typeof total === 'number' ? total : undefined,
      totalPages: typeof totalPages === 'number' ? totalPages : undefined,
    };
  }

  const { page, limit, total, totalPages } = payload.data;
  if ([page, limit, total, totalPages].some((value) => typeof value === 'number')) {
    return {
      page: typeof page === 'number' ? page : undefined,
      limit: typeof limit === 'number' ? limit : undefined,
      total: typeof total === 'number' ? total : undefined,
      totalPages: typeof totalPages === 'number' ? totalPages : undefined,
    };
  }

  return null;
}

type ResolvedItineraryPlace = {
  _id: unknown;
  name: string;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export function toItineraryItemResponse(
  item: ItineraryItem,
  options: { includeUpdatedAt?: boolean; place?: ResolvedItineraryPlace | null } = {}
): Record<string, unknown> {
  const response: Record<string, unknown> = {
    _id: item._id,
    tripId: item.tripId,
    placeId: item.placeId,
    day: item.day,
    orderIndex: item.orderIndex,
    note: item.note ?? '',
    startTime: item.startTime ? item.startTime.toISOString() : null,
    endTime: item.endTime ? item.endTime.toISOString() : null,
    cost: item.cost ?? null,
    currency: item.currency ?? null,
    createdAt: item.createdAt ? item.createdAt.toISOString() : '',
  };


  if ('place' in options) {
    response.place = options.place
      ? {
          _id: String(options.place._id),
          name: options.place.name,
          address: options.place.address ?? null,
          lat: options.place.lat ?? null,
          lng: options.place.lng ?? null,
        }
      : null;
  }

  if (options.includeUpdatedAt) {
    response.updatedAt = item.updatedAt ? item.updatedAt.toISOString() : '';
  }

  return response;
}
