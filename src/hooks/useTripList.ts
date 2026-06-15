'use client';

import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import { apiRequest, getApiErrorMessage } from '@/lib/api-client';
import { extractTrips, extractTripsPagination, type TripsListResponse, type TripsPagination } from '@/lib/trip-formatters';
import type { TripSummary } from '@/types/profile';
import { RequestStatus } from '@/types/common';

export type TripListStatus = RequestStatus;

interface UseTripListOptions {
  userId?: string | null;
  endpoint?: string;
}

interface UseTripListReturn {
  trips: TripSummary[];
  status: TripListStatus;
  error: string | null;
  pagination: TripsPagination | null;
  setTrips: Dispatch<SetStateAction<TripSummary[]>>;
  loadTrips: (uid?: string) => Promise<void>;
}

type TripListData = {
  trips: TripSummary[];
  pagination: TripsPagination | null;
};

type TripListCacheEntry = TripListData & {
  fetchedAt: number;
};

const TRIP_LIST_CACHE_TTL_MS = 60_000;
const tripListCache = new Map<string, TripListCacheEntry>();
const tripListRequests = new Map<string, Promise<TripListData>>();

function getTripListCacheKey(endpoint: string, userId?: string | null): string {
  return `${endpoint}:${userId ?? 'session'}`;
}

function readTripListCache(cacheKey: string): TripListCacheEntry | null {
  return tripListCache.get(cacheKey) ?? null;
}

function writeTripListCache(cacheKey: string, trips: TripSummary[], pagination: TripsPagination | null): void {
  tripListCache.set(cacheKey, {
    trips,
    pagination,
    fetchedAt: Date.now(),
  });
}

function isTripListCacheFresh(entry: TripListCacheEntry): boolean {
  return Date.now() - entry.fetchedAt < TRIP_LIST_CACHE_TTL_MS;
}

export function useTripList({
  userId,
  endpoint = '/api/trips',
}: UseTripListOptions = {}): UseTripListReturn {
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [status, setStatus] = useState<TripListStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<TripsPagination | null>(null);

  const loadTrips = useCallback(async (uid?: string): Promise<void> => {
    const requestUserId = uid ?? userId;
    const cacheKey = getTripListCacheKey(endpoint, requestUserId);
    const cached = readTripListCache(cacheKey);

    if (cached) {
      setTrips(cached.trips);
      setPagination(cached.pagination);
      setStatus('success');
      setError(null);

      if (isTripListCacheFresh(cached)) return;
    } else {
      setStatus('loading');
      setError(null);
    }

    let request = tripListRequests.get(cacheKey);
    if (!request) {
      request = apiRequest<TripsListResponse>(endpoint, { userId: requestUserId })
        .then(({ response, data }) => {
          if (response.ok && data.success && data.data) {
            return {
              trips: extractTrips(data),
              pagination: extractTripsPagination(data),
            };
          }

          throw new Error(getApiErrorMessage(data, 'Không thể tải danh sách chuyến đi'));
        })
        .finally(() => {
          tripListRequests.delete(cacheKey);
        });
      tripListRequests.set(cacheKey, request);
    }

    try {
      const result = await request;
      writeTripListCache(cacheKey, result.trips, result.pagination);
      setTrips(result.trips);
      setPagination(result.pagination);
      setStatus('success');
    } catch (err) {
      if (cached) {
        setStatus('success');
        setError(null);
        return;
      }

      setTrips([]);
      setPagination(null);
      setError(getApiErrorMessage(err, 'Không thể tải danh sách chuyến đi'));
      setStatus('error');
    }
  }, [endpoint, userId]);

  const setTripsAndCache = useCallback<Dispatch<SetStateAction<TripSummary[]>>>((value) => {
    setTrips((previousTrips) => {
      const nextTrips = typeof value === 'function' ? value(previousTrips) : value;
      writeTripListCache(getTripListCacheKey(endpoint, userId), nextTrips, pagination);
      return nextTrips;
    });
  }, [endpoint, pagination, userId]);

  return { trips, status, error, pagination, setTrips: setTripsAndCache, loadTrips };
}
