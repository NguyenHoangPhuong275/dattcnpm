'use client';

import { useState } from 'react';
import * as Icons from '@/components/icons';
import { SearchResult } from '@/hooks/usePlaceSearch';
import { UsePlaceDetailsReturn } from '@/hooks/usePlaceDetails';
import { TripSummary } from '@/types/profile';
import EmptyState from '@/components/ui/EmptyState';

interface PlaceDetailPanelProps {
  selectedPlace: SearchResult;
  details: UsePlaceDetailsReturn;
  myTrips: TripSummary[];
  isLoggedIn: boolean;
  isTripsLoading?: boolean;
  isTripActionLoading: boolean;
  tripActionMessage: string;
  onAddToTrip: (tripId: string) => void;
  onCreateTripFromPlace?: () => void;
  onLogin: () => void;
  onOpenAddToTripModal?: (place?: SearchResult) => void;
  onSaveFavorite?: (place: SearchResult) => Promise<void>;
  favoriteSaving?: boolean;
  onCreateReview?: (payload: { placeId: string; rating: number; comment?: string }) => Promise<void>;
  reviewSaving?: boolean;
}

interface TripActionsProps {
  trips: TripSummary[];
  loading: boolean;
  listLoading: boolean;
  onAddToTrip: (tripId: string) => void;
  onCreateTripFromPlace?: () => void;
}

interface WeatherCardProps {
  weather: UsePlaceDetailsReturn['weather'];
  loading: boolean;
}

interface PoiGridProps {
  pois: UsePlaceDetailsReturn['pois'];
  loading: boolean;
}

export default function PlaceDetailPanel({
  selectedPlace,
  details,
  myTrips,
  isLoggedIn,
  isTripsLoading = false,
  isTripActionLoading,
  tripActionMessage,
  onAddToTrip,
  onCreateTripFromPlace,
  onLogin,
  onOpenAddToTripModal,
  onSaveFavorite,
  favoriteSaving = false,
  onCreateReview,
  reviewSaving = false,
}: PlaceDetailPanelProps) {
  const { weather, pois, isWeatherLoading, isPoisLoading } = details;
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const submitReview = async (): Promise<void> => {
    if (!onCreateReview) return;
    await onCreateReview({
      placeId: selectedPlace._id,
      rating: reviewRating,
      comment: reviewComment.trim() || undefined,
    });
    setReviewRating(5);
    setReviewComment('');
  };

  return (
    <div className="app-surface mx-auto mb-12 mt-2 max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-primary-darker)]">Điểm đến đã chọn</span>
            <h3 className="mt-1 font-display text-2xl font-extrabold text-[var(--color-text)]">{selectedPlace.name}</h3>
            {selectedPlace.address && (
              <p className="mt-1 text-sm font-medium text-[var(--color-text-muted)]">{selectedPlace.address}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {onOpenAddToTripModal && (
                <button
                  type="button"
                  aria-label={`Thêm ${selectedPlace.name} vào lịch trình`}
                  onClick={() => (isLoggedIn ? onOpenAddToTripModal(selectedPlace) : onLogin())}
                  className="inline-flex min-h-10 items-center rounded-2xl bg-[var(--color-primary-darker)] px-4 py-2 text-sm font-bold text-white transition hover:bg-[var(--color-primary-dark)]"
                >
                  + Thêm vào lịch trình
                </button>
              )}
              {onSaveFavorite && (
                <button
                  type="button"
                  aria-label={`Lưu ${selectedPlace.name} vào yêu thích`}
                  onClick={() => (isLoggedIn ? onSaveFavorite(selectedPlace) : onLogin())}
                  disabled={favoriteSaving}
                  className="inline-flex min-h-10 items-center rounded-2xl border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-bold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-primary-lightest)] disabled:opacity-60"
                >
                  {favoriteSaving ? 'Đang lưu...' : 'Lưu yêu thích'}
                </button>
              )}
            </div>
          </div>

          {tripActionMessage && (
            <div className="rounded-2xl border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 px-4 py-3 text-sm font-semibold text-[var(--color-text-secondary)]">
              {tripActionMessage}
            </div>
          )}

          {isLoggedIn ? (
            <TripActions
              trips={myTrips}
              loading={isTripActionLoading || isTripsLoading}
              listLoading={isTripsLoading}
              onAddToTrip={onAddToTrip}
              onCreateTripFromPlace={onCreateTripFromPlace}
            />
          ) : (
            <div className="border-t border-[var(--color-border)] pt-6">
              <button
                type="button"
                onClick={onLogin}
                className="min-h-12 w-full rounded-2xl border border-[var(--color-primary-dark)] px-4 py-3 text-sm font-bold text-[var(--color-primary-darker)] transition hover:bg-[var(--color-primary-lightest)]"
              >
                Đăng nhập để thêm vào chuyến đi
              </button>
            </div>
          )}

          <WeatherCard weather={weather} loading={isWeatherLoading} />

          {isLoggedIn && onCreateReview && (
            <div className="border-t border-[var(--color-border)] pt-6">
              <h4 className="mb-3 text-sm font-bold text-[var(--color-text)]">Đánh giá địa điểm</h4>
              <div className="space-y-3 rounded-2xl border border-[var(--color-border)] p-4">
                <select
                  value={reviewRating}
                  onChange={(event) => setReviewRating(Number(event.target.value))}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
                  aria-label="Điểm đánh giá"
                >
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <option key={rating} value={rating}>{rating}/5</option>
                  ))}
                </select>
                <textarea
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                  rows={3}
                  placeholder="Chia sẻ cảm nhận của bạn"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={submitReview}
                  disabled={reviewSaving}
                  className="min-h-10 w-full rounded-xl bg-[var(--color-primary-darker)] px-4 py-2 text-sm font-bold text-white transition hover:bg-[var(--color-primary-dark)] disabled:opacity-60"
                >
                  {reviewSaving ? 'Đang gửi...' : 'Gửi đánh giá'}
                </button>
              </div>
            </div>
          )}
        </div>

        <PoiGrid pois={pois} loading={isPoisLoading} />
      </div>
    </div>
  );
}

