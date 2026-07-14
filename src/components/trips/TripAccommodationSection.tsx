'use client';

import { useCallback, useEffect, useId, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { apiRequest, ensureApiSuccess, getApiErrorMessage } from '@/lib/api-client';
import { useToast } from '@/hooks/useToast';
import { useFeedback } from '@/hooks/useFeedback';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import HotelSuggestions, { type HotelResult } from '@/components/hotels/HotelSuggestions';
import BookingCheckInCard from '@/components/profile/BookingCheckInCard';
import { formatDate } from '@/lib/date';
import { formatMoney } from '@/lib/trip-utils';

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
  const idPrefix = `trip-accommodation-${tripId}-${useId()}`;
  const [status, setStatus] = useState<Status>('idle');
  const [items, setItems] = useState<Accommodation[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [loadingBookingId, setLoadingBookingId] = useState<string | null>(null);
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

  const handleViewBooking = async (bookingId: string) => {
    if (loadingBookingId) return;
    setLoadingBookingId(bookingId);
    try {
      const { response, data } = await apiRequest<{ success?: boolean; data?: any; message?: string }>(`/api/bookings/${bookingId}`, { userId });
      ensureApiSuccess(response, data, 'Không thể tải thông tin đặt phòng');
      setSelectedBooking(data.data);
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Không thể tải thông tin đặt phòng'), 'error');
    } finally {
      setLoadingBookingId(null);
    }
  };

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
                id={`${idPrefix}-toggle-suggestions`}
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
            <button id={`${idPrefix}-retry`} type="button" onClick={load} className="shrink-0 text-xs font-semibold text-[var(--color-primary-darker)] hover:underline">
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
                onClick={
                  item.bookingCode
                    ? () => handleViewBooking(item.bookingCode!)
                    : item.hotelId
                    ? () => router.push(`/hotels/${item.hotelId}`)
                    : undefined
                }
                className={`flex items-start justify-between gap-3 px-3 py-2.5${item.bookingCode || item.hotelId ? ' cursor-pointer transition-colors hover:bg-[var(--color-bg)]' : ''}`}
              >
                <div className="min-w-0">
                  <div className="break-words text-sm font-medium text-[var(--color-text)]">{item.name}</div>
                  {item.address && <div className="break-words text-xs text-[var(--color-text-muted)]">{item.address}</div>}
                  <div className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                    {formatStayDate(item.checkIn)} đến {formatStayDate(item.checkOut)}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
                  {item.bookingCode ? (
                    <button
                      id={`${idPrefix}-detail-${item.id}`}
                      type="button"
                      disabled={loadingBookingId === item.bookingCode}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleViewBooking(item.bookingCode!);
                      }}
                      className="text-xs font-semibold text-[var(--color-primary-darker)] hover:underline disabled:opacity-50 cursor-pointer"
                    >
                      {loadingBookingId === item.bookingCode ? 'Đang tải...' : 'Xem chi tiết'}
                    </button>
                  ) : item.hotelId ? (
                    <Link
                      id={`${idPrefix}-detail-${item.id}`}
                      href={`/hotels/${item.hotelId}`}
                      onClick={(event) => event.stopPropagation()}
                      className="text-xs font-semibold text-[var(--color-primary-darker)] hover:underline"
                    >
                      Xem chi tiết
                    </Link>
                  ) : null}
                  {canEdit && (
                    <button
                      id={`${idPrefix}-delete-${item.id}`}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDelete(item.id);
                      }}
                      disabled={deletingId === item.id}
                      className="text-xs font-semibold text-[var(--color-danger)] hover:underline disabled:opacity-50 cursor-pointer"
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

      {selectedBooking && (
        <div id="hotel-booking-detail-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div id="hotel-booking-detail-modal" role="dialog" aria-modal="true" aria-label="Chi tiết đặt phòng" className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
              
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-[var(--color-primary-lightest)] p-1.5 border border-[var(--color-primary-light)]">
                    <Image src="/images/logo.svg" alt="Biểu trưng Lotus Travel" width={32} height={32} className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="font-display text-sm font-extrabold text-[var(--color-primary-darker)]">Lotus Travel</h4>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Chi tiết đặt phòng</p>
                  </div>
                </div>
              </div>

              <div className="text-center space-y-2">
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                  selectedBooking.status === 'confirmed'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : selectedBooking.status === 'pending'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}>
                  {selectedBooking.status === 'confirmed'
                    ? 'Đã xác nhận'
                    : selectedBooking.status === 'pending'
                    ? 'Đang chờ xác nhận'
                    : 'Đã hủy'}
                </span>
                <h3 className="font-display text-xl font-extrabold text-[var(--color-text)] leading-tight">{selectedBooking.hotelName}</h3>
                <p className="text-sm font-medium text-slate-500">{selectedBooking.roomName}</p>
              </div>

              <div className="border-t border-b border-dashed border-slate-200 py-4 my-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary-darker)] mb-3">Thông tin chi tiết</h4>
                <dl className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                  {selectedBooking.guestName && (
                    <div>
                      <dt className="text-slate-400 text-xs">Người đặt phòng</dt>
                      <dd className="font-bold text-slate-800 mt-0.5">
                        {selectedBooking.guestTitle ? `${selectedBooking.guestTitle} ` : ''}{selectedBooking.guestName}
                      </dd>
                    </div>
                  )}
                  {selectedBooking.phone && (
                    <div>
                      <dt className="text-slate-400 text-xs">Số điện thoại liên hệ</dt>
                      <dd className="font-bold text-slate-800 mt-0.5 tabular-nums">{selectedBooking.phone}</dd>
                    </div>
                  )}
                  {selectedBooking.contactEmail && (
                    <div>
                      <dt className="text-slate-400 text-xs">Email liên hệ</dt>
                      <dd className="font-bold text-slate-800 mt-0.5 break-all">{selectedBooking.contactEmail}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-slate-400 text-xs">Số lượng khách</dt>
                    <dd className="font-bold text-slate-800 mt-0.5">{selectedBooking.guests} khách</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 text-xs">Ngày nhận phòng</dt>
                    <dd className="font-bold text-slate-800 mt-0.5">{formatDate(selectedBooking.checkIn)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 text-xs">Ngày trả phòng</dt>
                    <dd className="font-bold text-slate-800 mt-0.5">{formatDate(selectedBooking.checkOut)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 text-xs">Số đêm lưu trú</dt>
                    <dd className="font-bold text-slate-800 mt-0.5">{selectedBooking.nights} đêm</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 text-xs">Trạng thái thanh toán</dt>
                    <dd className={`font-bold mt-0.5 ${
                      selectedBooking.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'
                    }`}>
                      {selectedBooking.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </dd>
                  </div>
                </dl>
                
                {selectedBooking.note && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <dt className="text-slate-400 text-xs">Yêu cầu đặc biệt</dt>
                    <dd className="text-xs text-slate-600 mt-1 italic">“{selectedBooking.note}”</dd>
                  </div>
                )}
              </div>

              <BookingCheckInCard
                code={selectedBooking.code}
                status={selectedBooking.status}
                paymentStatus={selectedBooking.paymentStatus}
                service="hotel"
              />

              <div className="flex justify-between items-center bg-[var(--color-primary-lightest)] rounded-2xl px-5 py-4 border border-[var(--color-primary-light)]">
                <p className="text-xs font-semibold text-[var(--color-primary-darker)]">Tổng tiền</p>
                <p className="text-xl font-extrabold text-[var(--color-primary-darker)] tabular-nums">
                  {formatMoney(selectedBooking.totalPrice)}
                </p>
              </div>

            </div>

            <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex gap-3 justify-end shrink-0">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
              >
                In chi tiết
              </button>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="rounded-xl bg-[var(--color-primary-darker)] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[var(--color-primary-dark)] cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
