'use client';

import { useState, useCallback } from 'react';
import { apiRequest } from '@/lib/api-client';
import { MyReview } from '@/types/profile';

export type MyReviewsStatus = 'idle' | 'loading' | 'success' | 'error';

interface UseMyReviewsOptions {
  userId: string | null;
}

export interface UseMyReviewsReturn {
  data: MyReview[];
  status: MyReviewsStatus;
  error: string | null;
  actions: {
    loadReviews: (uid?: string) => Promise<void>;
    setReviews: React.Dispatch<React.SetStateAction<MyReview[]>>;
  };
}

export function useMyReviews({ userId }: UseMyReviewsOptions): UseMyReviewsReturn {
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [status, setStatus] = useState<MyReviewsStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const loadReviews = useCallback(async (uid?: string): Promise<void> => {
    const id = uid || userId;
    if (!id) return;

    setStatus('loading');
    setError(null);
    try {
      const { response, data } = await apiRequest<{ success?: boolean; data?: MyReview[] }>('/api/reviews/my', { userId: id });
      if (response.ok && data.success && Array.isArray(data.data)) {
        setReviews(data.data);
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.error('Lỗi khi tải danh sách đánh giá:', err);
      setError('Không thể tải danh sách đánh giá');
      setStatus('error');
    }
  }, [userId]);

  return {
    data: reviews,
    status,
    error,
    actions: {
      loadReviews,
      setReviews,
    },
  };
}
