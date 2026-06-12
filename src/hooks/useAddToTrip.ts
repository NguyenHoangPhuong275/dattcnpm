'use client';

import { useState, useCallback } from 'react';
import { apiRequest } from '@/lib/api-client';
import { TripSummary } from '@/types/profile';

type AddToTripStatus = 'idle' | 'loading-trips' | 'ready' | 'submitting' | 'success' | 'error';

export interface UseAddToTripReturn {
  status: AddToTripStatus;
  trips: TripSummary[];
  errorMessage: string | null;
  openModal: () => Promise<void>;
  closeModal: () => void;
  addToTrip: (tripId: string, day: number, placeId: string) => Promise<void>;
}

export function useAddToTrip(): UseAddToTripReturn {
  const [status, setStatus] = useState<AddToTripStatus>('idle');
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const openModal = useCallback(async (): Promise<void> => {
    setStatus('loading-trips');
    setErrorMessage(null);
    try {
      const res = await apiRequest<TripSummary[]>('/api/trips');
      setTrips(res.data);
      setStatus('ready');
    } catch {
      setErrorMessage('Không thể tải danh sách chuyến đi. Vui lòng thử lại.');
      setStatus('error');
    }
  }, []);

  const closeModal = useCallback((): void => {
    setStatus('idle');
    setTrips([]);
    setErrorMessage(null);
  }, []);

  const addToTrip = useCallback(async (
    tripId: string,
    day: number,
    placeId: string
  ): Promise<void> => {
    setStatus('submitting');
    setErrorMessage(null);
    try {
      await apiRequest(`/api/trips/${tripId}/itinerary`, {
        method: 'POST',
        body: JSON.stringify({ placeId, day }),
      });
      setStatus('success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Thêm địa điểm thất bại';
      setErrorMessage(msg);
      setStatus('error');
    }
  }, []);

  return { status, trips, errorMessage, openModal, closeModal, addToTrip };
}
