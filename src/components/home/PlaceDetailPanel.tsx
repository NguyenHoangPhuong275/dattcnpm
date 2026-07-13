'use client';

import { useState } from 'react';
import { SearchResult } from '@/hooks/usePlaceSearch';
import { UsePlaceDetailsReturn } from '@/hooks/usePlaceDetails';
import { TripSummary } from '@/types/profile';
import { getPlaceTypeLabel } from '@/lib/place-labels';
import { apiRequest } from '@/lib/api-client';

interface PlaceDetailPanelProps {
  selectedPlace: SearchResult;
  details: UsePlaceDetailsReturn;
  myTrips: TripSummary[];
  isLoggedIn: boolean;
  isTripsLoading?: boolean;
  isTripActionLoading: boolean;
  tripActionMessage: string;
  onAddToTrip: (tripId: string, focusHotel?: boolean, place?: SearchResult) => void;
  onCreateTripFromPlace?: (place?: SearchResult) => void;
  onLogin: () => void;
  onOpenAddToTripModal?: (place?: SearchResult) => void;
  onSaveFavorite?: (place: SearchResult) => Promise<void>;
  favoriteSaving?: boolean;
  onCreateReview?: (payload: { placeId: string; rating: number; comment?: string }) => Promise<void>;
  reviewSaving?: boolean;
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
}: PlaceDetailPanelProps) {
  const { pois, isPoisLoading, weather } = details;
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAction = async (poi: { name: string; type: string; address?: string }, type: 'add' | 'create') => {
    if (!isLoggedIn) {
      onLogin();
      return;
    }
    setProcessingId(poi.name);
    try {
      const { response, data } = await apiRequest<{ success: boolean; data: { results: SearchResult[] } }>(
        `/api/places/search?q=${encodeURIComponent(poi.name)}`
      );
      if (response.ok && data.data?.results?.[0]) {
        const place = data.data.results[0];
        if (type === 'add') {
          onOpenAddToTripModal?.(place);
        } else if (type === 'create' && onCreateTripFromPlace) {
          await onCreateTripFromPlace(place);
        }
      }
    } catch {
    } finally {
      setProcessingId(null);
    }
  };

  const filteredPois = pois.filter(
    (poi) => poi.name.toLowerCase() !== selectedPlace.name.toLowerCase()
  );

  return (
    <div className="app-surface mx-auto mb-12 mt-2 max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="space-y-6">
        <div>
          <h3 className="font-display text-xl font-extrabold text-[var(--color-text)]">
            Địa danh du lịch nổi bật tại khu vực này
          </h3>
          <p className="text-sm font-medium text-[var(--color-text-muted)] mt-1">
            Gợi ý các địa điểm du lịch nổi tiếng xung quanh {selectedPlace.name}. Chọn một địa điểm để lập lịch trình.
          </p>
        </div>

        {tripActionMessage && (
          <div className="rounded-2xl border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 px-4 py-3 text-sm font-semibold text-[var(--color-text-secondary)]">
            {tripActionMessage}
          </div>
        )}

        {isPoisLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="animate-pulse space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6">
                <div className="h-5 w-3/4 rounded bg-[var(--color-border)]" />
                <div className="h-4 w-1/4 rounded bg-[var(--color-border)]" />
                <div className="space-y-2 pt-2">
                  <div className="h-3 w-full rounded bg-[var(--color-border)]" />
                  <div className="h-3 w-5/6 rounded bg-[var(--color-border)]" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPois.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPois.map((poi) => {
              const isProcessing = processingId === poi.name;
              const hasNoTrips = myTrips.length === 0;

              return (
                <div key={poi.id} className="flex flex-col justify-between rounded-2xl border border-[var(--color-border)] bg-white p-5 transition hover:border-[var(--color-border-strong)] hover:shadow-md">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-base font-bold text-[var(--color-text)] line-clamp-1">{poi.name}</div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {weather && (
                          <div className="text-xs font-bold text-[var(--color-text-secondary)] bg-[var(--color-bg)] px-2 py-0.5 rounded-full flex items-center">
                            <span>{weather.temperature}°C</span>
                          </div>
                        )}
                        {poi.rating && (
                          <div className="flex items-center gap-0.5 text-xs font-bold text-[var(--color-warning)] bg-[var(--color-primary-lightest)] px-2 py-0.5 rounded-full">
                            <svg className="h-3 w-3 fill-current text-[var(--color-warning)]" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span>{poi.rating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs font-extrabold uppercase tracking-wide text-[var(--color-success)]">
                      {getPlaceTypeLabel(poi.type)}
                    </div>
                    {poi.description && (
                      <div className="line-clamp-3 text-xs font-medium text-[var(--color-text-muted)] leading-relaxed">
                        {poi.description}
                      </div>
                    )}
                    {poi.address && poi.address !== 'Xung quanh khu vực này' && (
                      <div className="truncate text-xs font-medium text-[var(--color-text-muted)] pt-1">
                        {poi.address}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 border-t border-[var(--color-border)] pt-4 flex gap-2">
                    {hasNoTrips ? (
                      <button
                        type="button"
                        onClick={() => handleAction(poi, 'create')}
                        disabled={isProcessing || isTripsLoading || isTripActionLoading}
                        className="flex-1 min-h-10 rounded-xl bg-[var(--color-primary-darker)] text-xs font-bold text-white transition hover:bg-[var(--color-primary-dark)] disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {isProcessing ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          'Tạo chuyến đi mới'
                        )}
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleAction(poi, 'add')}
                          disabled={isProcessing || isTripsLoading || isTripActionLoading}
                          className="flex-1 min-h-10 rounded-xl bg-[var(--color-primary-darker)] text-xs font-bold text-white transition hover:bg-[var(--color-primary-dark)] disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                          {isProcessing ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : (
                            'Thêm vào chuyến đi'
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAction(poi, 'create')}
                          disabled={isProcessing || isTripsLoading || isTripActionLoading}
                          className="px-3 min-h-10 rounded-xl border border-[var(--color-border)] text-xs font-bold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg)] disabled:opacity-60 flex items-center justify-center"
                        >
                          Tạo mới
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--color-border)] py-12 text-center text-sm font-medium text-[var(--color-text-muted)] bg-[var(--color-bg)]">
            Không tìm thấy địa danh du lịch nổi bật nào xung quanh khu vực này.
          </div>
        )}
      </div>
    </div>
  );
}
