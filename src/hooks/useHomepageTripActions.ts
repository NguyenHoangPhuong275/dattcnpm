'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, ensureApiSuccess, getApiErrorMessage } from '@/lib/api-client';
import { getDefaultTripDates, isValidDateOnly } from '@/lib/date';
import type { TripSummary } from '@/types/profile';
import type { RequestStatus } from '@/types/common';
import { useTripList } from './useTripList';

interface SelectedTripPlace {
  _id: string;
  name: string;
  address?: string | null;
}

interface UseHomepageTripActionsProps {
  userId: string | null | undefined;
  selectedPlace: SelectedTripPlace | null;
  onMissingPlace?: () => void;
}

interface TripCreateResponse {
  success?: boolean;
  data?: TripSummary;
}

interface UseHomepageTripActionsReturn {
  myTrips: TripSummary[];
  tripsStatus: RequestStatus;
  tripActionStatus: RequestStatus;
  isLoadingTrips: boolean;
  isTripActionLoading: boolean;
  tripActionMessage: string;
  startDate: string;
  endDate: string;
  travelerCount: number;
  setStartDate: (value: string) => void;
  setEndDate: (value: string) => void;
  setTravelerCount: (value: number) => void;
  createTripFromSelectedPlace: () => Promise<void>;
  createTripFromPlace: (place: SelectedTripPlace) => Promise<void>;
}

const DEFAULT_TRAVELER_COUNT = 2;

function getSelectedPlaceDestination(place: SelectedTripPlace): string {
  return place.address || place.name;
}

function getTripValidationMessage(startDate: string, endDate: string, travelerCount: number): string | null {
  if (!isValidDateOnly(startDate) || !isValidDateOnly(endDate)) {
    return 'Vui lòng chọn ngày đi và ngày về hợp lệ';
  }
  if (endDate < startDate) {
    return 'Ngày kết thúc phải sau ngày bắt đầu';
  }
  if (!Number.isInteger(travelerCount) || travelerCount < 1 || travelerCount > 100) {
    return 'Số người phải từ 1 đến 100';
  }
  return null;
}

export function useHomepageTripActions({
  userId,
  selectedPlace,
  onMissingPlace,
}: UseHomepageTripActionsProps): UseHomepageTripActionsReturn {
  const router = useRouter();
  const { trips: myTrips, status: tripsStatus, loadTrips, setTrips } = useTripList({ userId });
  const createInFlightRef = useRef(false);

  const [tripActionStatus, setTripActionStatus] = useState<RequestStatus>('idle');
  const [tripActionMessage, setTripActionMessage] = useState('');

  const [initialDates] = useState(() => getDefaultTripDates());
  const [startDate, setStartDate] = useState(initialDates.startDate);
  const [endDate, setEndDate] = useState(initialDates.endDate);
  const [travelerCount, setTravelerCount] = useState(DEFAULT_TRAVELER_COUNT);

  const resetTripActionMessage = useCallback((): void => {
    setTripActionMessage('');
  }, []);

  const loadMyTrips = useCallback(async (): Promise<void> => {
    if (!userId) return;
    await loadTrips(userId);
  }, [loadTrips, userId]);

  useEffect(() => {
    if (selectedPlace && userId) {
      loadMyTrips();
    }
  }, [loadMyTrips, selectedPlace, userId]);

  const createTrip = useCallback(async (targetPlace: SelectedTripPlace | null): Promise<void> => {
    if (createInFlightRef.current) return;
    if (!targetPlace) {
      onMissingPlace?.();
      return;
    }
    if (!userId) return;

    const validationMessage = getTripValidationMessage(startDate, endDate, travelerCount);
    if (validationMessage) {
      setTripActionMessage(validationMessage);
      setTripActionStatus('error');
      return;
    }

    createInFlightRef.current = true;
    setTripActionStatus('loading');
    resetTripActionMessage();

    try {
      const { response, data } = await apiRequest<TripCreateResponse>(
        '/api/trips',
        {
          method: 'POST',
          userId,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `Chuyến đi ${targetPlace.name}`,
            destination: getSelectedPlaceDestination(targetPlace),
            startDate,
            endDate,
            description: `${travelerCount} người`,
            initialPlaceId: targetPlace._id,
          }),
        }
      );

      ensureApiSuccess(response, data, 'Không thể tạo lịch trình');
      if (!data.data) {
        throw new Error('Không thể tạo lịch trình');
      }

      const createdTrip = data.data;
      setTrips((current) => [createdTrip, ...current.filter((trip) => trip._id !== createdTrip._id)]);
      setTripActionStatus('success');
      router.push(`/trips/${createdTrip._id}/book-wizard`);
    } catch (error: unknown) {
      setTripActionMessage(getApiErrorMessage(error, 'Không thể tạo lịch trình lúc này'));
      setTripActionStatus('error');
    } finally {
      createInFlightRef.current = false;
    }
  }, [
    endDate,
    resetTripActionMessage,
    onMissingPlace,
    router,
    setTrips,
    startDate,
    travelerCount,
    userId,
  ]);

  const createTripFromSelectedPlace = useCallback(async (): Promise<void> => {
    await createTrip(selectedPlace);
  }, [createTrip, selectedPlace]);

  const createTripFromPlace = useCallback(async (place: SelectedTripPlace): Promise<void> => {
    await createTrip(place);
  }, [createTrip]);

  return {
    myTrips,
    tripsStatus,
    tripActionStatus,
    isLoadingTrips: !!selectedPlace && !!userId && (tripsStatus === 'idle' || tripsStatus === 'loading'),
    isTripActionLoading: tripActionStatus === 'loading',
    tripActionMessage,
    startDate,
    endDate,
    travelerCount,
    setStartDate,
    setEndDate,
    setTravelerCount,
    createTripFromSelectedPlace,
    createTripFromPlace,
  };
}
