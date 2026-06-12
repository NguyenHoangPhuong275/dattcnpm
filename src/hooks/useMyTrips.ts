'use client';

import { useState, useCallback } from 'react';
import { apiRequest, getApiErrorMessage } from '@/lib/api-client';
import type { TripSummary } from '@/types/profile';
import { getDefaultStartDate, getDefaultEndDate } from '@/lib/date';

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
  trips: TripSummary[];
  loading: boolean;
  creating: boolean;
  error: string | null;

  loadTrips: (uid?: string) => Promise<void>;
  createTrip: (payload: CreateTripPayload) => Promise<{ success: boolean; message?: string }>;
  deleteTrip: (id: string) => Promise<void>;

  setTrips: React.Dispatch<React.SetStateAction<TripSummary[]>>;
}

export function useMyTrips({ userId }: UseMyTripsOptions): UseMyTripsReturn {
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTrips = useCallback(async (uid?: string) => {
    const id = uid || userId;
    if (!id) return;

    setLoading(true);
    setError(null);
    try {
      const { response, data } = await apiRequest<{ success?: boolean; data?: TripSummary[] }>('/api/trips', { userId: id });
      if (response.ok && data.success && Array.isArray(data.data)) {
        setTrips(data.data);
      }
    } catch {
      setError('Không thể tải danh sách chuyến đi');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const createTrip = useCallback(async (payload: CreateTripPayload) => {
    if (!userId) return { success: false, message: 'No user' };

    const trimmedTitle = payload.title.trim();
    const trimmedDest = payload.destination.trim();

    if (!trimmedTitle || !trimmedDest) {
      return { success: false, message: 'Vui lòng nhập tiêu đề và điểm đến' };
    }

    setCreating(true);

    try {
      const start = payload.startDate || getDefaultStartDate();
      const end = payload.endDate || getDefaultEndDate(3);

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
        setTrips(prev => {
          if (prev.some(t => t._id === createdTrip._id)) {
            return prev;
          }
          return [createdTrip, ...prev];
        });
        return { success: true };
      } else {
        return { success: false, message: getApiErrorMessage(data, 'Tạo chuyến đi thất bại') };
      }
    } catch {
      return { success: false, message: 'Không thể tạo chuyến đi lúc này' };
    } finally {
      setCreating(false);
    }
  }, [userId]);

  const deleteTrip = useCallback(async (id: string) => {
    if (!userId) return;

    let snapshot: TripSummary[] = [];
    setTrips(prev => {
      snapshot = prev;
      return prev.filter(t => t._id !== id);
    });

    try {
      const { response } = await apiRequest(`/api/trips/${id}`, { method: 'DELETE', userId });

      if (!response.ok) throw new Error();
    } catch {
      setTrips(snapshot);
      throw new Error('Delete trip failed');
    }
  }, [userId]);

  return {
    trips,
    loading,
    creating,
    error,
    loadTrips,
    createTrip,
    deleteTrip,
    setTrips,
  };
}
