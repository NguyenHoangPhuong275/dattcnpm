'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { apiRequest, ensureApiSuccess } from '@/lib/api-client';
import { getHotelPhoto, estimateHotelPricePerNight, formatHotelPrice } from '@/lib/hotel-utils';
import HotelImage from '@/components/hotels/HotelImage';

export interface HotelResult {
  id: string;
  name: string;
  province: string | null;
  district: string | null;
  address: string | null;
  rating: number | null;
  priceLevel: 'budget' | 'mid' | 'luxury' | null;
  image: string | null;
  amenities?: string[];
  distanceKm?: number | null;
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
  featuredWhenEmpty?: boolean;
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
  amenities: string[];
};

const AMENITY_OPTIONS: { value: string; label: string }[] = [
  { value: 'wifi', label: 'Wifi' },
  { value: 'pool', label: 'Hồ bơi' },
  { value: 'parking', label: 'Bãi đỗ xe' },
  { value: 'ac', label: 'Điều hoà' },
  { value: 'restaurant', label: 'Nhà hàng' },
  { value: 'bar', label: 'Bar' },
];

const AMENITY_LABELS: Record<string, string> = Object.fromEntries(AMENITY_OPTIONS.map((item) => [item.value, item.label]));

function buildQuery(props: HotelSuggestionsProps, page: number, filters: HotelFilters, featured: boolean): string {
  const params = new URLSearchParams();
  if (featured) {
    params.set('featured', '1');
  } else {
    if (props.destination) params.set('destination', props.destination);
    if (props.province) params.set('province', props.province);
    if (typeof props.lat === 'number' && typeof props.lng === 'number') {
      params.set('lat', String(props.lat));
      params.set('lng', String(props.lng));
    }
  }
  if (props.limit) params.set('limit', String(props.limit));
  if (filters.priceLevel) params.set('priceLevel', filters.priceLevel);
  if (typeof filters.minRating === 'number') params.set('minRating', String(filters.minRating));
  if (filters.amenities.length > 0) params.set('amenities', filters.amenities.join(','));
  params.set('page', String(page));
  return params.toString();
}

function HotelCardSkeleton(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[var(--color-border)] bg-white p-3">
      <div className="aspect-[4/3] w-full animate-pulse rounded-lg bg-[var(--color-border)]" />
      <div className="h-3.5 w-3/4 animate-pulse rounded bg-[var(--color-border)]" />
      <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--color-border)]" />
      <div className="mt-1 flex gap-1.5">
        <div className="h-4 w-12 animate-pulse rounded-full bg-[var(--color-border)]" />
        <div className="h-4 w-14 animate-pulse rounded-full bg-[var(--color-border)]" />
      </div>
    </div>
  );
}

