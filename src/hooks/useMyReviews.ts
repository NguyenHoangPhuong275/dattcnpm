'use client';

import { useState, useCallback } from 'react';
import { apiRequest } from '@/lib/api-client';
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
      const { response, data } = await apiRequest<{ success?: boolean; data?: MyReview[] }>('/api/reviews/my', { userId: id });
      if (response.ok && data.success && Array.isArray(data.data)) {
        setReviews(data.data);
      }
    } catch {
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
