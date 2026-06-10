'use client';

import { useState, useCallback } from 'react';
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
      const res = await fetch('/api/favorites', { headers: { 'x-user-id': id } });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setFavorites(json.data);
        }
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
      const res = await fetch(`/api/favorites/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId },
      });
      if (!res.ok) throw new Error();
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
