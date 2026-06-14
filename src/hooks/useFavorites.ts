'use client';

import { useState, useCallback } from 'react';
import { apiRequest } from '@/lib/api-client';
import { FavoritePlaceSummary } from '@/types/profile';
import { RequestStatus } from '@/types/common';

interface UseFavoritesOptions {
  userId: string | null;
}

export interface UseFavoritesReturn {
  data: FavoritePlaceSummary[];
  status: RequestStatus;
  error: string | null;
  pagination: { page: number; total: number; totalPages: number } | null;
  removingIds: Set<string>;
  actions: {
    loadFavorites: (uid?: string, page?: number) => Promise<void>;
    removeFavorite: (id: string) => Promise<void>;
    setFavorites: React.Dispatch<React.SetStateAction<FavoritePlaceSummary[]>>;
  };
}

export function useFavorites({ userId }: UseFavoritesOptions): UseFavoritesReturn {
  const [favorites, setFavorites] = useState<FavoritePlaceSummary[]>([]);
  const [status, setStatus] = useState<RequestStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{ page: number; total: number; totalPages: number } | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  const loadFavorites = useCallback(async (uid?: string, page: number = 1): Promise<void> => {
    const id = uid || userId;
    if (!id) return;

    setStatus('loading');
    setError(null);
    try {
      const { response, data } = await apiRequest<{ success?: boolean; data?: FavoritePlaceSummary[]; pagination?: any }>(`/api/favorites?page=${page}`, { userId: id });
      if (response.ok && data.success && Array.isArray(data.data)) {
        setFavorites(data.data);
        if (data.pagination) setPagination(data.pagination);
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (err) {
      setError('Không thể tải danh sách địa điểm yêu thích');
      setStatus('error');
    }
  }, [userId]);

  const removeFavorite = useCallback(async (id: string): Promise<void> => {
    if (!userId || removingIds.has(id)) return;

    setRemovingIds(prev => new Set(prev).add(id));
    const previous = favorites;
    setFavorites(prev => prev.filter(f => f._id !== id));

    try {
      const { response } = await apiRequest(`/api/favorites/${id}`, { method: 'DELETE', userId });
      if (!response.ok) throw new Error();
    } catch (err) {
      setFavorites(previous);
      throw new Error('Remove favorite failed');
    } finally {
      setRemovingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [userId, favorites, removingIds]);

  return {
    data: favorites,
    status,
    error,
    pagination,
    removingIds,
    actions: {
      loadFavorites,
      removeFavorite,
      setFavorites,
    },
  };
}
