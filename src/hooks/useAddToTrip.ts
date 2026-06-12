'use client';

import { useState, useCallback } from 'react';
import { apiRequest, getApiErrorMessage } from '@/lib/api-client';
import { TripSummary } from '@/types/profile';

type AddToTripStatus = 'idle' | 'loading-trips' | 'ready' | 'submitting' | 'success' | 'error';

type TripsEnvelope = {
  success?: boolean;
  data?: TripSummary[];
  message?: string;
  error?: {
    message?: string;
  } | null;
};

type AddToTripEnvelope = {
  success?: boolean;
  message?: string;
  error?: {
    message?: string;
  } | null;
};

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
      const { response, data } = await apiRequest<TripsEnvelope>('/api/trips');

      if (response.ok && data.success && Array.isArray(data.data)) {
        setTrips(data.data);
        setStatus('ready');
        return;
      }

      setTrips([]);
      setErrorMessage(getApiErrorMessage(data, 'Không thể tải danh sách chuyến đi. Vui lòng thử lại.'));
      setStatus('error');
    } catch (err) {
      setTrips([]);
      setErrorMessage(getApiErrorMessage(err, 'Không thể tải danh sách chuyến đi. Vui lòng thử lại.'));
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
      const { response, data } = await apiRequest<AddToTripEnvelope>(
        `/api/trips/${tripId}/itinerary`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ placeId, day }),
        }
      );

      if (!response.ok || !data.success) {
        setErrorMessage(getApiErrorMessage(data, 'Thêm địa điểm thất bại'));
        setStatus('error');
        return;
      }

      setStatus('success');
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err, 'Thêm địa điểm thất bại'));
      setStatus('error');
    }
  }, []);

  return { status, trips, errorMessage, openModal, closeModal, addToTrip };
}
