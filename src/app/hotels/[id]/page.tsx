'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import HotelSuggestions from '@/components/hotels/HotelSuggestions';
import HotelReviews from '@/components/hotels/HotelReviews';
import HotelImage from '@/components/hotels/HotelImage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { apiRequest, ensureApiSuccess, getApiErrorMessage } from '@/lib/api-client';
import { getHotelPhotos, estimateHotelPricePerNight, formatHotelPrice } from '@/lib/hotel-utils';

interface HotelDetail {
  id: string;
  name: string;
  province: string | null;
  district: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  rating: number | null;
  priceLevel: 'budget' | 'mid' | 'luxury' | null;
  images: string[];
}

interface ApiResponse {
  success?: boolean;
  data?: HotelDetail;
  message?: string;
}

type Status = 'loading' | 'success' | 'error';

const PRICE_LABELS: Record<NonNullable<HotelDetail['priceLevel']>, string> = {
  budget: 'Tiết kiệm',
  mid: 'Trung bình',
  luxury: 'Cao cấp',
};

export default function HotelDetailPage(): React.JSX.Element {
  const params = useParams<{ id: string }>();
  const hotelId = params?.id;
  const [status, setStatus] = useState<Status>('loading');
  const [hotel, setHotel] = useState<HotelDetail | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const load = useCallback(async (): Promise<void> => {
    if (!hotelId) return;
    setStatus('loading');
    setErrorMessage('');
    try {
      const { response, data } = await apiRequest<ApiResponse>(`/api/hotels/${hotelId}`);
      try {
        ensureApiSuccess(response, data, 'Không thể tải thông tin khách sạn');
      } catch {
        setErrorMessage(getApiErrorMessage(data, 'Không thể tải thông tin khách sạn'));
        setStatus('error');
        return;
      }
      setHotel(data.data ?? null);
      setActiveImage(0);
      setStatus('success');
    } catch {
      setErrorMessage('Không thể tải thông tin khách sạn');
      setStatus('error');
    }
  }, [hotelId]);

  useEffect(() => {
    load();
  }, [load]);

  const gallery = hotel ? (hotel.images.length > 0 ? hotel.images : getHotelPhotos(hotel.id, 3)) : [];
  const area = hotel ? [hotel.district, hotel.province].filter(Boolean).join(', ') : '';
  const mapQuery = hotel ? `${hotel.name}, ${area || 'Việt Nam'}` : '';

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <AppHeader active="hotels" showSearch={false} />

      <main className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/hotels" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary-darker)] hover:underline">
          Quay lại danh sách khách sạn
        </Link>

        {status === 'loading' && (
          <div className="flex items-center gap-2 py-16 text-sm text-[var(--color-text-muted)]">
            <LoadingSpinner size="md" className="text-[var(--color-primary-dark)]" />
            Đang tải thông tin khách sạn...
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3">
            <span className="text-sm text-[var(--color-danger)]">{errorMessage || 'Không thể tải thông tin khách sạn'}</span>
            <button type="button" onClick={load} className="shrink-0 text-xs font-semibold text-[var(--color-primary-darker)] hover:underline">
              Thử lại
            </button>
          </div>
        )}

        {status === 'success' && hotel && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <div className="space-y-3">
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-[var(--color-surface)]">
                  <HotelImage
                    src={gallery[activeImage] ?? gallery[0] ?? null}
                    seed={hotel.id}
                    name={hotel.name}
                    sizes="(max-width: 1024px) 100vw, 640px"
                    className="object-cover"
                    priority
                  />
                </div>
                {gallery.length > 1 && (
                  <div className="flex flex-wrap gap-2">
                    {gallery.map((src, index) => (
                      <button
                        key={src}
                        type="button"
                        onClick={() => setActiveImage(index)}
                        aria-label={`Ảnh ${index + 1}`}
                        className={`relative h-16 w-20 overflow-hidden rounded-lg border-2 ${index === activeImage ? 'border-[var(--color-primary-darker)]' : 'border-transparent'}`}
                      >
                        <Image src={src} alt={`${hotel.name} ${index + 1}`} fill sizes="80px" className="object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h1 className="text-2xl font-bold text-[var(--color-text)]">{hotel.name}</h1>
                  {area && <p className="mt-1 text-sm text-[var(--color-text-muted)]">{area}</p>}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {typeof hotel.rating === 'number' && hotel.rating > 0 && (
                    <span className="rounded-full bg-[var(--color-primary-lightest)] px-3 py-1 text-sm font-semibold text-[var(--color-primary-darker)]">
                      {hotel.rating} sao
                    </span>
                  )}
                  {hotel.priceLevel && (
                    <span className="rounded-full border border-[var(--color-border)] px-3 py-1 text-sm font-semibold text-[var(--color-text-secondary)]">
                      {PRICE_LABELS[hotel.priceLevel]}
                    </span>
                  )}
                </div>

                <div className="text-lg font-bold text-[var(--color-primary-darker)]">
                  ~{formatHotelPrice(estimateHotelPricePerNight(hotel.priceLevel, hotel.rating, hotel.id))}
                  <span className="ml-1 text-xs font-normal text-[var(--color-text-muted)]">/đêm · giá ước tính</span>
                </div>

                {hotel.address && (
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
                    <div className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">Địa chỉ</div>
                    <div className="mt-0.5 text-sm text-[var(--color-text)]">{hotel.address}</div>
                  </div>
                )}

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary-darker)] px-4 py-3 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)]"
                >
                  Xem trên bản đồ
                </a>

                {hotel.images.length === 0 && (
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Ảnh mang tính minh hoạ cho khu vực, có thể khác với khách sạn thực tế.
                  </p>
                )}
              </div>
            </div>

            <HotelReviews hotelId={hotel.id} hotelName={hotel.name} />

            {hotel.province && (
              <div>
                <h2 className="mb-3 text-lg font-bold text-[var(--color-text)]">Khách sạn khác tại {hotel.province}</h2>
                <HotelSuggestions province={hotel.province} limit={9} />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
