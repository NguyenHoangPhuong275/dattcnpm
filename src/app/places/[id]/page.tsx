'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import AddToTripModal from '@/components/trips/AddToTripModal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { MapPinIcon, WeatherIcon } from '@/components/icons';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { usePlaceDetails } from '@/hooks/usePlaceDetails';
import { useToast } from '@/hooks/useToast';
import type { SearchResult } from '@/hooks/usePlaceSearch';
import { apiRequest, ensureApiSuccess, getApiErrorMessage, type ApiEnvelope } from '@/lib/api-client';
import { ROUTES } from '@/lib/constants';
import { getPlaceTypeLabel } from '@/lib/place-labels';
import { getTripImage } from '@/lib/trip-utils';

interface PlaceDetail {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  address: string | null;
  openingHours: string | null;
  images: string[];
  tags: string[];
  ratingAvg: number;
  ratingCount: number;
}

interface PlaceReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  authorName: string;
}

interface PlaceDetailPayload {
  place: PlaceDetail;
  reviews: PlaceReview[];
}

type Status = 'loading' | 'success' | 'error';

function formatReviewDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function StarRow({ rating }: { rating: number }): React.JSX.Element {
  return (
    <span aria-label={`${rating} trên 5 sao`} className="text-sm text-amber-500">
      {'★'.repeat(Math.max(0, Math.min(5, Math.round(rating))))}
      <span className="text-[var(--color-border-strong)]">{'★'.repeat(Math.max(0, 5 - Math.round(rating)))}</span>
    </span>
  );
}

