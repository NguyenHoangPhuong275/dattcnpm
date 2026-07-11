'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest, ensureApiSuccess, getApiErrorMessage } from '@/lib/api-client';
import { useToast } from '@/hooks/useToast';
import { useFeedback } from '@/hooks/useFeedback';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import HotelSuggestions, { type HotelResult } from '@/components/hotels/HotelSuggestions';

interface Accommodation {
  id: string;
  hotelId: string | null;
  name: string;
  address: string | null;
  checkIn: string;
  checkOut: string;
  bookingCode: string | null;
  note: string | null;
  currency: string;
}

interface ApiResponse {
  success?: boolean;
  data?: Accommodation[];
  message?: string;
}

interface TripAccommodationSectionProps {
  tripId: string;
  userId: string | null;
  canEdit?: boolean;
  destination?: string | null;
  lat?: number | null;
  lng?: number | null;
  placeName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

function formatStayDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function resolveStayRange(startDate?: string | null, endDate?: string | null): { checkIn: string; checkOut: string } {
  const checkIn = startDate ? new Date(startDate) : new Date();
  let checkOut = endDate ? new Date(endDate) : new Date(checkIn.getTime() + 24 * 60 * 60 * 1000);
  if (!(checkOut.getTime() > checkIn.getTime())) {
    checkOut = new Date(checkIn.getTime() + 24 * 60 * 60 * 1000);
  }
  return { checkIn: checkIn.toISOString(), checkOut: checkOut.toISOString() };
}

export default function TripAccommodationSection({ tripId, userId, canEdit = true, destination, lat, lng, placeName, startDate, endDate }: TripAccommodationSectionProps): React.JSX.Element {
  const [status, setStatus] = useState<Status>('idle');
  const [items, setItems] = useState<Accommodation[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { actions: { showToast } } = useToast();
  const { actions: feedback } = useFeedback();
  const router = useRouter();
  const shouldShowSuggestions = canEdit && status === 'success' && (items.length === 0 || showSuggestions);

  const load = useCallback(async (): Promise<void> => {
    if (!userId) return;
    setShowSuggestions(false);
    setStatus('loading');
    setErrorMessage('');
    try {
      const { response, data } = await apiRequest<ApiResponse>(`/api/trips/${tripId}/accommodation`, { userId });
      try {
        ensureApiSuccess(response, data, 'Không thể tải danh sách lưu trú');
      } catch {
        setErrorMessage(getApiErrorMessage(data, 'Không thể tải danh sách lưu trú'));
        setStatus('error');
        return;
      }
      setItems(Array.isArray(data.data) ? data.data : []);
      setStatus('success');
    } catch {
      setErrorMessage('Không thể tải danh sách lưu trú');
      setStatus('error');
    }
  }, [tripId, userId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSelectHotel = async (hotel: HotelResult): Promise<void> => {
    if (!userId || !canEdit) return;
    const { checkIn, checkOut } = resolveStayRange(startDate, endDate);
    try {
      const { response, data } = await apiRequest<ApiResponse>(`/api/trips/${tripId}/accommodation`, {
        method: 'POST',
        userId,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelId: hotel.id,
          name: hotel.name,
          address: hotel.address ?? undefined,
          checkIn,
          checkOut,
        }),
      });
      try {
        ensureApiSuccess(response, data, 'Không thể lưu khách sạn vào chuyến đi');
      } catch {
        showToast(getApiErrorMessage(data, 'Không thể lưu khách sạn vào chuyến đi'), 'error');
        return;
      }
      showToast('Đã lưu khách sạn vào chuyến đi', 'success');
      await load();
    } catch {
      showToast('Không thể lưu khách sạn vào chuyến đi', 'error');
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!userId || !canEdit) return;
    await feedback.confirmAction({
      confirm: {
        title: 'Xóa nơi lưu trú?',
        description: 'Khách sạn này sẽ bị xóa khỏi chuyến đi.',
        confirmLabel: 'Xóa',
        tone: 'danger',
      },
      action: async () => {
        setDeletingId(id);
        try {
          const { response, data } = await apiRequest<ApiResponse>(`/api/trips/${tripId}/accommodation/${id}`, {
            method: 'DELETE',
            userId,
          });
          ensureApiSuccess(response, data, 'Không thể xóa nơi lưu trú');
          await load();
        } finally {
          setDeletingId(null);
        }
      },
      success: 'Đã xóa nơi lưu trú',
      error: 'Không thể xóa nơi lưu trú',
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-semibold text-[var(--color-text)]">Khách sạn đã chọn</div>
          <div className="flex items-center gap-3">
            {canEdit && status === 'success' && items.length > 0 && (
              <button
                type="button"
                onClick={() => setShowSuggestions((visible) => !visible)}
                aria-expanded={showSuggestions}
                className="text-xs font-semibold text-[var(--color-primary-darker)] hover:underline"
              >
                {showSuggestions ? 'Ẩn gợi ý' : 'Thêm khách sạn khác'}
              </button>
            )}
            {status === 'loading' && <LoadingSpinner size="sm" className="text-[var(--color-primary-dark)]" />}
          </div>
        </div>

        {status === 'error' && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-3 py-2">
            <span className="text-sm text-[var(--color-danger)]">{errorMessage || 'Không thể tải danh sách lưu trú'}</span>
            <button type="button" onClick={load} className="shrink-0 text-xs font-semibold text-[var(--color-primary-darker)] hover:underline">
              Thử lại
            </button>
          </div>
        )}

        {status === 'success' && items.length === 0 && (
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-3 text-sm text-[var(--color-text-muted)]">
            {canEdit ? 'Chưa có khách sạn nào. Chọn từ danh sách gợi ý bên dưới.' : 'Chưa có khách sạn nào trong chuyến đi này.'}
          </div>
        )}

        {status === 'success' && items.length > 0 && (
          <ul className="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)]">
            {items.map((item) => (
              <li
                key={item.id}
                onClick={item.hotelId ? () => router.push(`/hotels/${item.hotelId}`) : undefined}
                className={`flex items-start justify-between gap-3 px-3 py-2.5${item.hotelId ? ' cursor-pointer transition-colors hover:bg-[var(--color-bg)]' : ''}`}
              >
                <div className="min-w-0">
                  <div className="break-words text-sm font-medium text-[var(--color-text)]">{item.name}</div>
                  {item.address && <div className="break-words text-xs text-[var(--color-text-muted)]">{item.address}</div>}
                  <div className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                    {formatStayDate(item.checkIn)} đến {formatStayDate(item.checkOut)}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
                  {item.hotelId && (
                    <Link
                      id={`selected-hotel-detail-${item.id}`}
                      href={`/hotels/${item.hotelId}`}
                      onClick={(event) => event.stopPropagation()}
                      className="text-xs font-semibold text-[var(--color-primary-darker)] hover:underline"
                    >
                      Xem chi tiết
                    </Link>
                  )}
                  {canEdit && (
                    <button
                      id={`selected-hotel-delete-${item.id}`}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDelete(item.id);
                      }}
                      disabled={deletingId === item.id}
                      className="text-xs font-semibold text-[var(--color-danger)] hover:underline disabled:opacity-50"
                    >
                      {deletingId === item.id ? 'Đang xóa...' : 'Xóa'}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {shouldShowSuggestions && (
        <div>
          <div className="mb-2 text-sm font-semibold text-[var(--color-text)]">
            {typeof lat === 'number' && typeof lng === 'number' && placeName
              ? `Gợi ý khách sạn gần ${placeName}`
              : `Gợi ý khách sạn tại ${destination || 'điểm đến'}`}
          </div>
          <HotelSuggestions destination={destination} lat={lat} lng={lng} limit={6} onSelect={handleSelectHotel} />
        </div>
      )}
    </div>
  );
}
