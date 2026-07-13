'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, ensureApiSuccess, getApiErrorMessage } from '@/lib/api-client';
import { getDefaultTripDates } from '@/lib/date';
import type { TripSummary } from '@/types/profile';
import { ROUTES } from '@/lib/constants';
import { RequestStatus } from '@/types/common';
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

interface TripActionResponse {
  success?: boolean;
  message?: string;
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
  addSelectedPlaceToTrip: (tripId: string, focusHotel?: boolean, place?: SelectedTripPlace) => Promise<boolean>;
  createTripFromSelectedPlace: (place?: SelectedTripPlace) => Promise<void>;
  resetTripActionMessage: () => void;
  loadMyTrips: () => Promise<void>;
}

const DEFAULT_TRAVELER_COUNT = 2;
const FIRST_DAY = 1;
const CURRENCY_CODE = 'VND';

function getSelectedPlaceDestination(place: SelectedTripPlace): string {
  return place.address || place.name;
}

export function useHomepageTripActions({
  userId,
  selectedPlace,
  onMissingPlace,
}: UseHomepageTripActionsProps): UseHomepageTripActionsReturn {
  const router = useRouter();
  const { trips: myTrips, status: tripsStatus, loadTrips } = useTripList({ userId });

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

  const addSelectedPlaceToTrip = useCallback(async (tripId: string, focusHotel = false, place?: SelectedTripPlace): Promise<boolean> => {
    const targetPlace = place || selectedPlace;
    if (!userId || !targetPlace) return false;
    if (tripActionStatus === 'loading') return false;

    setTripActionStatus('loading');
    resetTripActionMessage();

    try {
      const { response, data } = await apiRequest<TripActionResponse>(
        `/api/trips/${tripId}/itinerary`,
        {
          method: 'POST',
          userId,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            placeId: targetPlace._id,
            day: FIRST_DAY,
            note: targetPlace.name,
            currency: CURRENCY_CODE,
          }),
        }
      );

      try {
        ensureApiSuccess(response, data, 'Không thể thêm địa điểm vào chuyến đi');
      } catch {
        setTripActionMessage(getApiErrorMessage(data, 'Không thể thêm địa điểm vào chuyến đi'));
        setTripActionStatus('error');
        return false;
      }

      setTripActionStatus('success');
      router.push(`${ROUTES.scheduleReference}/${tripId}${focusHotel ? '?focus=hotel' : ''}`);
      return true;
    } catch {
      setTripActionMessage('Không thể thêm địa điểm vào chuyến đi lúc này');
      setTripActionStatus('error');
      return false;
    }
  }, [resetTripActionMessage, router, selectedPlace, tripActionStatus, userId]);

  const createTripFromSelectedPlace = useCallback(async (place?: SelectedTripPlace): Promise<void> => {
    if (tripActionStatus === 'loading') return;
    const targetPlace = place || selectedPlace;
    if (!targetPlace || !userId) {
      onMissingPlace?.();
      return;
    }

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
          }),
        }
      );

      try {
        ensureApiSuccess(response, data, 'Không thể tạo lịch trình');
      } catch {
        setTripActionMessage(getApiErrorMessage(data, 'Không thể tạo lịch trình'));
        setTripActionStatus('error');
        return;
      }
      if (!data.data) {
        setTripActionMessage('Không thể tạo lịch trình');
        setTripActionStatus('error');
        return;
      }

      await addSelectedPlaceToTrip(data.data._id, true, targetPlace);
    } catch {
      setTripActionMessage('Không thể tạo lịch trình lúc này');
      setTripActionStatus('error');
    }
  }, [
    addSelectedPlaceToTrip,
    endDate,
    resetTripActionMessage,
    onMissingPlace,
    selectedPlace,
    startDate,
    travelerCount,
    tripActionStatus,
    userId,
  ]);

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
    addSelectedPlaceToTrip,
    createTripFromSelectedPlace,
    resetTripActionMessage,
    loadMyTrips,
  };
}
