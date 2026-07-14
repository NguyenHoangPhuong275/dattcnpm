'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { SearchResult } from '@/hooks/usePlaceSearch';
import type { UsePlaceDetailsReturn } from '@/hooks/usePlaceDetails';
import type { TripSummary } from '@/types/profile';
import { getPlaceTypeLabel } from '@/lib/place-labels';
import { apiRequest } from '@/lib/api-client';

interface PlaceDetailPanelProps {
  selectedPlace: SearchResult;
  details: UsePlaceDetailsReturn;
  myTrips: TripSummary[];
  isLoggedIn: boolean;
  isTripsLoading?: boolean;
  isTripActionLoading: boolean;
  onCreateTripFromPlace: (place: SearchResult) => Promise<void>;
  onLogin: () => void;
  onOpenAddToTripModal: (place: SearchResult) => void;
}

export default function PlaceDetailPanel({
  selectedPlace,
  details,
  myTrips,
  isLoggedIn,
  isTripsLoading = false,
  isTripActionLoading,
  onCreateTripFromPlace,
  onLogin,
  onOpenAddToTripModal,
}: PlaceDetailPanelProps) {
  const { pois, isPoisLoading, weather } = details;
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [poiWeather, setPoiWeather] = useState<Record<string, number>>({});
  const [lookupFailure, setLookupFailure] = useState<{ placeId: string; message: string } | null>(null);
  const lookupError = lookupFailure?.placeId === selectedPlace._id ? lookupFailure.message : null;

  useEffect(() => {
    if (pois.length === 0) return;
    const controller = new AbortController();

    const fetchPoiWeathers = async () => {
      const weatherMap: Record<string, number> = {};
      await Promise.all(
        pois.map(async (poi) => {
          if (poi.lat === undefined || poi.lng === undefined) return;
          try {
            const { response, data } = await apiRequest<{ success: boolean; data: { weather?: { temperature: number } } }>(
              `/api/weather?lat=${poi.lat}&lng=${poi.lng}`,
              { signal: controller.signal }
            );
            if (response.ok && data.data?.weather) {
              weatherMap[poi.id] = data.data.weather.temperature;
            }
          } catch { }
        })
      );
      if (!controller.signal.aborted) {
        setPoiWeather(weatherMap);
      }
    };

    fetchPoiWeathers();

    return () => controller.abort();
  }, [pois]);

  const handleAction = async (
    poi: { name: string; type: string; address?: string },
    type: 'add' | 'create',
  ): Promise<void> => {
    if (!isLoggedIn) {
      onLogin();
      return;
    }
    setLookupFailure(null);
    setProcessingId(poi.name);
    try {
      const { response, data } = await apiRequest<{ success: boolean; data: { results: SearchResult[] } }>(
        `/api/places/search?q=${encodeURIComponent(poi.name)}`
      );
      if (!response.ok) {
        setLookupFailure({
          placeId: selectedPlace._id,
          message: 'Không thể tải thông tin địa điểm này. Vui lòng thử lại sau.',
        });
        return;
      }

      const place = data.data?.results?.[0];
      if (!place) {
        setLookupFailure({
          placeId: selectedPlace._id,
          message: 'Chưa tìm thấy thông tin chi tiết cho địa điểm này. Vui lòng chọn địa điểm khác.',
        });
        return;
      }

      if (type === 'add') {
        onOpenAddToTripModal(place);
      } else if (type === 'create') {
        await onCreateTripFromPlace(place);
      }
    } catch {
      setLookupFailure({
        placeId: selectedPlace._id,
        message: 'Không thể tải thông tin địa điểm này. Vui lòng thử lại sau.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewDetails = async (
    poi: { name: string; type: string; address?: string },
  ): Promise<void> => {
    setLookupFailure(null);
    setProcessingId(poi.name);
    try {
      const { response, data } = await apiRequest<{ success: boolean; data: { results: SearchResult[] } }>(
        `/api/places/search?q=${encodeURIComponent(poi.name)}`
      );
      if (!response.ok) {
        setLookupFailure({
          placeId: selectedPlace._id,
          message: 'Không thể tải thông tin địa điểm này. Vui lòng thử lại sau.',
        });
        return;
      }

      const place = data.data?.results?.[0];
      if (!place) {
        setLookupFailure({
          placeId: selectedPlace._id,
          message: 'Chưa tìm thấy thông tin chi tiết cho địa điểm này. Vui lòng chọn địa điểm khác.',
        });
        return;
      }

      window.location.href = `/places/${place._id}`;
    } catch {
      setLookupFailure({
        placeId: selectedPlace._id,
        message: 'Không thể tải thông tin địa điểm này. Vui lòng thử lại sau.',
      });
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

        {lookupError && (
          <div
            id="place-detail-lookup-error"
            role="alert"
            className="rounded-2xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 px-4 py-3 text-sm font-semibold text-[var(--color-danger)]"
          >
            {lookupError}
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
            {filteredPois.map((poi, index) => {
              const isProcessing = processingId === poi.name;
              const hasNoTrips = myTrips.length === 0;
              const detailUrl = poi.id && !/^\d+$/.test(poi.id) && !poi.id.startsWith('node:') && !poi.id.startsWith('way:')
                ? `/destinations/${poi.id}`
                : null;

              return (
                <div key={poi.id} className="flex flex-col justify-between rounded-2xl border border-[var(--color-border)] bg-white p-5 transition hover:border-[var(--color-border-strong)] hover:shadow-md">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        {detailUrl ? (
                          <Link
                            id={`place-detail-${index}-link`}
                            href={detailUrl}
                            className="text-base font-bold text-[var(--color-text)] hover:text-[var(--color-primary-darker)] hover:underline line-clamp-1 block"
                          >
                            {poi.name}
                          </Link>
                        ) : (
                          <button
                            id={`place-detail-${index}-view`}
                            type="button"
                            onClick={() => handleViewDetails(poi)}
                            disabled={isProcessing}
                            className="text-left text-base font-bold text-[var(--color-text)] hover:text-[var(--color-primary-darker)] hover:underline line-clamp-1 block w-full outline-none disabled:opacity-85"
                          >
                            {poi.name}
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {(poiWeather[poi.id] !== undefined || weather?.temperature !== undefined) && (
                          <div className="text-xs font-bold text-[var(--color-text-secondary)] bg-[var(--color-bg)] px-2 py-0.5 rounded-full flex items-center">
                            <span>{poiWeather[poi.id] !== undefined ? poiWeather[poi.id] : weather?.temperature}°C</span>
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
                        id={`place-detail-${index}-create`}
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
                          id={`place-detail-${index}-add`}
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
                          id={`place-detail-${index}-create`}
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
