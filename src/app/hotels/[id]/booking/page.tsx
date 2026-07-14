'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import BookingPayment from '@/components/hotels/BookingPayment';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiRequest, ensureApiSuccess, getApiErrorMessage, type ApiEnvelope } from '@/lib/api-client';
import { ROUTES } from '@/lib/constants';
import { differenceInCalendarDays, isValidDateOnly } from '@/lib/date';
import { getHotelRoom, type HotelRoom } from '@/lib/hotel-rooms';
import { formatHotelPrice } from '@/lib/hotel-utils';
import { BOOKING_GUEST_TITLES } from '@/lib/validations/booking';
import type { CreateHotelBookingPayload } from '@/types/booking';

interface HotelDetail {
  id: string;
  name: string;
  province: string | null;
  district: string | null;
  address: string | null;
  rating: number | null;
  priceLevel: 'budget' | 'mid' | 'luxury' | null;
}

function formatDay(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function HotelBookingPage(): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <HotelBookingPageContent />
    </Suspense>
  );
}

function HotelBookingPageContent(): React.JSX.Element {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const hotelId = params?.id ?? '';

  const userHook = useCurrentUser({ redirectIfNone: true });
  const user = userHook.data;

  const roomCode = searchParams.get('room') ?? '';
  const checkIn = searchParams.get('checkIn') ?? '';
  const checkOut = searchParams.get('checkOut') ?? '';
  const guests = Number(searchParams.get('guests') ?? '0');
  const tripId = searchParams.get('tripId') ?? '';

  const [hotel, setHotel] = useState<HotelDetail | null>(null);
  const [loadError, setLoadError] = useState('');
  const [guestTitle, setGuestTitle] = useState<(typeof BOOKING_GUEST_TITLES)[number]>('Ông');
  const [guestName, setGuestName] = useState('');
  const [phone, setPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [result, setResult] = useState<CreateHotelBookingPayload | null>(null);

  useEffect(() => {
    if (user) {
      setGuestName((current) => current || user.fullName || '');
      setContactEmail((current) => current || user.email || '');
    }
  }, [user]);

  useEffect(() => {
    if (result && result.booking.paymentStatus === 'paid') {
      if (tripId) {
        router.push(`${ROUTES.scheduleReference}/${tripId}`);
      } else {
        router.push('/profile?tab=bookings');
      }
    }
  }, [result, router, tripId]);

  const loadHotel = useCallback(async (): Promise<void> => {
    if (!hotelId) return;
    try {
      const { response, data } = await apiRequest<ApiEnvelope<HotelDetail>>(`/api/hotels/${hotelId}`);
      ensureApiSuccess(response, data, 'Không thể tải thông tin khách sạn');
      setHotel(data.data ?? null);
    } catch (error: unknown) {
      setLoadError(getApiErrorMessage(error, 'Không thể tải thông tin khách sạn'));
    }
  }, [hotelId]);

  useEffect(() => {
    loadHotel();
  }, [loadHotel]);

  const room: HotelRoom | null = useMemo(
    () => (hotel ? getHotelRoom({ id: hotel.id, priceLevel: hotel.priceLevel, rating: hotel.rating }, roomCode) : null),
    [hotel, roomCode],
  );
  const dateRangeValid = isValidDateOnly(checkIn) && isValidDateOnly(checkOut);
  const nights = dateRangeValid ? differenceInCalendarDays(checkIn, checkOut) ?? 0 : 0;
  const guestsValid = Number.isInteger(guests) && guests >= 1;
  const totalPrice = room && nights > 0 ? room.pricePerNight * nights : null;
  const invalidSelection = Boolean(hotel) && (
    !room
    || !dateRangeValid
    || nights < 1
    || !guestsValid
    || (room !== null && guests > room.capacity)
  );

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (submitting || !room || invalidSelection) return;
    setFormError('');
    setSubmitting(true);
    try {
      const { response, data } = await apiRequest<ApiEnvelope<CreateHotelBookingPayload>>(`/api/hotels/${hotelId}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          checkIn,
          checkOut,
          guests,
          guestTitle,
          guestName,
          phone,
          contactEmail,
          note: note.trim() || undefined,
        }),
      });
      ensureApiSuccess(response, data, 'Không thể gửi yêu cầu đặt phòng');
      setResult(data.data ?? null);
    } catch (error: unknown) {
      setFormError(getApiErrorMessage(error, 'Không thể gửi yêu cầu đặt phòng'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <AppHeader active="hotels" showSearch={false} />

      <main className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8">
        <Link
          id={`hotel-booking-back-${hotelId}`}
          href={`${ROUTES.hotels}/${hotelId}`}
          className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary-darker)] hover:underline"
        >
          Quay lại khách sạn
        </Link>

        {loadError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{loadError}</div>
        )}

        {!hotel && !loadError && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-[var(--color-text-muted)]">
            <LoadingSpinner size="md" className="text-[var(--color-primary-dark)]" />
            Đang tải thông tin đặt phòng...
          </div>
        )}

        {hotel && invalidSelection && !result && (
          <div className="rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-white px-6 py-12 text-center">
            <p className="text-sm font-semibold text-[var(--color-text)]">Thông tin đặt phòng không hợp lệ hoặc đã hết hạn.</p>
            <Link
              id={`hotel-booking-reselect-${hotelId}`}
              href={`${ROUTES.hotels}/${hotelId}`}
              className="mt-3 inline-block text-sm font-bold text-[var(--color-primary-darker)] hover:underline"
            >
              Chọn lại phòng và ngày
            </Link>
          </div>
        )}

        {hotel && room && !invalidSelection && !result && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
              <h1 className="text-2xl font-extrabold text-[var(--color-text)]">Thông tin người đặt phòng</h1>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Thông tin yêu cầu sẽ được gửi về email bên dưới.
              </p>

              <div className="mt-6 space-y-4">
                <div className="grid gap-3 sm:grid-cols-[130px_minmax(0,1fr)]">
                  <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--color-text-secondary)]">
                    Danh xưng
                    <select
                      id="hotel-booking-guest-title"
                      value={guestTitle}
                      onChange={(event) => setGuestTitle(event.target.value as (typeof BOOKING_GUEST_TITLES)[number])}
                      className="app-booking-field app-select"
                    >
                      {BOOKING_GUEST_TITLES.map((title) => (
                        <option key={title} value={title}>{title}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--color-text-secondary)]">
                    Họ và tên
                    <input
                      id="hotel-booking-guest-name"
                      type="text"
                      value={guestName}
                      onChange={(event) => setGuestName(event.target.value)}
                      placeholder="Nguyễn Văn A"
                        className="app-booking-field"
                      required
                    />
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--color-text-secondary)]">
                    Số điện thoại
                    <input
                      id="hotel-booking-phone"
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="0912345678"
                        className="app-booking-field"
                      required
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--color-text-secondary)]">
                    Email nhận xác nhận
                    <input
                      id="hotel-booking-contact-email"
                      type="email"
                      value={contactEmail}
                      onChange={(event) => setContactEmail(event.target.value)}
                      placeholder="ban@email.com"
                        className="app-booking-field"
                      required
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--color-text-secondary)]">
                  Ghi chú cho khách sạn (không bắt buộc)
                  <textarea
                    id="hotel-booking-note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Ví dụ: đến muộn sau 22h, cần phòng tầng cao..."
                    className="app-booking-field"
                  />
                </label>
              </div>

              {formError && <p className="mt-4 text-sm font-semibold text-red-600">{formError}</p>}

              <button
                id="hotel-booking-submit"
                type="submit"
                disabled={submitting}
                className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary-darker)] px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[var(--color-primary-dark)] disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" className="border-t-transparent" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  'Gửi yêu cầu đặt phòng'
                )}
              </button>
            </form>

            <aside className="h-fit rounded-2xl border border-[var(--color-border)] bg-white p-6 lg:sticky lg:top-24">
              <h2 className="text-lg font-extrabold text-[var(--color-text)]">{hotel.name}</h2>
              <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
                {[hotel.district, hotel.province].filter(Boolean).join(', ') || hotel.address || 'Việt Nam'}
              </p>

              <dl className="mt-5 space-y-2.5 border-t border-[var(--color-border)] pt-4 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--color-text-muted)]">Loại phòng</dt>
                  <dd className="text-right font-bold text-[var(--color-text)]">{room.name}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--color-text-muted)]">Nhận phòng</dt>
                  <dd className="text-right font-bold text-[var(--color-text)]">{formatDay(checkIn)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--color-text-muted)]">Trả phòng</dt>
                  <dd className="text-right font-bold text-[var(--color-text)]">{formatDay(checkOut)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--color-text-muted)]">Số đêm · khách</dt>
                  <dd className="text-right font-bold tabular-nums text-[var(--color-text)]">{nights} đêm · {guests} khách</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--color-text-muted)]">Giá mỗi đêm</dt>
                  <dd className="text-right font-bold tabular-nums text-[var(--color-text)]">{formatHotelPrice(room.pricePerNight)}</dd>
                </div>
              </dl>

              <div className="mt-4 flex items-baseline justify-between border-t border-[var(--color-border)] pt-4">
                <span className="text-sm font-bold text-[var(--color-text)]">Tổng cộng</span>
                <span className="text-xl font-extrabold tabular-nums text-[var(--color-primary-darker)]">
                  {totalPrice !== null ? formatHotelPrice(totalPrice) : '—'}
                </span>
              </div>
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">Tổng tiền sẽ được kiểm tra lại khi gửi yêu cầu.</p>
            </aside>
          </div>
        )}

        {result && (
          <div className="mx-auto max-w-xl space-y-5">
            <div className="rounded-2xl border border-[var(--color-primary-dark)]/30 bg-white p-8 text-center">
              <p className="text-2xl font-extrabold text-[var(--color-primary-darker)]">Thanh toán đặt phòng</p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                Vui lòng hoàn tất chuyển khoản cho yêu cầu của {result.booking.guestName}.
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                {result.booking.roomName} · {result.booking.nights} đêm · {result.booking.guests} khách ·{' '}
                <span className="font-bold tabular-nums">{formatHotelPrice(result.booking.totalPrice)}</span>
              </p>
            </div>

            <BookingPayment
              bookingId={result.booking.id}
              payment={result.booking.payment}
              paymentStatus={result.booking.paymentStatus}
              onPaid={() => {
                if (tripId) {
                  router.push(`${ROUTES.scheduleReference}/${tripId}`);
                } else {
                  router.push('/profile?tab=bookings');
                }
              }}
            />

            <div className="flex justify-center gap-3">
              <Link
                id={`hotel-booking-result-hotel-${hotelId}`}
                href={`${ROUTES.hotels}/${hotelId}`}
                className="rounded-xl border border-[var(--color-border)] bg-white px-5 py-2.5 text-sm font-bold text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary-dark)] hover:text-[var(--color-primary-darker)]"
              >
                Về trang khách sạn
              </Link>
              <Link
                id="hotel-booking-result-search"
                href={ROUTES.hotels}
                className="rounded-xl bg-[var(--color-primary-darker)] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[var(--color-primary-dark)]"
              >
                Tìm khách sạn khác
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
