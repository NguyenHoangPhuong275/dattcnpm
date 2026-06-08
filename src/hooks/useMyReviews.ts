'use client';

import { useState, useCallback } from 'react';
import { MyReview } from '@/types/profile';

interface UseMyReviewsOptions {
  userId: string | null;
}

export interface UseMyReviewsReturn {
  reviews: MyReview[];
  loading: boolean;

  loadReviews: (uid?: string) => Promise<void>;

  setReviews: React.Dispatch<React.SetStateAction<MyReview[]>>;
}

export function useMyReviews({ userId }: UseMyReviewsOptions): UseMyReviewsReturn {
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [loading, setLoading] = useState(false);

  const loadReviews = useCallback(async (uid?: string) => {
    const id = uid || userId;
    if (!id) return;

    setLoading(true);
    try {
      const res = await fetch('/api/reviews/my', { headers: { 'x-user-id': id } });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setReviews(json.data);
        }
      }
    } catch (e) {
      console.warn('loadReviews failed', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return {
    reviews,
    loading,
    loadReviews,
    setReviews,
  };
}
