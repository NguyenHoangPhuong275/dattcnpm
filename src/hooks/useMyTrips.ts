'use client';

import { useState, useCallback, useTransition } from 'react';
import { TripSummary } from '@/types/profile';

interface UseMyTripsOptions {
  userId: string | null;
}

export interface UseMyTripsReturn {
  trips: TripSummary[];
  loading: boolean;
  creating: boolean;

  loadTrips: (uid?: string) => Promise<void>;
  createTrip: (title: string, destination: string) => Promise<{ success: boolean; message?: string }>;
  deleteTrip: (id: string) => Promise<void>;

  setTrips: React.Dispatch<React.SetStateAction<TripSummary[]>>;
}

export function useMyTrips({ userId }: UseMyTripsOptions): UseMyTripsReturn {
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const [, startTransition] = useTransition();

  const loadTrips = useCallback(async (uid?: string) => {
    const id = uid || userId;
    if (!id) return;

    setLoading(true);
    try {
      const res = await fetch('/api/trips', { headers: { 'x-user-id': id } });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setTrips(json.data);
        }
      }
    } catch (e) {
      console.warn('loadTrips failed', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const createTrip = useCallback(async (title: string, destination: string) => {
    if (!userId) return { success: false, message: 'No user' };

    const trimmedTitle = title.trim();
    const trimmedDest = destination.trim();

    if (!trimmedTitle || !trimmedDest) {
      return { success: false, message: 'Vui lòng nhập tiêu đề và điểm đến' };
    }

    setCreating(true);

    try {
      const start = new Date().toISOString().split('T')[0];
      const end = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString().split('T')[0];

      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({
          title: trimmedTitle,
          destination: trimmedDest,
          startDate: start,
          endDate: end,
        }),
      });

      const json = await res.json();

      if (json.success && json.data) {
        setTrips(prev => [json.data, ...prev]);
        return { success: true };
      } else {
        return { success: false, message: json.message || 'Tạo chuyến đi thất bại' };
      }
    } catch (e) {
      console.warn('Create trip failed', e);
      return { success: false, message: 'Không thể tạo chuyến đi lúc này' };
    } finally {
      setCreating(false);
    }
  }, [userId]);

  const deleteTrip = useCallback(async (id: string) => {
    if (!userId) return;

    const previous = trips;
    setTrips(prev => prev.filter(t => t._id !== id));

    try {
      const res = await fetch(`/api/trips/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId },
      });

      if (!res.ok) throw new Error();
    } catch (e) {
      setTrips(previous);
      throw e; 
    }
  }, [userId, trips]);

  return {
    trips,
    loading,
    creating,
    loadTrips,
    createTrip,
    deleteTrip,
    setTrips,
  };
}
