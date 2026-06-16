'use client';

import { useState, useCallback } from 'react';
import { apiRequest, ensureApiSuccess, type ApiEnvelope } from '@/lib/api-client';
import { MyReview } from '@/types/profile';
import { RequestStatus } from '@/types/common';

export type MyReviewsStatus = RequestStatus;

interface UseMyReviewsOptions {
  userId: string | null;
}

export interface UseMyReviewsReturn {
  data: MyReview[];
  status: MyReviewsStatus;
  error: string | null;
  savingId: string | null;
  deletingIds: Set<string>;
  actions: {
    loadReviews: (uid?: string) => Promise<void>;
    updateReview: (reviewId: string, payload: { rating: number; comment?: string }) => Promise<MyReview>;
    deleteReview: (reviewId: string) => Promise<void>;
    setReviews: React.Dispatch<React.SetStateAction<MyReview[]>>;
  };
}

export function useMyReviews({ userId }: UseMyReviewsOptions): UseMyReviewsReturn {
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [status, setStatus] = useState<MyReviewsStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(() => new Set());

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
    } catch {
      setError('Không thể tải danh sách đánh giá');
      setStatus('error');
    }
  }, [userId]);

  const updateReview = useCallback(async (reviewId: string, payload: { rating: number; comment?: string }): Promise<MyReview> => {
    setSavingId(reviewId);
    try {
      const { response, data } = await apiRequest<ApiEnvelope<MyReview>>(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        userId: userId ?? undefined,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      ensureApiSuccess(response, data, 'Không thể cập nhật đánh giá');
      if (!data.data) throw new Error('Không thể cập nhật đánh giá');

      setReviews((prev) => prev.map((review) => (
        review._id === reviewId
          ? { ...review, rating: data.data?.rating ?? payload.rating, comment: data.data?.comment ?? payload.comment }
          : review
      )));

      return data.data;
    } finally {
      setSavingId(null);
    }
  }, [userId]);

  const deleteReview = useCallback(async (reviewId: string): Promise<void> => {
    setDeletingIds((prev) => new Set(prev).add(reviewId));
    try {
      const { response, data } = await apiRequest<ApiEnvelope>(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        userId: userId ?? undefined,
      });

      ensureApiSuccess(response, data, 'Không thể xóa đánh giá');

      setReviews((prev) => prev.filter((review) => review._id !== reviewId));
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(reviewId);
        return next;
      });
    }
  }, [userId]);

  return {
    data: reviews,
    status,
    error,
    savingId,
    deletingIds,
    actions: {
      loadReviews,
      updateReview,
      deleteReview,
      setReviews,
    },
  };
}
