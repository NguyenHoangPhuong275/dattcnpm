'use client';

import { useState, useCallback } from 'react';
import { apiRequest } from '@/lib/api-client';
import { FavoritePlaceSummary } from '@/types/profile';

export type FavoritesStatus = 'idle' | 'loading' | 'success' | 'error';

interface UseFavoritesOptions {
  userId: string | null;
}

export interface UseFavoritesReturn {
  data: FavoritePlaceSummary[];
  status: FavoritesStatus;
  error: string | null;
  actions: {
    loadFavorites: (uid?: string) => Promise<void>;
    removeFavorite: (id: string) => Promise<void>;
    setFavorites: React.Dispatch<React.SetStateAction<FavoritePlaceSummary[]>>;
  };
}

export function useFavorites({ userId }: UseFavoritesOptions): UseFavoritesReturn {
  const [favorites, setFavorites] = useState<FavoritePlaceSummary[]>([]);
  const [status, setStatus] = useState<FavoritesStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const loadFavorites = useCallback(async (uid?: string): Promise<void> => {
    const id = uid || userId;
    if (!id) return;

    setStatus('loading');
    setError(null);
    try {
      const { response, data } = await apiRequest<{ success?: boolean; data?: FavoritePlaceSummary[] }>('/api/favorites', { userId: id });
      if (response.ok && data.success && Array.isArray(data.data)) {
        setFavorites(data.data);
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách địa điểm yêu thích:', err);
      setError('Không thể tải danh sách địa điểm yêu thích');
      setStatus('error');
    }
  }, [userId]);

  const removeFavorite = useCallback(async (id: string): Promise<void> => {
    if (!userId) return;

    const previous = favorites;
    setFavorites(prev => prev.filter(f => f._id !== id));

    try {
      const { response } = await apiRequest(`/api/favorites/${id}`, { method: 'DELETE', userId });
      if (!response.ok) throw new Error();
    } catch (err) {
      console.error('Lỗi khi xóa địa điểm yêu thích:', err);
      setFavorites(previous);
      throw new Error('Remove favorite failed');
    }
  }, [userId, favorites]);

  return {
    data: favorites,
    status,
    error,
    actions: {
      loadFavorites,
      removeFavorite,
      setFavorites,
    },
  };
}
