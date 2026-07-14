'use client';

import { Suspense, useCallback, useEffect, useId, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import HotelSuggestions from '@/components/hotels/HotelSuggestions';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { apiRequest, ensureApiSuccess, getApiErrorMessage, type ApiEnvelope } from '@/lib/api-client';

export default function HotelsPage(): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <HotelsPageContent />
    </Suspense>
  );
}

const AREA_IMAGES: Record<string, string> = {
  'TP. Hồ Chí Minh': '/images/tphcm.png',
  'Hà Nội': '/images/hanoi_temple.jpg',
  'Đà Nẵng': '/images/danang.png',
  'Quảng Nam': '/images/hoian.png',
  'Lâm Đồng': '/images/dalat.png',
  'Khánh Hòa': '/images/nhatrang.png',
  'Lào Cai': '/images/laocai.png',
  'Thừa Thiên Huế': '/images/hue.jpg',
  'Quảng Ninh': '/images/halongbay.png',
};

interface HotelArea {
  province: string;
  count: number;
  avgRating: number | null;
  budget: number;
  mid: number;
  luxury: number;
}

function HotelAreaCard({ area, onSelect }: { area: HotelArea; onSelect: (name: string) => void }): React.JSX.Element {
  const idPrefix = `hotel-area-${useId().replace(/:/g, '')}`;
  const image = AREA_IMAGES[area.province];
  return (
    <button
      id={`${idPrefix}-${encodeURIComponent(area.province)}`}
      type="button"
      onClick={() => onSelect(area.province)}
      aria-label={`Xem khách sạn tại ${area.province}`}
      className="group relative h-48 overflow-hidden rounded-2xl border border-[var(--color-border)] text-left shadow-sm transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
    >
      {image ? (
        <Image
          src={image}
          alt={area.province}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <span className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary-dark)] to-[var(--color-primary-darker)]" />
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-300 group-hover:opacity-0" />

      <span className="absolute bottom-4 left-5 right-5 transition-all duration-300 group-hover:translate-y-2 group-hover:opacity-0">
        <span className="block truncate text-2xl font-extrabold text-white drop-shadow">{area.province}</span>
      </span>

      <span className="absolute inset-0 flex flex-col justify-end bg-black/70 p-5 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
        <span className="block text-xl font-extrabold text-white">{area.province}</span>
        <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/90">
          <span className="font-bold tabular-nums">{area.count} khách sạn</span>
          {area.avgRating !== null && (
            <span className="tabular-nums">★ {area.avgRating.toFixed(1)} trung bình</span>
          )}
        </span>
        <span className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold">
          {area.budget > 0 && (
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-white tabular-nums">Tiết kiệm {area.budget}</span>
          )}
          {area.mid > 0 && (
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-white tabular-nums">Trung bình {area.mid}</span>
          )}
          {area.luxury > 0 && (
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-white tabular-nums">Cao cấp {area.luxury}</span>
          )}
        </span>
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-white">Xem danh sách</span>
      </span>
    </button>
  );
}

function HotelAreaDirectory({ onSelect }: { onSelect: (name: string) => void }): React.JSX.Element {
  const idPrefix = `hotel-area-directory-${useId().replace(/:/g, '')}`;
  const [areas, setAreas] = useState<HotelArea[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const load = useCallback(async (): Promise<void> => {
    setStatus('loading');
    setErrorMessage('');
    try {
      const { response, data } = await apiRequest<ApiEnvelope<HotelArea[]>>('/api/hotels/areas');
      ensureApiSuccess(response, data, 'Không thể tải danh sách khu vực');
      setAreas(Array.isArray(data.data) ? data.data : []);
      setStatus('success');
    } catch (error: unknown) {
      setErrorMessage(getApiErrorMessage(error, 'Không thể tải danh sách khu vực'));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section aria-label="Chọn khu vực xem khách sạn" className="space-y-6">
      {status === 'loading' && (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-[var(--color-text-muted)]">
          <LoadingSpinner size="md" className="text-[var(--color-primary-dark)]" />
          Đang tải khu vực...
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <span className="text-sm text-red-600">{errorMessage}</span>
          <button id={`${idPrefix}-retry`} type="button" onClick={load} className="shrink-0 text-xs font-semibold text-[var(--color-primary-darker)] hover:underline">
            Thử lại
          </button>
        </div>
      )}

      {status === 'success' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((area) => (
            <HotelAreaCard key={area.province} area={area} onSelect={onSelect} />
          ))}
        </div>
      )}
    </section>
  );
}

function HotelsPageContent(): React.JSX.Element {
  const searchParams = useSearchParams();
  const initialQuery = (searchParams.get('q') ?? '').trim();
  const [destination, setDestination] = useState<string>(initialQuery);

  const clear = (): void => {
    setDestination('');
  };

  const selectDestination = (value: string): void => {
    setDestination(value);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <AppHeader active="hotels" showSearch={false} />

      <main className="mx-auto w-full max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
        {destination ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <button
                id="hotels-clear-destination"
                type="button"
                onClick={clear}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] shadow-sm transition-colors hover:bg-[var(--color-primary-lightest)] hover:text-[var(--color-primary-darker)]"
              >
                Quay lại danh sách khu vực
              </button>
              <h2 className="text-xl font-extrabold text-[var(--color-text)]">
                Khách sạn tại {destination}
              </h2>
            </div>
            <HotelSuggestions destination={destination} limit={24} showFilters />
          </div>
        ) : (
          <HotelAreaDirectory onSelect={selectDestination} />
        )}
      </main>
    </div>
  );
}
