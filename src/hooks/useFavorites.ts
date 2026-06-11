'use client';

import { useState, useCallback } from 'react';
import { apiRequest } from '@/lib/api-client';
import { FavoritePlaceSummary } from '@/types/profile';

interface UseFavoritesOptions {
  userId: string | null;
}

export interface UseFavoritesReturn {
  favorites: FavoritePlaceSummary[];
  loading: boolean;

  loadFavorites: (uid?: string) => Promise<void>;
  removeFavorite: (id: string) => Promise<void>;

  setFavorites: React.Dispatch<React.SetStateAction<FavoritePlaceSummary[]>>;
}

export function useFavorites({ userId }: UseFavoritesOptions): UseFavoritesReturn {
  const [favorites, setFavorites] = useState<FavoritePlaceSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFavorites = useCallback(async (uid?: string) => {
    const id = uid || userId;
    if (!id) return;

    setLoading(true);
    try {
      const { response, data } = await apiRequest<{ success?: boolean; data?: FavoritePlaceSummary[] }>('/api/favorites', { userId: id });
      if (response.ok && data.success && Array.isArray(data.data)) {
        setFavorites(data.data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const removeFavorite = useCallback(async (id: string) => {
    if (!userId) return;

    const previous = favorites;
    setFavorites(prev => prev.filter(f => f._id !== id));

    try {
      const { response } = await apiRequest(`/api/favorites/${id}`, { method: 'DELETE', userId });
      if (!response.ok) throw new Error();
    } catch {
      setFavorites(previous);
      throw new Error('Remove favorite failed');
    }
  }, [userId, favorites]);

  return {
    favorites,
    loading,
    loadFavorites,
    removeFavorite,
    setFavorites,
  };
}
