'use client';

import React, { memo } from 'react';
import { MyReview } from '@/types/profile';

export type { MyReview }; 

interface ReviewsSectionProps {
  reviews: MyReview[];
  loading?: boolean;
}

const ReviewsSection = memo(({ reviews, loading }: ReviewsSectionProps) => (
  <div>
    <div className="font-display font-bold text-lg mb-4">Đánh giá của tôi</div>
    {loading ? (
      <div className="text-center py-8 text-slate-400 text-sm">Đang tải đánh giá...</div>
    ) : reviews.length > 0 ? (
      <div className="space-y-3">
        {reviews.map((r, idx) => (
          <div key={r._id || idx} className="border border-slate-100 rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--color-primary-dark)]">★ {r.rating}/5</span>
              <span className="text-sm text-slate-500">{r.createdAt}</span>
            </div>
            <div className="mt-1 text-sm">{r.comment || '(Không có bình luận)'}</div>
            {r.place?.name && <div className="mt-1 text-xs text-emerald-600 font-semibold">@{r.place.name}</div>}
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-10 text-slate-400">Bạn chưa có đánh giá nào. Sau khi trải nghiệm địa điểm hãy chia sẻ cảm nhận của bạn!</div>
    )}
  </div>
));

ReviewsSection.displayName = 'ReviewsSection';

export default ReviewsSection;
