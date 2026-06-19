'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiRequest, ensureApiSuccess, getApiErrorMessage } from '@/lib/api-client';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export interface HotelResult {
  id: string;
  name: string;
  province: string | null;
  district: string | null;
  address: string | null;
  rating: number | null;
  priceLevel: 'budget' | 'mid' | 'luxury' | null;
}

interface HotelSearchData {
  data: HotelResult[];
  total: number;
  page: number;
  totalPages: number;
  matchedBy: string;
}

interface ApiResponse {
  success?: boolean;
  data?: HotelSearchData;
  message?: string;
}

interface HotelSuggestionsProps {
  destination?: string | null;
  province?: string | null;
  lat?: number | null;
  lng?: number | null;
  limit?: number;
  onSelect?: (hotel: HotelResult) => Promise<void> | void;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

const PRICE_LABELS: Record<NonNullable<HotelResult['priceLevel']>, string> = {
  budget: 'Tiết kiệm',
  mid: 'Trung bình',
  luxury: 'Cao cấp',
};

type HotelFilters = {
  priceLevel: HotelResult['priceLevel'];
  minRating: number | null;
};

function buildQuery(props: HotelSuggestionsProps, page: number, filters: HotelFilters): string {
  const params = new URLSearchParams();
  if (props.destination) params.set('destination', props.destination);
  if (props.province) params.set('province', props.province);
  if (typeof props.lat === 'number' && typeof props.lng === 'number') {
    params.set('lat', String(props.lat));
    params.set('lng', String(props.lng));
  }
  if (props.limit) params.set('limit', String(props.limit));
  if (filters.priceLevel) params.set('priceLevel', filters.priceLevel);
  if (typeof filters.minRating === 'number') params.set('minRating', String(filters.minRating));
  params.set('page', String(page));
  return params.toString();
}

export default function HotelSuggestions(props: HotelSuggestionsProps): React.JSX.Element {
  const { destination, province, lat, lng, limit, onSelect } = props;
  const [status, setStatus] = useState<Status>('idle');
  const [hotels, setHotels] = useState<HotelResult[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [priceFilter, setPriceFilter] = useState<HotelResult['priceLevel']>(null);
  const [ratingFilter, setRatingFilter] = useState(false);
  const lastQueryRef = useRef('');

  useEffect(() => {
    setPage(1);
  }, [destination, province, lat, lng, priceFilter, ratingFilter]);

  const handleSelect = async (hotel: HotelResult): Promise<void> => {
    if (!onSelect || savingId) return;
    setSavingId(hotel.id);
    try {
      await onSelect(hotel);
    } finally {
      setSavingId(null);
    }
  };

  const hasCriteria = Boolean(destination) || Boolean(province) || (typeof lat === 'number' && typeof lng === 'number');

  const load = useCallback(async (signal?: AbortSignal): Promise<void> => {
    const hasQueryCriteria = Boolean(destination) || Boolean(province) || (typeof lat === 'number' && typeof lng === 'number');
    const filters: HotelFilters = { priceLevel: priceFilter, minRating: ratingFilter ? 3 : null };
    const query = hasQueryCriteria ? buildQuery({ destination, province, lat, lng, limit }, page, filters) : '';
    lastQueryRef.current = query;
    if (!query) {
      if (!signal?.aborted) {
        setStatus('idle');
        setHotels([]);
        setTotal(0);
        setTotalPages(0);
      }
      return;
    }
    setStatus('loading');
    setErrorMessage('');
    try {
      const { response, data } = await apiRequest<ApiResponse>(`/api/hotels/search?${query}`, { signal });
      if (signal?.aborted || lastQueryRef.current !== query) return;
      try {
        ensureApiSuccess(response, data, 'Không thể tải danh sách khách sạn');
      } catch {
        setErrorMessage(getApiErrorMessage(data, 'Không thể tải danh sách khách sạn'));
        setStatus('error');
        return;
      }
      setHotels(Array.isArray(data.data?.data) ? data.data.data : []);
      setTotal(typeof data.data?.total === 'number' ? data.data.total : 0);
      setTotalPages(typeof data.data?.totalPages === 'number' ? data.data.totalPages : 0);
      setStatus('success');
    } catch {
      if (signal?.aborted || lastQueryRef.current !== query) return;
      setErrorMessage('Không thể tải danh sách khách sạn');
      setStatus('error');
    }
  }, [destination, province, lat, lng, limit, page, priceFilter, ratingFilter]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  if (!hasCriteria) {
    return (
      <div className="text-sm text-[var(--color-text-muted)]">
        Nhập điểm đến hoặc tỉnh/thành để tìm khách sạn phù hợp.
      </div>
    );
  }

  const priceChips: { value: NonNullable<HotelResult['priceLevel']>; label: string }[] = [
    { value: 'budget', label: 'Tiết kiệm' },
    { value: 'mid', label: 'Trung bình' },
    { value: 'luxury', label: 'Cao cấp' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {priceChips.map((chip) => {
          const active = priceFilter === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              aria-pressed={active}
              onClick={() => setPriceFilter(active ? null : chip.value)}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                active
                  ? 'border-[var(--color-primary-darker)] bg-[var(--color-primary-lightest)] text-[var(--color-primary-darker)]'
                  : 'border-[var(--color-border)] bg-white text-[var(--color-text)]'
              }`}
            >
              {chip.label}
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={ratingFilter}
          onClick={() => setRatingFilter((prev) => !prev)}
          className={`rounded-full border px-3 py-1 text-xs font-medium ${
            ratingFilter
              ? 'border-[var(--color-primary-darker)] bg-[var(--color-primary-lightest)] text-[var(--color-primary-darker)]'
              : 'border-[var(--color-border)] bg-white text-[var(--color-text)]'
          }`}
        >
          ★ Từ 3 sao
        </button>
      </div>

      {status === 'loading' && (
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <LoadingSpinner size="sm" className="text-[var(--color-primary-dark)]" />
          Đang tìm khách sạn...
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-3 py-2">
          <span className="text-sm text-[var(--color-danger)]">{errorMessage || 'Không thể tải danh sách khách sạn'}</span>
          <button type="button" onClick={() => load()} className="shrink-0 text-xs font-semibold text-[var(--color-primary-darker)] hover:underline">
            Thử lại
          </button>
        </div>
      )}

      {status === 'success' && hotels.length === 0 && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-4 text-sm text-[var(--color-text-muted)]">
          Chưa tìm thấy khách sạn phù hợp tại khu vực này.
        </div>
      )}

      {status === 'success' && hotels.length > 0 && (
        <div className="text-xs font-semibold text-[var(--color-text-secondary)]">
          Tìm thấy {total} khách sạn{totalPages > 1 ? ` · Trang ${page}/${totalPages}` : ''}
        </div>
      )}

      {status === 'success' && hotels.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {hotels.map((hotel) => (
            <div key={hotel.id} className="flex flex-col gap-1.5 rounded-xl border border-[var(--color-border)] bg-white px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 break-words font-semibold text-sm text-[var(--color-text)]">{hotel.name}</div>
                {typeof hotel.rating === 'number' && hotel.rating > 0 && (
                  <span className="shrink-0 text-xs font-bold text-[var(--color-warning,#d97706)]">★ {hotel.rating}</span>
                )}
              </div>
              <div className="text-xs text-[var(--color-text-muted)] break-words">
                {[hotel.district, hotel.province].filter(Boolean).join(', ') || 'Chưa rõ khu vực'}
              </div>
              {hotel.address && (
                <div className="text-xs text-[var(--color-text-muted)] break-words">{hotel.address}</div>
              )}
              {hotel.priceLevel && (
                <span className="mt-1 w-fit rounded-full bg-[var(--color-primary-lightest)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-primary-darker)]">
                  {PRICE_LABELS[hotel.priceLevel]}
                </span>
              )}
              {onSelect && (
                <button
                  type="button"
                  onClick={() => handleSelect(hotel)}
                  disabled={savingId === hotel.id}
                  className="mt-2 w-fit rounded-lg bg-[var(--color-primary-darker)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
                >
                  {savingId === hotel.id ? 'Đang lưu...' : 'Lưu vào chuyến đi'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {status === 'success' && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] disabled:opacity-40"
          >
            ← Trước
          </button>
          <span className="text-xs text-[var(--color-text-muted)]">Trang {page}/{totalPages}</span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] disabled:opacity-40"
          >
            Sau →
          </button>
        </div>
      )}
    </div>
  );
}
