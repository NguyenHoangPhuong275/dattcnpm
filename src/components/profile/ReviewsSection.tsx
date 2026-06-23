'use client';

import { memo, useState } from 'react';
import { MyReview } from '@/types/profile';
import EmptyState from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/date';

export type { MyReview };

interface ReviewsSectionProps {
  reviews: MyReview[];
  loading?: boolean;
  savingId?: string | null;
  deletingIds?: Set<string>;
  onUpdate?: (reviewId: string, payload: { rating: number; comment?: string }) => Promise<void>;
  onDelete?: (reviewId: string) => Promise<void>;
}

const ReviewsSection = memo(({
  reviews,
  loading,
  savingId = null,
  deletingIds = new Set<string>(),
  onUpdate,
  onDelete,
}: ReviewsSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftRating, setDraftRating] = useState(5);
  const [draftComment, setDraftComment] = useState('');

  const startEdit = (review: MyReview): void => {
    setEditingId(review._id);
    setDraftRating(review.rating);
    setDraftComment(review.comment || '');
  };

  const cancelEdit = (): void => {
    setEditingId(null);
    setDraftRating(5);
    setDraftComment('');
  };

  const submitEdit = async (reviewId: string): Promise<void> => {
    if (!onUpdate || savingId) return;
    await onUpdate(reviewId, {
      rating: draftRating,
      comment: draftComment.trim() || undefined,
    });
    cancelEdit();
  };

  return (
    <div>
      {loading ? (
        <div className="space-y-3" role="status" aria-label="Đang tải đánh giá">
          {[0, 1, 2].map((row) => (
            <div key={row} className="rounded-2xl border border-[var(--color-border)] p-4">
              <div className="h-4 w-1/3 animate-pulse rounded bg-[var(--color-border)]" />
              <div className="mt-3 h-3 w-2/3 animate-pulse rounded bg-[var(--color-border)]" />
            </div>
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-3">
          {reviews.map((review, idx) => {
            const isEditing = editingId === review._id;
            const isSaving = savingId === review._id;
            const isDeleting = deletingIds.has(review._id);

            return (
              <div key={review._id || idx} className="rounded-2xl border border-[var(--color-border)] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-[var(--color-primary-lightest)] px-1.5 py-0.5 text-xs font-bold text-[var(--color-primary-darker)]">{review.rating}/5</span>
                      <span className="text-sm text-[var(--color-text-muted)]">{formatDate(review.createdAt)}</span>
                    </div>
                    {review.place?.name && (
                      <div className="mt-1 text-xs font-semibold text-[var(--color-success)]">@{review.place.name}</div>
                    )}
                  </div>

                  {(onUpdate || onDelete) && !isEditing && (
                    <div className="flex shrink-0 gap-2">
                      {onUpdate && (
                        <button
                          type="button"
                          onClick={() => startEdit(review)}
                          className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-lightest)]"
                        >
                          Sửa
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(review._id)}
                          disabled={isDeleting}
                          className="rounded-lg border border-[var(--color-danger)]/20 px-3 py-1.5 text-xs font-semibold text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 disabled:opacity-50"
                        >
                          {isDeleting ? 'Đang xóa...' : 'Xóa'}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="mt-3 space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/40 p-3">
                    <label className="block text-xs font-semibold text-[var(--color-text-muted)]" htmlFor={`review-rating-${review._id}`}>
                      Điểm đánh giá
                    </label>
                    <select
                      id={`review-rating-${review._id}`}
                      value={draftRating}
                      onChange={(event) => setDraftRating(Number(event.target.value))}
                      className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
                    >
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <option key={rating} value={rating}>{rating}/5</option>
                      ))}
                    </select>

                    <label className="block text-xs font-semibold text-[var(--color-text-muted)]" htmlFor={`review-comment-${review._id}`}>
                      Bình luận
                    </label>
                    <textarea
                      id={`review-comment-${review._id}`}
                      value={draftComment}
                      onChange={(event) => setDraftComment(event.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
                    />

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)]"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={() => submitEdit(review._id)}
                        disabled={isSaving}
                        className="rounded-lg bg-[var(--color-primary-darker)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        {isSaving ? 'Đang lưu...' : 'Lưu'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-[var(--color-text)]">
                    {review.comment || '(Không có bình luận)'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Chưa có đánh giá nào"
          description="Sau khi trải nghiệm địa điểm, hãy chia sẻ cảm nhận của bạn!"
        />
      )}
    </div>
  );
});

ReviewsSection.displayName = 'ReviewsSection';

export default ReviewsSection;
