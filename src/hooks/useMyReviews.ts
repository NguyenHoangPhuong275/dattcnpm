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
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const loading = status === 'loading';

  const loadReviews = useCallback(async (uid?: string): Promise<void> => {
    const id = uid || userId;
    if (!id) return;

    setStatus('loading');
    try {
      const { response, data } = await apiRequest<{ success?: boolean; data?: MyReview[] }>('/api/reviews/my', { userId: id });
      if (response.ok && data.success && Array.isArray(data.data)) {
        setReviews(data.data);
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách đánh giá:', err);
      setStatus('error');
    }
  }, [userId]);

  return {
    reviews,
    loading,
    loadReviews,
    setReviews,
  };
}
