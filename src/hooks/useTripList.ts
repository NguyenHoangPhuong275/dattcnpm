'use client';

import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import { apiRequest, getApiErrorMessage } from '@/lib/api-client';
import { extractTrips, extractTripsPagination, type TripsListResponse, type TripsPagination } from '@/lib/trip-formatters';
import type { TripSummary } from '@/types/profile';

export type TripListStatus = 'idle' | 'loading' | 'success' | 'error';

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

    setStatus('loading');
    setError(null);

    try {
      const { response, data } = await apiRequest<TripsListResponse>(endpoint, { userId: requestUserId });
      if (response.ok && data.success && data.data) {
        setTrips(extractTrips(data));
        setPagination(extractTripsPagination(data));
        setStatus('success');
        return;
      }

      setTrips([]);
      setPagination(null);
      setError(getApiErrorMessage(data, 'Không thể tải danh sách chuyến đi'));
      setStatus('error');
    } catch (err) {
      setTrips([]);
      setPagination(null);
      setError(getApiErrorMessage(err, 'Không thể tải danh sách chuyến đi'));
      setStatus('error');
    }
  }, [endpoint, userId]);

  return { trips, status, error, pagination, setTrips, loadTrips };
}