function TripActions({
  trips,
  loading,
  listLoading,
  onAddToTrip,
  onCreateTripFromPlace,
}: TripActionsProps) {
  return (
    <div className="space-y-4 border-t border-[var(--color-border)] pt-6">
      {listLoading ? (
        <div className="space-y-3" role="status" aria-label="Đang tải chuyến đi">
          <div className="h-4 w-40 animate-pulse rounded bg-[var(--color-bg)]" />
          {[1, 2].map((item) => (
            <div key={item} className="h-14 animate-pulse rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]" />
          ))}
        </div>
      ) : trips.length > 0 ? (
        <>
          <h4 className="flex items-center gap-2 text-sm font-bold text-[var(--color-text)]">
            <Icons.PlusIcon className="h-4 w-4 text-[var(--color-primary-darker)]" />
            Thêm vào chuyến đi của bạn
          </h4>
          <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
            {trips.map((trip) => (
              <button
                key={trip._id}
                type="button"
                onClick={() => onAddToTrip(trip._id)}
                disabled={loading}
                className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] px-4 py-3 text-left text-sm transition hover:border-[var(--color-primary-dark)] hover:bg-[var(--color-bg)] disabled:opacity-60"
              >
                <span className="min-w-0">
                  <span className="block truncate font-bold text-[var(--color-text)]">{trip.title}</span>
                  <span className="block truncate text-xs font-medium text-[var(--color-text-muted)]">{trip.destination}</span>
                </span>
                <span className="shrink-0 text-xs font-extrabold text-[var(--color-primary-dark)]">Thêm</span>
              </button>
            ))}
          </div>

          {onCreateTripFromPlace && (
            <button
              type="button"
              onClick={onCreateTripFromPlace}
              disabled={loading}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--color-border)] px-4 py-3 text-sm font-bold text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary-dark)] hover:bg-[var(--color-bg)] hover:text-[var(--color-primary-darker)] disabled:opacity-60"
            >
              <Icons.PlusIcon className="h-4 w-4" />
              Tạo chuyến đi mới cho địa điểm này
            </button>
          )}
        </>
      ) : (
        <div className="space-y-3">
          <EmptyState
            title="Chưa có chuyến đi nào"
            description="Tạo chuyến đi đầu tiên để thêm địa điểm này."
            {...(onCreateTripFromPlace ? {
              actionLabel: 'Tạo chuyến đi mới',
              onAction: onCreateTripFromPlace,
            } : {})}
          />
        </div>
      )}
    </div>
  );
}

