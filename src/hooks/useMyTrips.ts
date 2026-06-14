'use client';

import { useState, useCallback, type Dispatch, type SetStateAction } from 'react';
import { apiRequest, getApiErrorMessage } from '@/lib/api-client';
import { getDefaultStartDate, getDefaultEndDate } from '@/lib/date';
import type { TripSummary } from '@/types/profile';
import { useTripList, type TripListStatus } from './useTripList';

export type MyTripsStatus = TripListStatus;

interface UseMyTripsOptions {
  userId: string | null;
}

export interface CreateTripPayload {
  title: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  isPublic?: boolean;
}

export interface UseMyTripsReturn {
  data: TripSummary[];
  status: MyTripsStatus;
  error: string | null;
  creating: boolean;
  actions: {
    loadTrips: (uid?: string) => Promise<void>;
    createTrip: (payload: CreateTripPayload) => Promise<{ success: boolean; message?: string }>;
    deleteTrip: (id: string) => Promise<void>;
    setTrips: Dispatch<SetStateAction<TripSummary[]>>;
  };
}

export function useMyTrips({ userId }: UseMyTripsOptions): UseMyTripsReturn {
  const { trips, status, error, setTrips, loadTrips } = useTripList({ userId });
  const [createStatus, setCreateStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const creating = createStatus === 'loading';

  const createTrip = useCallback(async (payload: CreateTripPayload): Promise<{ success: boolean; message?: string }> => {
    if (!userId) return { success: false, message: 'No user' };

    const trimmedTitle = payload.title.trim();
    const trimmedDest = payload.destination.trim();

    if (!trimmedTitle || !trimmedDest) {
      return { success: false, message: 'Vui long nhap tieu de va diem den' };
    }

    setCreateStatus('loading');

    try {
      const start = payload.startDate || getDefaultStartDate();
      const end = payload.endDate || getDefaultEndDate(3);

      if (end < start) {
        setCreateStatus('error');
        return { success: false, message: 'Ngay ket thuc phai sau ngay bat dau' };
      }

      const { response, data } = await apiRequest<{ success?: boolean; data?: TripSummary; message?: string }>('/api/trips', {
        method: 'POST',
        userId,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trimmedTitle,
          destination: trimmedDest,
          startDate: start,
          endDate: end,
          description: payload.description?.trim() || undefined,
          isPublic: payload.isPublic ?? false,
        }),
      });

      if (response.ok && data.success && data.data) {
        const createdTrip = data.data;
        setTrips((prev) => {
          if (prev.some((trip) => trip._id === createdTrip._id)) {
            return prev;
          }
          return [createdTrip, ...prev];
        });
        setCreateStatus('success');
        return { success: true };
      }

      setCreateStatus('error');
      return { success: false, message: getApiErrorMessage(data, 'Tao chuyen di that bai') };
    } catch (err) {
      console.error('Create trip failed:', err);
      setCreateStatus('error');
      return { success: false, message: 'Khong the tao chuyen di luc nay' };
    }
  }, [setTrips, userId]);

  const deleteTrip = useCallback(async (id: string): Promise<void> => {
    if (!userId) return;

    let snapshot: TripSummary[] = [];
    setTrips((prev) => {
      snapshot = prev;
      return prev.filter((trip) => trip._id !== id);
    });

    try {
      const { response } = await apiRequest(`/api/trips/${id}`, { method: 'DELETE', userId });

      if (!response.ok) throw new Error('Delete trip failed');
    } catch (err) {
      console.error('Delete trip failed:', err);
      setTrips(snapshot);
      throw new Error('Delete trip failed');
    }
  }, [setTrips, userId]);

  return {
    data: trips,
    status,
    error,
    creating,
    actions: {
      loadTrips,
      createTrip,
      deleteTrip,
      setTrips,
    },
  };
}
