'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiRequest, ensureApiSuccess, getApiErrorMessage } from '@/lib/api-client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import { useFeedback } from '@/hooks/useFeedback';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ReviewItem {
  id: string;
  author: string;
  avatarUrl: string | null;
  rating: number;
  comment: string;
  createdAt: string;
  isMine: boolean;
}

interface ReviewSummary {
  items: ReviewItem[];
  count: number;
  average: number;
  distribution: Record<string, number>;
  mine: ReviewItem | null;
}

interface ApiResponse {
  success?: boolean;
  data?: ReviewSummary;
  message?: string;
}

interface HotelReviewsProps {
  hotelId: string;
  hotelName: string;
}

type Status = 'loading' | 'success' | 'error';

const STAR_LEVELS = [5, 4, 3, 2, 1] as const;

function StarRow({ value }: { value: number }): React.JSX.Element {
  const full = Math.round(value);
  return (
    <span aria-label={`${value} trên 5 sao`} className="text-[var(--color-warning,#d97706)]">
      {'★'.repeat(Math.min(5, full))}
      <span className="text-[var(--color-border)]">{'★'.repeat(Math.max(0, 5 - full))}</span>
    </span>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (rating: number) => void }): React.JSX.Element {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          aria-label={`${star} sao`}
          aria-pressed={value >= star}
          className={`text-2xl leading-none transition ${value >= star ? 'text-[var(--color-warning,#d97706)]' : 'text-[var(--color-border)] hover:text-[var(--color-warning,#d97706)]'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function HotelReviews({ hotelId, hotelName }: HotelReviewsProps): React.JSX.Element {
  const userHook = useCurrentUser({ redirectIfNone: false });
  const userId = userHook.data?.id ?? null;
  const { actions: { showToast } } = useToast();
  const { actions: feedback } = useFeedback();

  const [status, setStatus] = useState<Status>('loading');
  const [summary, setSummary] = useState<ReviewSummary>({ items: [], count: 0, average: 0, distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }, mine: null });
  const [errorMessage, setErrorMessage] = useState('');
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    setStatus('loading');
    setErrorMessage('');
    try {
      const { response, data } = await apiRequest<ApiResponse>(`/api/hotels/${hotelId}/reviews`, userId ? { userId } : undefined);
      try {
        ensureApiSuccess(response, data, 'Không thể tải đánh giá');
      } catch {
        setErrorMessage(getApiErrorMessage(data, 'Không thể tải đánh giá'));
        setStatus('error');
        return;
      }
      const payload = data.data;
      const next: ReviewSummary = {
        items: Array.isArray(payload?.items) ? payload.items : [],
        count: Number(payload?.count) || 0,
        average: Number(payload?.average) || 0,
        distribution: payload?.distribution ?? { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
        mine: payload?.mine ?? null,
      };
      setSummary(next);
      if (next.mine) {
        setRating(next.mine.rating);
        setComment(next.mine.comment);
      }
      setStatus('success');
    } catch {
      setErrorMessage('Không thể tải đánh giá');
      setStatus('error');
    }
  }, [hotelId, userId]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (): Promise<void> => {
    if (!userId) {
      showToast('Vui lòng đăng nhập để đánh giá', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const { response, data } = await apiRequest<ApiResponse>(`/api/hotels/${hotelId}/reviews`, {
        method: 'POST',
        userId,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      });
      try {
        ensureApiSuccess(response, data, 'Không thể gửi đánh giá');
      } catch {
        showToast(getApiErrorMessage(data, 'Không thể gửi đánh giá'), 'error');
        return;
      }
      showToast(summary.mine ? 'Đã cập nhật đánh giá' : 'Đã gửi đánh giá', 'success');
      await load();
    } catch {
      showToast('Không thể gửi đánh giá', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string): Promise<void> => {
    if (!userId) return;
    await feedback.confirmAction({
      confirm: {
        title: 'Xóa đánh giá?',
        description: 'Đánh giá của bạn sẽ bị xóa.',
        confirmLabel: 'Xóa',
        tone: 'danger',
      },
      action: async () => {
        const { response, data } = await apiRequest<ApiResponse>(`/api/hotels/${hotelId}/reviews/${id}`, { method: 'DELETE', userId });
        ensureApiSuccess(response, data, 'Không thể xóa đánh giá');
        setRating(5);
        setComment('');
        await load();
      },
      success: 'Đã xóa đánh giá',
      error: 'Không thể xóa đánh giá',
    });
  };

  const maxBar = Math.max(1, ...STAR_LEVELS.map((star) => summary.distribution[String(star)] ?? 0));
  const visible = starFilter ? summary.items.filter((item) => item.rating === starFilter) : summary.items;

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-bold text-[var(--color-text)]">Đánh giá từ người dùng</h2>
        {status === 'loading' && <LoadingSpinner size="sm" className="text-[var(--color-primary-dark)]" />}
      </div>

      {status === 'error' && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3">
          <span className="text-sm text-[var(--color-danger)]">{errorMessage || 'Không thể tải đánh giá'}</span>
          <button type="button" onClick={load} className="shrink-0 text-xs font-semibold text-[var(--color-primary-darker)] hover:underline">Thử lại</button>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-4">
          {summary.count > 0 && (
            <div className="grid grid-cols-1 gap-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:grid-cols-[auto_minmax(0,1fr)]">
              <div className="flex flex-col items-center justify-center sm:pr-5">
                <div className="text-4xl font-extrabold text-[var(--color-text)]">{summary.average.toFixed(1)}</div>
                <StarRow value={summary.average} />
                <div className="mt-1 text-xs text-[var(--color-text-muted)]">{summary.count} lượt đánh giá</div>
              </div>
              <div className="space-y-1.5">
                {STAR_LEVELS.map((star) => {
                  const count = summary.distribution[String(star)] ?? 0;
                  const active = starFilter === star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setStarFilter(active ? null : star)}
                      aria-pressed={active}
                      className={`flex w-full items-center gap-2 rounded-md px-1.5 py-0.5 text-left text-xs transition hover:bg-[var(--color-bg)] ${active ? 'bg-[var(--color-primary-lightest)]' : ''}`}
                    >
                      <span className="w-8 shrink-0 font-semibold text-[var(--color-text-secondary)]">{star} ★</span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-bg)]">
                        <span className="block h-full rounded-full bg-[var(--color-warning,#d97706)]" style={{ width: `${(count / maxBar) * 100}%` }} />
                      </span>
                      <span className="w-10 shrink-0 text-right text-[var(--color-text-muted)]">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {userId ? (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <div className="mb-2 text-sm font-semibold text-[var(--color-text)]">{summary.mine ? 'Chỉnh sửa đánh giá của bạn' : `Đánh giá ${hotelName}`}</div>
              <StarPicker value={rating} onChange={setRating} />
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Chia sẻ trải nghiệm của bạn về khách sạn này..."
                className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="mt-2 rounded-lg bg-[var(--color-primary-darker)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
              >
                {submitting ? 'Đang gửi...' : summary.mine ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
              Đăng nhập để viết đánh giá cho khách sạn này.
            </div>
          )}

          {summary.count > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setStarFilter(null)}
                aria-pressed={starFilter === null}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${starFilter === null ? 'border-[var(--color-primary-darker)] bg-[var(--color-primary-lightest)] text-[var(--color-primary-darker)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}
              >
                Tất cả
              </button>
              {STAR_LEVELS.map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setStarFilter(starFilter === star ? null : star)}
                  aria-pressed={starFilter === star}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${starFilter === star ? 'border-[var(--color-primary-darker)] bg-[var(--color-primary-lightest)] text-[var(--color-primary-darker)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}
                >
                  {star} ★
                </button>
              ))}
            </div>
          )}

          {summary.count === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-6 text-center text-sm text-[var(--color-text-muted)]">
              Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá khách sạn này.
            </div>
          ) : (
            <ul className="space-y-3">
              {visible.length > 0 ? visible.map((item) => (
                <li key={item.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-[var(--color-text)]">{item.author}{item.isMine ? ' (Bạn)' : ''}</span>
                    <StarRow value={item.rating} />
                  </div>
                  <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">{formatDate(item.createdAt)}</div>
                  {item.comment && <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">{item.comment}</p>}
                  {item.isMine && (
                    <button type="button" onClick={() => remove(item.id)} className="mt-2 text-xs font-semibold text-[var(--color-danger)] hover:underline">
                      Xóa đánh giá
                    </button>
                  )}
                </li>
              )) : (
                <li className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
                  Chưa có đánh giá ở mức {starFilter} sao.
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
