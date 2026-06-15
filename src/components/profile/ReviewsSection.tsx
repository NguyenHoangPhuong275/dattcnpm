'use client';
import React, { memo } from 'react';
import { MyReview } from '@/types/profile';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/lib/date';

export type { MyReview }; 

interface ReviewsSectionProps {
  reviews: MyReview[];
  loading?: boolean;
}

const ReviewsSection = memo(({ reviews, loading }: ReviewsSectionProps) => (
  <div>
    {loading ? (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-[var(--color-text-muted)]">
        <LoadingSpinner size="sm" className="text-[var(--color-primary-dark)]" />
        Đang tải đánh giá...
      </div>
    ) : reviews.length > 0 ? (
      <div className="space-y-3">
        {reviews.map((r, idx) => (
          <div key={r._id || idx} className="border border-[var(--color-border)] rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--color-primary-dark)]">★ {r.rating}/5</span>
              <span className="text-sm text-[var(--color-text-muted)]">
                {formatDate(r.createdAt)}
              </span>
            </div>
            <div className="mt-1 text-sm">{r.comment || '(Không có bình luận)'}</div>
            {r.place?.name && <div className="mt-1 text-xs text-[var(--color-success)] font-semibold">@{r.place.name}</div>}
          </div>
        ))}
      </div>
    ) : (
      <EmptyState
        title="Chưa có đánh giá nào"
        description="Sau khi trải nghiệm địa điểm, hãy chia sẻ cảm nhận của bạn!"
      />
    )}
  </div>
));

ReviewsSection.displayName = 'ReviewsSection';

export default ReviewsSection;
