'use client';
import React, { memo } from 'react';
import { MyReview } from '@/types/profile';
import EmptyState from '@/components/ui/EmptyState';

export type { MyReview }; 

interface ReviewsSectionProps {
  reviews: MyReview[];
  loading?: boolean;
}

const ReviewsSection = memo(({ reviews, loading }: ReviewsSectionProps) => (
  <div>
    {loading ? (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-400">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2
          border-[var(--color-primary-dark)] border-t-transparent" />
        Đang tải đánh giá...
      </div>
    ) : reviews.length > 0 ? (
      <div className="space-y-3">
        {reviews.map((r, idx) => (
          <div key={r._id || idx} className="border border-slate-100 rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--color-primary-dark)]">★ {r.rating}/5</span>
              <span className="text-sm text-slate-500">
                {r.createdAt
                  ? new Date(r.createdAt).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })
                  : '—'}
              </span>
            </div>
            <div className="mt-1 text-sm">{r.comment || '(Không có bình luận)'}</div>
            {r.place?.name && <div className="mt-1 text-xs text-emerald-600 font-semibold">@{r.place.name}</div>}
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

