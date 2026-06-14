import type { TripSummary } from '@/types/profile';

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
