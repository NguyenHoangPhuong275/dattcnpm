'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type Dispatch,
  type SetStateAction,
} from 'react';

import { apiRequest, getApiErrorMessage } from '@/lib/api-client';
import {
  extractTrips,
  extractTripsPagination,
  type TripsListResponse,
  type TripsPagination,
} from '@/lib/trip-formatters';
import { getStoredUser, getStoredUserRevision, subscribeStoredUser } from '@/lib/user';
import type { RequestStatus } from '@/types/common';
import type { TripSummary } from '@/types/profile';

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

type TripListState = TripListData & {
  cacheKey: string | null;
  identityMarker: string;
  status: TripListStatus;
  error: string | null;
};

const TRIP_LIST_CACHE_TTL_MS = 60_000;
const tripListCache = new Map<string, TripListCacheEntry>();
const tripListRequests = new Map<string, Promise<TripListData>>();

function getTripListCacheKey(endpoint: string, userId: string): string {
  return JSON.stringify([endpoint, userId]);
}

function readTripListCache(cacheKey: string | null): TripListCacheEntry | null {
  return cacheKey ? tripListCache.get(cacheKey) ?? null : null;
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

function subscribeStoredUserSnapshot(onStoreChange: () => void): () => void {
  return subscribeStoredUser(onStoreChange);
}

function getStoredUserSnapshot(): string {
  return `${getStoredUserRevision()}\u0000${getStoredUser()?.id ?? ''}`;
}

function getUserIdFromSnapshot(snapshot: string): string | null {
  const userId = snapshot.slice(snapshot.indexOf('\u0000') + 1);
  return userId || null;
}

function createTripListState(
  cacheKey: string | null,
  identityMarker: string,
  data: TripListData | null,
  status: TripListStatus,
  error: string | null = null,
): TripListState {
  return {
    cacheKey,
    identityMarker,
    trips: data?.trips ?? [],
    pagination: data?.pagination ?? null,
    status,
    error,
  };
}

function createInitialTripListState(cacheKey: string | null, identityMarker: string): TripListState {
  const cached = readTripListCache(cacheKey);
  return createTripListState(cacheKey, identityMarker, cached, cached ? 'success' : 'idle');
}

function requestTripList(
  endpoint: string,
  requestUserId: string | null,
  cacheKey: string | null,
): Promise<TripListData> {
  const createRequest = (): Promise<TripListData> => apiRequest<TripsListResponse>(endpoint, { userId: requestUserId })
    .then(({ response, data }) => {
      if (response.ok && data.success && data.data) {
        return {
          trips: extractTrips(data),
          pagination: extractTripsPagination(data),
        };
      }

      throw new Error(getApiErrorMessage(data, 'Không thể tải danh sách chuyến đi'));
    });

  if (!cacheKey) return createRequest();

  const existingRequest = tripListRequests.get(cacheKey);
  if (existingRequest) return existingRequest;

  const request = createRequest().finally(() => {
    tripListRequests.delete(cacheKey);
  });
  tripListRequests.set(cacheKey, request);
  return request;
}

export function useTripList({
  userId,
  endpoint = '/api/trips',
}: UseTripListOptions = {}): UseTripListReturn {
  const storedUserSnapshot = useSyncExternalStore(subscribeStoredUserSnapshot, getStoredUserSnapshot, () => '0\u0000');
  const storedUserId = getUserIdFromSnapshot(storedUserSnapshot);
  const resolvedUserId = userId === null ? null : storedUserId ?? userId ?? null;
  const currentCacheKey = resolvedUserId ? getTripListCacheKey(endpoint, resolvedUserId) : null;
  const identityMarker = JSON.stringify([endpoint, resolvedUserId, resolvedUserId ?? storedUserSnapshot]);
  const currentIdentityMarkerRef = useRef(identityMarker);
  const currentCacheKeyRef = useRef(currentCacheKey);
  const latestLoadRef = useRef(0);

  const [state, setState] = useState<TripListState>(() => createInitialTripListState(
    currentCacheKey,
    identityMarker,
  ));

  const stateMatchesIdentity = state.identityMarker === identityMarker
    && (currentCacheKey === null || state.cacheKey === currentCacheKey);

  useEffect(() => {
    currentIdentityMarkerRef.current = identityMarker;
    currentCacheKeyRef.current = currentCacheKey;
    latestLoadRef.current += 1;
    setState(createInitialTripListState(currentCacheKey, identityMarker));
  }, [currentCacheKey, identityMarker]);

  const loadTrips = useCallback(async (uid?: string): Promise<void> => {
    const requestedUserId = uid === undefined ? resolvedUserId : uid;
    const requestUserId = getStoredUser()?.id ?? requestedUserId;
    const requestCacheKey = requestUserId ? getTripListCacheKey(endpoint, requestUserId) : null;
    const canApplyToCurrentIdentity = currentCacheKey === null || currentCacheKey === requestCacheKey;
    const requestIdentityMarker = identityMarker;
    const loadId = latestLoadRef.current + 1;
    latestLoadRef.current = loadId;
    const cached = readTripListCache(requestCacheKey);

    const canApply = (): boolean => canApplyToCurrentIdentity
      && latestLoadRef.current === loadId
      && currentIdentityMarkerRef.current === requestIdentityMarker
      && (currentCacheKeyRef.current === null || currentCacheKeyRef.current === requestCacheKey);

    const applyState = (
      data: TripListData | null,
      status: TripListStatus,
      error: string | null = null,
    ): boolean => {
      if (!canApply()) return false;
      setState(createTripListState(requestCacheKey, requestIdentityMarker, data, status, error));
      return true;
    };

    if (cached && applyState(cached, 'success')) {
      if (isTripListCacheFresh(cached)) return;
    } else if (!cached) {
      applyState(null, 'loading');
    }

    try {
      const result = await requestTripList(endpoint, requestUserId, requestCacheKey);
      if (requestCacheKey) {
        writeTripListCache(requestCacheKey, result.trips, result.pagination);
      }
      applyState(result, 'success');
    } catch (err) {
      if (!canApply()) return;
      if (cached) {
        applyState(cached, 'success');
        return;
      }

      applyState(null, 'error', getApiErrorMessage(err, 'Không thể tải danh sách chuyến đi'));
    }
  }, [currentCacheKey, endpoint, identityMarker, resolvedUserId]);

  const setTripsAndCache = useCallback<Dispatch<SetStateAction<TripSummary[]>>>((value) => {
    if (currentIdentityMarkerRef.current !== identityMarker) return;

    setState((previousState) => {
      if (currentIdentityMarkerRef.current !== identityMarker) return previousState;

      const previousTrips = previousState.identityMarker === identityMarker
        ? previousState.trips
        : [];
      const nextTrips = typeof value === 'function' ? value(previousTrips) : value;
      const cacheKey = currentCacheKey ?? previousState.cacheKey;
      const pagination = previousState.identityMarker === identityMarker
        ? previousState.pagination
        : null;

      if (cacheKey) {
        writeTripListCache(cacheKey, nextTrips, pagination);
      }

      return {
        cacheKey,
        identityMarker,
        trips: nextTrips,
        pagination,
        status: previousState.status,
        error: previousState.error,
      };
    });
  }, [currentCacheKey, identityMarker]);

  return {
    trips: stateMatchesIdentity ? state.trips : [],
    status: stateMatchesIdentity ? state.status : 'idle',
    error: stateMatchesIdentity ? state.error : null,
    pagination: stateMatchesIdentity ? state.pagination : null,
    setTrips: setTripsAndCache,
    loadTrips,
  };
}
