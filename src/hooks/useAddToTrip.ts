'use client';

import { useState, useCallback } from 'react';
import { apiRequest, ensureApiSuccess, getApiErrorMessage } from '@/lib/api-client';
import { useTripList } from '@/hooks/useTripList';
import type { TripSummary } from '@/types/profile';

type AddToTripStatus = 'idle' | 'loading-trips' | 'ready' | 'submitting' | 'success' | 'error';

type AddToTripEnvelope = {
  success?: boolean;
  message?: string;
  error?: { message?: string } | null;
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
  const [modalStatus, setModalStatus] = useState<AddToTripStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { trips, status: tripListStatus, error: tripListError, loadTrips } = useTripList();

  const openModal = useCallback(async (): Promise<void> => {
    setModalStatus('loading-trips');
    setErrorMessage(null);
    await loadTrips();
  }, [loadTrips]);

  const closeModal = useCallback((): void => {
    setModalStatus('idle');
    setErrorMessage(null);
  }, []);

  const addToTrip = useCallback(async (
    tripId: string,
    day: number,
    placeId: string,
  ): Promise<void> => {
    setModalStatus('submitting');
    setErrorMessage(null);
    try {
      const { response, data } = await apiRequest<AddToTripEnvelope>(
        `/api/trips/${tripId}/itinerary`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ placeId, day }),
        },
      );
      ensureApiSuccess(response, data, 'Thêm địa điểm thất bại');
      setModalStatus('success');
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err, 'Thêm địa điểm thất bại'));
      setModalStatus('error');
    }
  }, []);

  const effectiveStatus: AddToTripStatus =
    modalStatus === 'submitting' || modalStatus === 'success' ? modalStatus
    : tripListStatus === 'loading' ? 'loading-trips'
    : tripListStatus === 'error' ? 'error'
    : tripListStatus === 'success' ? 'ready'
    : modalStatus;

  return {
    status: effectiveStatus,
    trips,
    errorMessage: errorMessage ?? tripListError,
    openModal,
    closeModal,
    addToTrip,
  };
}