export default function PlaceDetailPage(): React.JSX.Element {
  const params = useParams<{ id: string }>();
  const placeId = params?.id;
  const { data: user } = useCurrentUser({ redirectIfNone: false });
  const toast = useToast();
  const { showToast } = toast.actions;

  const [status, setStatus] = useState<Status>('loading');
  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [reviews, setReviews] = useState<PlaceReview[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [addToTripOpen, setAddToTripOpen] = useState(false);
  const [favoriteSaving, setFavoriteSaving] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    if (!placeId) return;
    setStatus('loading');
    setErrorMessage('');
    try {
      const { response, data } = await apiRequest<ApiEnvelope<PlaceDetailPayload>>(`/api/places/${placeId}`);
      try {
        ensureApiSuccess(response, data, 'Không thể tải thông tin địa điểm');
      } catch {
        setErrorMessage(getApiErrorMessage(data, 'Không thể tải thông tin địa điểm'));
        setStatus('error');
        return;
      }
      setPlace(data.data?.place ?? null);
      setReviews(data.data?.reviews ?? []);
      setStatus('success');
    } catch {
      setErrorMessage('Không thể tải thông tin địa điểm');
      setStatus('error');
    }
  }, [placeId]);

  useEffect(() => {
    load();
  }, [load]);

  const searchResult: SearchResult | null = useMemo(
    () =>
      place
        ? { _id: place.id, name: place.name, type: place.type, lat: place.lat, lng: place.lng, address: place.address }
        : null,
    [place],
  );
  const details = usePlaceDetails(searchResult);

  const heroImage = place
    ? place.images[0] ?? getTripImage({ destination: `${place.name} ${place.address ?? ''}`, coverImage: null })
    : null;
  const mapQuery = place ? `${place.name}, ${place.address ?? 'Việt Nam'}` : '';

  const handleSaveFavorite = async (): Promise<void> => {
    if (!place) return;
    if (!user) {
      window.location.href = `${ROUTES.home}?auth=login`;
      return;
    }
    if (favoriteSaving) return;
    setFavoriteSaving(true);
    try {
      const { response, data } = await apiRequest<ApiEnvelope>('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId: place.id,
          name: place.name,
          lat: place.lat,
          lng: place.lng,
          address: place.address || undefined,
        }),
      });
      ensureApiSuccess(response, data, 'Không thể lưu địa điểm yêu thích');
      showToast('Đã lưu địa điểm yêu thích', 'success');
    } catch (error: unknown) {
      showToast(getApiErrorMessage(error, 'Không thể lưu địa điểm yêu thích'), 'error');
    } finally {
      setFavoriteSaving(false);
    }
  };

  const handleSubmitReview = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!place) return;
    if (!user) {
      window.location.href = `${ROUTES.home}?auth=login`;
      return;
    }
    if (reviewSaving) return;
    setReviewSaving(true);
    try {
      const { response, data } = await apiRequest<ApiEnvelope>('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId: place.id,
          rating: reviewRating,
          comment: reviewComment.trim() || undefined,
        }),
      });
      ensureApiSuccess(response, data, 'Không thể gửi đánh giá');
      showToast('Đã gửi đánh giá', 'success');
      setReviewComment('');
      await load();
    } catch (error: unknown) {
      showToast(getApiErrorMessage(error, 'Không thể gửi đánh giá'), 'error');
    } finally {
      setReviewSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <AppHeader showSearch={false} />

      <main className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8">
        <Link id="place-detail-back" href={ROUTES.home} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary-darker)] hover:underline">
          Về trang tìm kiếm địa điểm
        </Link>

        {status === 'loading' && (
          <div className="flex items-center gap-2 py-16 text-sm text-[var(--color-text-muted)]">
            <LoadingSpinner size="md" className="text-[var(--color-primary-dark)]" />
            Đang tải thông tin địa điểm...
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <span className="text-sm text-red-600">{errorMessage || 'Không thể tải thông tin địa điểm'}</span>
            <button id="place-detail-retry" type="button" onClick={load} className="shrink-0 text-xs font-semibold text-[var(--color-primary-darker)] hover:underline">
              Thử lại
            </button>
          </div>
        )}

        {status === 'success' && place && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-[var(--color-surface)]">
                {heroImage && (
                  <Image src={heroImage} alt={place.name} fill sizes="(max-width: 1024px) 100vw, 640px" className="object-cover" priority />
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h1 className="text-2xl font-bold text-[var(--color-text)]">{place.name}</h1>
                  {place.address && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]">
                      <MapPinIcon className="h-4 w-4 shrink-0" />
                      {place.address}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {place.ratingCount > 0 && (
                    <span className="rounded-full bg-[var(--color-primary-lightest)] px-3 py-1 text-sm font-semibold text-[var(--color-primary-darker)]">
                      {place.ratingAvg.toFixed(1)}/5 · {place.ratingCount} đánh giá
                    </span>
                  )}
                  {[...new Set(place.tags.map(getPlaceTypeLabel).filter((label) => label !== 'Địa điểm'))].slice(0, 4).map((label) => (
                    <span key={label} className="rounded-full border border-[var(--color-border)] px-3 py-1 text-sm font-semibold text-[var(--color-text-secondary)]">
                      {label}
                    </span>
                  ))}
                </div>

                {details.weather && (
                  <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
                    <WeatherIcon code={details.weather.weathercode} className="h-8 w-8 text-[var(--color-primary-dark)]" />
                    <div>
                      <div className="text-sm font-bold text-[var(--color-text)]">
                        {Math.round(details.weather.temperature)}°C · {details.weather.description}
                      </div>
                      <div className="text-xs text-[var(--color-text-muted)]">Thời tiết hiện tại tại khu vực</div>
                    </div>
                  </div>
                )}

                {place.openingHours && (
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
                    <div className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">Giờ mở cửa</div>
                    <div className="mt-0.5 text-sm text-[var(--color-text)]">{place.openingHours}</div>
                  </div>
                )}

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    id={`place-${place.id}-add-to-trip`}
                    type="button"
                    onClick={() => (user ? setAddToTripOpen(true) : (window.location.href = `${ROUTES.home}?auth=login`))}
                    className="flex-1 rounded-lg bg-[var(--color-primary-darker)] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--color-primary-dark)]"
                  >
                    Thêm vào chuyến đi
                  </button>
                  <button
                    id={`place-${place.id}-save-favorite`}
                    type="button"
                    onClick={handleSaveFavorite}
                    disabled={favoriteSaving}
                    className="flex-1 rounded-lg border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-bold text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary-dark)] hover:text-[var(--color-primary-darker)] disabled:opacity-50"
                  >
                    {favoriteSaving ? 'Đang lưu...' : 'Lưu yêu thích'}
                  </button>
                </div>

                <a
                  id={`place-${place.id}-map`}
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-bold text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary-dark)] hover:text-[var(--color-primary-darker)]"
                >
                  Xem trên bản đồ
                </a>
              </div>
            </div>

            <section aria-label="Đánh giá địa điểm" className="space-y-4">
              <h2 className="text-lg font-bold text-[var(--color-text)]">Đánh giá ({reviews.length})</h2>

              {reviews.length > 0 ? (
                <ul className="space-y-3">
                  {reviews.map((review) => (
                    <li key={review.id} className="rounded-xl border border-[var(--color-border)] bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-bold text-[var(--color-text)]">{review.authorName}</span>
                        <span className="text-xs text-[var(--color-text-muted)]">{formatReviewDate(review.createdAt)}</span>
                      </div>
                      <div className="mt-1"><StarRow rating={review.rating} /></div>
                      {review.comment && <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{review.comment}</p>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-xl border border-dashed border-[var(--color-border-strong)] bg-white px-4 py-6 text-center text-sm text-[var(--color-text-muted)]">
                  Chưa có đánh giá nào. Hãy là người đầu tiên chia sẻ trải nghiệm của bạn.
                </p>
              )}

              <form onSubmit={handleSubmitReview} className="rounded-xl border border-[var(--color-border)] bg-white p-4">
                <h3 className="text-sm font-bold text-[var(--color-text)]">Viết đánh giá</h3>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start">
                  <label className="flex shrink-0 flex-col gap-1 text-xs font-semibold text-[var(--color-text-secondary)]">
                    Số sao
                    <select
                      id="place-review-rating"
                      value={reviewRating}
                      onChange={(event) => setReviewRating(Number(event.target.value))}
                      className="app-select rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-primary-dark)]"
                    >
                      {[5, 4, 3, 2, 1].map((value) => (
                        <option key={value} value={value}>{value} sao</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-semibold text-[var(--color-text-secondary)]">
                    Cảm nhận của bạn
                    <textarea
                      id="place-review-comment"
                      value={reviewComment}
                      onChange={(event) => setReviewComment(event.target.value)}
                      rows={2}
                      placeholder="Chia sẻ trải nghiệm tại địa điểm này..."
                      className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-primary-dark)]"
                    />
                  </label>
                  <button
                    id="place-review-submit"
                    type="submit"
                    disabled={reviewSaving}
                    className="shrink-0 rounded-lg bg-[var(--color-primary-darker)] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[var(--color-primary-dark)] disabled:opacity-50 sm:mt-5"
                  >
                    {reviewSaving ? 'Đang gửi...' : user ? 'Gửi đánh giá' : 'Đăng nhập để đánh giá'}
                  </button>
                </div>
              </form>
            </section>

            {details.pois.filter((poi) => poi.name !== place.name).length > 0 && (
              <section aria-label="Địa danh lân cận">
                <h2 className="mb-3 text-lg font-bold text-[var(--color-text)]">Địa danh lân cận</h2>
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {details.pois.filter((poi) => poi.name !== place.name).slice(0, 6).map((poi) => (
                    <li key={poi.id} className="rounded-xl border border-[var(--color-border)] bg-white p-4">
                      <div className="truncate text-sm font-bold text-[var(--color-text)]">{poi.name}</div>
                      {poi.address && <div className="mt-1 truncate text-xs text-[var(--color-text-muted)]">{poi.address}</div>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </main>

      {addToTripOpen && place && (
        <AddToTripModal
          isOpen={addToTripOpen}
          placeName={place.name}
          placeId={place.id}
          onClose={() => setAddToTripOpen(false)}
        />
      )}
    </div>
  );
}