function WeatherCard({ weather, loading }: WeatherCardProps) {
  return (
    <div className="border-t border-[var(--color-border)] pt-6">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--color-text)]">
        <Icons.WeatherIcon code={0} className="h-4 w-4 text-[var(--color-warning)]" />
        Thời tiết hiện tại
      </h4>

      {loading ? (
        <div className="flex animate-pulse items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-[var(--color-bg)]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-16 rounded bg-[var(--color-bg)]" />
            <div className="h-3 w-24 rounded bg-[var(--color-bg)]" />
          </div>
        </div>
      ) : weather ? (
        <div className="flex items-center gap-6 rounded-2xl bg-[var(--color-bg)] p-4">
          <Icons.WeatherIcon code={weather.weathercode} className="h-10 w-10 text-[var(--color-warning)]" />
          <div>
            <div className="text-2xl font-extrabold text-[var(--color-text)]">{weather.temperature}°C</div>
            <div className="text-sm font-bold text-[var(--color-text-muted)]">{weather.description}</div>
          </div>
        </div>
      ) : (
        <p className="text-sm font-medium text-[var(--color-text-muted)]">Không thể tải thông tin thời tiết lúc này.</p>
      )}
    </div>
  );
}

function PoiGrid({ pois, loading }: PoiGridProps) {
  return (
    <div className="border-t border-[var(--color-border)] pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
      <h4 className="mb-4 flex items-center gap-2 text-sm font-bold text-[var(--color-text)]">
        <Icons.MapPinIcon className="h-4 w-4 text-[var(--color-success)]" />
        Địa danh du lịch nổi bật
      </h4>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="animate-pulse space-y-3 rounded-2xl border border-[var(--color-border)] p-4">
              <div className="h-4 w-3/4 rounded bg-[var(--color-bg)]" />
              <div className="h-3 w-1/2 rounded bg-[var(--color-bg)]" />
            </div>
          ))}
        </div>
      ) : pois.length > 0 ? (
        <div className="grid max-h-[320px] grid-cols-1 gap-4 overflow-y-auto pr-2 sm:grid-cols-2">
          {pois.map((poi) => (
            <div key={poi.id} className="flex flex-col justify-between rounded-2xl border border-[var(--color-border)] p-4 transition hover:border-[var(--color-border-strong)] hover:shadow-sm">
              <div>
                <div className="line-clamp-2 text-sm font-bold text-[var(--color-text)]">{poi.name}</div>
                <div className="mt-1 text-xs font-extrabold uppercase tracking-wide text-[var(--color-success)]">{poi.type}</div>
                {poi.description && (
                  <div className="mt-2 line-clamp-2 text-xs font-medium text-[var(--color-text-muted)]">{poi.description}</div>
                )}
              </div>
              {poi.address && poi.address !== 'Xung quanh khu vực này' && (
                <div className="mt-2 truncate text-xs font-medium text-[var(--color-text-muted)]">{poi.address}</div>
              )}
              {poi.rating && <div className="mt-2 text-xs font-bold text-[var(--color-warning)]">{poi.rating}</div>}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-sm font-medium text-[var(--color-text-muted)]">
          Không tìm thấy địa danh du lịch nổi bật xung quanh khu vực này.
        </div>
      )}
    </div>
  );
}