export default function HotelSuggestions(props: HotelSuggestionsProps): React.JSX.Element {
  const { destination, province, lat, lng, limit, featuredWhenEmpty, onSelect } = props;
  const [status, setStatus] = useState<Status>('idle');
  const [hotels, setHotels] = useState<HotelResult[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const lastQueryRef = useRef('');

  useEffect(() => {
    setPage(1);
  }, [destination, province, lat, lng]);

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
  const shouldLoad = hasCriteria || Boolean(featuredWhenEmpty);

  const load = useCallback(async (signal?: AbortSignal): Promise<void> => {
    const hasQueryCriteria = Boolean(destination) || Boolean(province) || (typeof lat === 'number' && typeof lng === 'number');
    const featured = !hasQueryCriteria && Boolean(featuredWhenEmpty);
    const filters: HotelFilters = { priceLevel: null, minRating: null, amenities: [] };
    const query = hasQueryCriteria || featured ? buildQuery({ destination, province, lat, lng, limit }, page, filters, featured) : '';
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
    try {
      const { response, data } = await apiRequest<ApiResponse>(`/api/hotels/search?${query}`, { signal });
      if (signal?.aborted || lastQueryRef.current !== query) return;
      try {
        ensureApiSuccess(response, data, 'Không thể tải danh sách khách sạn');
      } catch {
        setStatus('error');
        return;
      }
      setHotels(Array.isArray(data.data?.data) ? data.data.data : []);
      setTotal(typeof data.data?.total === 'number' ? data.data.total : 0);
      setTotalPages(typeof data.data?.totalPages === 'number' ? data.data.totalPages : 0);
      setStatus('success');
    } catch {
      if (signal?.aborted || lastQueryRef.current !== query) return;
      setStatus('error');
    }
  }, [destination, province, lat, lng, limit, page, featuredWhenEmpty]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  if (!shouldLoad) {
    return (
      <div className="text-sm text-[var(--color-text-muted)]">
        Nhập điểm đến để xem những khách sạn gợi ý cho bạn.
      </div>
    );
  }

  const isFeatured = !hasCriteria && Boolean(featuredWhenEmpty);

  return (
    <div className="space-y-3">
      {status === 'loading' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Đang tải khách sạn">
          {Array.from({ length: 6 }).map((_, index) => (
            <HotelCardSkeleton key={index} />
          ))}
        </div>
      )}

      {status === 'error' && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-white px-5 py-8 text-center">
          <p className="text-sm font-semibold text-[var(--color-text)]">Rất tiếc, chưa tải được danh sách lúc này</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">Vui lòng kiểm tra kết nối mạng rồi thử lại.</p>
          <button
            type="button"
            onClick={() => load()}
            className="mt-3 rounded-lg bg-[var(--color-primary-darker)] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
          >
            Thử lại
          </button>
        </div>
      )}

      {status === 'success' && hotels.length === 0 && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-white px-5 py-10 text-center">
          <p className="text-sm font-semibold text-[var(--color-text)]">Chưa tìm thấy khách sạn phù hợp</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">Hãy thử một điểm đến khác, hoặc xem các khách sạn nổi bật của chúng tôi.</p>
        </div>
      )}

      {status === 'success' && hotels.length > 0 && (
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold text-[var(--color-text)]">
            {isFeatured ? 'Khách sạn nổi bật' : `${total} khách sạn dành cho bạn`}
          </p>
          {totalPages > 1 && (
            <span className="shrink-0 text-xs text-[var(--color-text-muted)]">Trang {page}/{totalPages}</span>
          )}
        </div>
      )}

      {status === 'success' && hotels.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {hotels.map((hotel) => {
            return (
            <div key={hotel.id} className="flex flex-col gap-1.5 rounded-xl border border-[var(--color-border)] bg-white p-3">
              <Link href={`/hotels/${hotel.id}`} className="group flex flex-col gap-1.5">
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-[var(--color-bg)]">
                  <HotelImage
                    src={hotel.image || getHotelPhoto(hotel.id)}
                    seed={hotel.id}
                    name={hotel.name}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 break-words font-semibold text-sm text-[var(--color-text)] group-hover:text-[var(--color-primary-darker)]">{hotel.name}</div>
                  {typeof hotel.rating === 'number' && hotel.rating > 0 && (
                    <span className="shrink-0 rounded-md bg-[var(--color-primary-lightest)] px-1.5 py-0.5 text-[11px] font-bold text-[var(--color-primary-darker)]">
                      {hotel.rating} sao
                    </span>
                  )}
                </div>
                <div className="text-xs text-[var(--color-text-muted)] break-words">
                  {[hotel.district, hotel.province].filter(Boolean).join(', ') || 'Chưa rõ khu vực'}
                  {typeof hotel.distanceKm === 'number' && <span> · {hotel.distanceKm} km</span>}
                </div>
                {hotel.address && (
                  <div className="text-xs text-[var(--color-text-muted)] break-words">{hotel.address}</div>
                )}
                <div className="mt-1 text-sm font-bold text-[var(--color-primary-darker)]">
                  ~{formatHotelPrice(estimateHotelPricePerNight(hotel.priceLevel, hotel.rating, hotel.id))}
                  <span className="text-[11px] font-normal text-[var(--color-text-muted)]"> /đêm · ước tính</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  {hotel.priceLevel && (
                    <span className="rounded-full bg-[var(--color-primary-lightest)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-primary-darker)]">
                      {PRICE_LABELS[hotel.priceLevel]}
                    </span>
                  )}
                  {(hotel.amenities ?? []).slice(0, 3).map((amenity) => (
                    <span key={amenity} className="rounded-full bg-[var(--color-bg)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-secondary)]">
                      {AMENITY_LABELS[amenity] ?? amenity}
                    </span>
                  ))}
                </div>
              </Link>
              {onSelect && (
                <button
                  type="button"
                  onClick={() => handleSelect(hotel)}
                  disabled={savingId === hotel.id}
                  className="mt-1 w-fit rounded-lg bg-[var(--color-primary-darker)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
                >
                  {savingId === hotel.id ? 'Đang lưu...' : 'Lưu vào chuyến đi'}
                </button>
              )}
            </div>
            );
          })}
        </div>
      )}

      {status === 'success' && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-[var(--color-border)] px-4 py-1.5 text-xs font-semibold text-[var(--color-text)] disabled:opacity-40"
          >
            Trước
          </button>
          <span className="text-xs text-[var(--color-text-muted)]">Trang {page}/{totalPages}</span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-[var(--color-border)] px-4 py-1.5 text-xs font-semibold text-[var(--color-text)] disabled:opacity-40"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}
