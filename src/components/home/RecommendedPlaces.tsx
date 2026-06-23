'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPinIcon } from '@/components/icons';
import { apiRequest } from '@/lib/api-client';

interface RecommendedPlace {
  id: string;
  name: string;
  type: string;
  address: string | null;
  tags: string[];
  ratingAvg: number;
  ratingCount: number;
}

interface RecommendedPayload {
  data?: RecommendedPlace[];
  personalized?: boolean;
}

interface RecommendedResponse {
  success?: boolean;
  data?: RecommendedPayload;
}

type Status = 'loading' | 'success' | 'error';

const PREFERENCES_LINK = '/profile?tab=preferences';

export default function RecommendedPlaces(): React.JSX.Element {
  const [status, setStatus] = useState<Status>('loading');
  const [places, setPlaces] = useState<RecommendedPlace[]>([]);
  const [personalized, setPersonalized] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    setStatus('loading');
    try {
      const { response, data } = await apiRequest<RecommendedResponse>('/api/places/recommended?limit=8');
      if (!response.ok || data.success === false) {
        setStatus('error');
        return;
      }
      const payload = data.data;
      setPlaces(Array.isArray(payload?.data) ? payload.data : []);
      setPersonalized(Boolean(payload?.personalized));
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="w-full px-4 pb-12 sm:px-6 lg:px-8 xl:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-extrabold text-[var(--color-text)] sm:text-2xl">Gợi ý cho bạn</h2>
            <p className="text-sm font-medium text-[var(--color-text-muted)]">Địa điểm phù hợp dựa trên sở thích du lịch của bạn.</p>
          </div>
          {status === 'success' && !personalized && places.length > 0 && (
            <Link
              href={PREFERENCES_LINK}
              className="shrink-0 rounded-full border border-[var(--color-border)] px-4 py-2 text-xs font-bold text-[var(--color-primary-darker)] transition hover:bg-[var(--color-primary-lightest)]"
            >
              Cập nhật sở thích
            </Link>
          )}
        </div>

        {status === 'loading' && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((key) => (
              <div key={key} className="h-28 animate-pulse rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]" />
            ))}
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-10 text-center">
            <p className="text-sm font-semibold text-[var(--color-text-secondary)]">Không thể tải gợi ý lúc này</p>
            <button
              type="button"
              onClick={load}
              className="rounded-full bg-[var(--color-primary-darker)] px-5 py-2 text-sm font-bold text-white transition hover:bg-[var(--color-primary-dark)]"
            >
              Thử lại
            </button>
          </div>
        )}

        {status === 'success' && places.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-10 text-center">
            <p className="text-sm font-semibold text-[var(--color-text-secondary)]">Cập nhật sở thích để nhận gợi ý phù hợp</p>
            <Link
              href={PREFERENCES_LINK}
              className="rounded-full bg-[var(--color-primary-darker)] px-5 py-2 text-sm font-bold text-white transition hover:bg-[var(--color-primary-dark)]"
            >
              Cập nhật sở thích
            </Link>
          </div>
        )}

        {status === 'success' && places.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {places.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function PlaceCard({ place }: { place: RecommendedPlace }): React.JSX.Element {
  return (
    <Link
      href={`/?q=${encodeURIComponent(place.name)}`}
      className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition hover:border-[var(--color-primary-dark)] hover:shadow-sm"
    >
      <div className="flex items-start gap-2">
        <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary-darker)]" />
        <div className="min-w-0">
          <div className="truncate font-semibold text-[var(--color-text)]">{place.name}</div>
          {place.address && place.address !== place.name && (
            <div className="truncate text-sm text-[var(--color-text-muted)]">{place.address}</div>
          )}
        </div>
      </div>
      {place.ratingCount > 0 && (
        <div className="mt-3 text-sm font-bold text-[var(--color-primary-darker)]">
          {place.ratingAvg.toFixed(1)} sao
          <span className="ml-1 font-medium text-[var(--color-text-muted)]">({place.ratingCount} đánh giá)</span>
        </div>
      )}
    </Link>
  );
}
