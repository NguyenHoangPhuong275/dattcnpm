import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, getApiErrorMessage } from '@/lib/api-client';
import { getDefaultTripDates } from '@/lib/date';
import type { TripSummary } from '@/types/profile';
import { ROUTES } from '@/lib/constants';

type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

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

interface TripsResponse {
  success?: boolean;
  data?: TripSummary[];
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
  addSelectedPlaceToTrip: (tripId: string) => Promise<void>;
  createTripFromSelectedPlace: () => Promise<void>;
  resetTripActionMessage: () => void;
  loadMyTrips: () => Promise<void>;
}

const DEFAULT_TRAVELER_COUNT = 2;
const FIRST_DAY = 1;
const FIRST_ITEM_ORDER = 0;
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

  const [myTrips, setMyTrips] = useState<TripSummary[]>([]);
  const [tripsStatus, setTripsStatus] = useState<RequestStatus>('idle');
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
    if (!userId) {
      setMyTrips([]);
      setTripsStatus('idle');
      return;
    }

    setTripsStatus('loading');

    try {
      const { response, data } = await apiRequest<TripsResponse>('/api/trips', { userId });
      if (response.ok && data.success && Array.isArray(data.data)) {
        setMyTrips(data.data);
        setTripsStatus('success');
        return;
      }

      setMyTrips([]);
      setTripsStatus('error');
    } catch {
      setMyTrips([]);
      setTripsStatus('error');
    }
  }, [userId]);

  useEffect(() => {
    loadMyTrips();
  }, [loadMyTrips]);

  const addSelectedPlaceToTrip = useCallback(async (tripId: string): Promise<void> => {
    if (!userId || !selectedPlace) return;

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
            placeId: selectedPlace._id,
            day: FIRST_DAY,
            orderIndex: FIRST_ITEM_ORDER,
            note: selectedPlace.name,
            currency: CURRENCY_CODE,
          }),
        }
      );

      if (!response.ok || !data.success) {
        setTripActionMessage(getApiErrorMessage(data, 'Không thể thêm địa điểm vào chuyến đi'));
        setTripActionStatus('error');
        return;
      }

      setTripActionStatus('success');
      router.push(`${ROUTES.scheduleReference}/${tripId}`);
    } catch {
      setTripActionMessage('Không thể thêm địa điểm vào chuyến đi lúc này');
      setTripActionStatus('error');
    }
  }, [resetTripActionMessage, router, selectedPlace, userId]);

  const createTripFromSelectedPlace = useCallback(async (): Promise<void> => {
    if (!selectedPlace || !userId) {
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
            title: `Chuyến đi ${selectedPlace.name}`,
            destination: getSelectedPlaceDestination(selectedPlace),
            startDate,
            endDate,
            description: `${travelerCount} người`,
          }),
        }
      );

      if (!response.ok || !data.success || !data.data) {
        setTripActionMessage(getApiErrorMessage(data, 'Không thể tạo lịch trình'));
        setTripActionStatus('error');
        return;
      }

      await addSelectedPlaceToTrip(data.data._id);
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
    userId,
  ]);

  return {
    myTrips,
    tripsStatus,
    tripActionStatus,
    isLoadingTrips: tripsStatus === 'loading',
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
