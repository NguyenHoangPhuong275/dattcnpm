'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

import AppHeader from '@/components/AppHeader';
import FlightBookingPayment from '@/components/flights/FlightBookingPayment';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { getAirlineByCode, getAirportByCode, getFlightScheduleById, type FlightSchedule } from '@/data/vietnam-flights';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiRequest, ensureApiSuccess, getApiErrorMessage, type ApiEnvelope } from '@/lib/api-client';
import { ROUTES } from '@/lib/constants';
import { formatMoney } from '@/lib/trip-utils';
import type { CreateFlightBookingPayload } from '@/types/booking';

const fieldClass = 'h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm font-medium text-[var(--color-text)] outline-none transition-colors';

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function segmentTitle(flight: FlightSchedule): string {
  const from = getAirportByCode(flight.from);
  const to = getAirportByCode(flight.to);
  return `${from?.city ?? flight.from} - ${to?.city ?? flight.to}`;
}

function FlightSummary({ flight, date, label }: { flight: FlightSchedule; date: string; label: string }): React.JSX.Element {
  const airline = getAirlineByCode(flight.airline);
  return (
    <div className="rounded-xl bg-[var(--color-bg)] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">{label}</p>
          <p className="mt-1 font-extrabold text-[var(--color-text)]">{segmentTitle(flight)}</p>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[var(--color-primary-darker)]">{flight.flightNumber}</span>
      </div>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{airline?.name ?? flight.airline} · {formatDate(date)}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-[var(--color-text)]">{flight.departureTime} - {flight.arrivalTime} · {flight.duration}</p>
    </div>
  );
}

export default function FlightBookingPage(): React.JSX.Element {
  return <Suspense fallback={null}><FlightBookingPageContent /></Suspense>;
}

function FlightBookingPageContent(): React.JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const user = useCurrentUser({ redirectIfNone: true }).data;
  const outboundId = searchParams.get('outbound') ?? '';
  const returnId = searchParams.get('return') ?? '';
  const departDate = searchParams.get('departDate') ?? '';
  const returnDate = searchParams.get('returnDate') ?? '';
  const passengers = Number(searchParams.get('passengers') ?? '0');
  const tripId = searchParams.get('tripId') ?? '';
  const outbound = getFlightScheduleById(outboundId);
  const returnFlight = returnId ? getFlightScheduleById(returnId) : null;

  const selectionValid = Boolean(
    outbound
    && departDate
    && Number.isInteger(passengers)
    && passengers >= 1
    && passengers <= 9
    && (!returnId || (returnFlight && returnDate)),
  );

  const [passengerNames, setPassengerNames] = useState<string[]>(() => Array.from({ length: Math.max(1, passengers) }, () => ''));
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [result, setResult] = useState<CreateFlightBookingPayload | null>(null);

  useEffect(() => {
    if (!Number.isInteger(passengers) || passengers < 1 || passengers > 9) return;
    setPassengerNames((current) => Array.from({ length: passengers }, (_, index) => current[index] ?? ''));
  }, [passengers]);

  useEffect(() => {
    if (!user) return;
    setContactName((current) => current || user.fullName || '');
    setContactEmail((current) => current || user.email || '');
    setPassengerNames((current) => current.map((name, index) => index === 0 && !name ? user.fullName || '' : name));
  }, [user]);

  const totalPrice = useMemo(
    () => ((outbound?.basePrice ?? 0) + (returnFlight?.basePrice ?? 0)) * Math.max(0, passengers),
    [outbound, passengers, returnFlight],
  );

  const updatePassengerName = (index: number, value: string): void => {
    setPassengerNames((current) => current.map((name, itemIndex) => itemIndex === index ? value : name));
  };

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (submitting || !selectionValid) return;
    setSubmitting(true);
    setFormError('');
    try {
      const { response, data } = await apiRequest<ApiEnvelope<CreateFlightBookingPayload>>('/api/flights/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outboundFlightId: outboundId,
          returnFlightId: returnId || undefined,
          departDate,
          returnDate: returnDate || undefined,
          passengers,
          passengerNames,
          contactName,
          phone,
          contactEmail,
          note: note.trim() || undefined,
        }),
      });
      ensureApiSuccess(response, data, 'Không thể hoàn tất đặt vé máy bay');
      setResult(data.data ?? null);
    } catch (error: unknown) {
      setFormError(getApiErrorMessage(error, 'Không thể hoàn tất đặt vé máy bay'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <AppHeader active="flights" showSearch={false} />
      <main className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8">
        <Link id="back-to-flight-search" href={ROUTES.flights} className="mb-4 inline-flex text-sm font-semibold text-[var(--color-primary-darker)] hover:underline">Chọn lại chuyến bay</Link>

        {!selectionValid && (
          <div className="rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-white px-6 py-12 text-center">
            <h1 className="text-lg font-extrabold">Thông tin chuyến bay không hợp lệ hoặc đã hết hạn.</h1>
            <Link id="retry-flight-search" href={ROUTES.flights} className="mt-3 inline-block text-sm font-bold text-[var(--color-primary-darker)] hover:underline">Tìm lại chuyến bay</Link>
          </div>
        )}

        {selectionValid && outbound && !result && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_370px]">
            <form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
              <h1 className="text-2xl font-extrabold">Thông tin đặt vé</h1>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">Nhập họ tên hành khách đúng như giấy tờ tùy thân dùng khi làm thủ tục bay.</p>

              <div className="mt-6 space-y-4">
                {passengerNames.map((name, index) => (
                  <label key={index} className="flex flex-col gap-1 text-xs font-semibold text-[var(--color-text-secondary)]">
                    Họ tên hành khách {index + 1}
                    <input id={`flight-passenger-${index + 1}`} type="text" value={name} onChange={(event) => updatePassengerName(index, event.target.value)} className={fieldClass} placeholder="NGUYỄN VĂN A" required />
                  </label>
                ))}

                <div className="border-t border-[var(--color-border)] pt-4">
                  <h2 className="mb-3 text-sm font-extrabold">Thông tin liên hệ</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--color-text-secondary)]">Người liên hệ<input id="flight-contact-name" type="text" value={contactName} onChange={(event) => setContactName(event.target.value)} className={fieldClass} required /></label>
                    <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--color-text-secondary)]">Số điện thoại<input id="flight-contact-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className={fieldClass} placeholder="0912345678" required /></label>
                  </div>
                  <label className="mt-3 flex flex-col gap-1 text-xs font-semibold text-[var(--color-text-secondary)]">Email nhận vé<input id="flight-contact-email" type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} className={fieldClass} required /></label>
                  <label className="mt-3 flex flex-col gap-1 text-xs font-semibold text-[var(--color-text-secondary)]">Ghi chú (không bắt buộc)<textarea id="flight-booking-note" value={note} onChange={(event) => setNote(event.target.value)} rows={3} maxLength={500} className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none" /></label>
                </div>
              </div>

              {formError && <p className="mt-4 text-sm font-semibold text-[var(--color-danger)]">{formError}</p>}
              <button
                id="submit-flight-booking"
                type="submit"
                disabled={submitting}
                className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary-darker)] px-6 py-3.5 text-sm font-bold text-white hover:bg-[var(--color-primary-dark)] disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" className="border-t-transparent" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  'Gửi yêu cầu đặt vé'
                )}
              </button>
            </form>

            <aside className="h-fit space-y-3 rounded-2xl border border-[var(--color-border)] bg-white p-5 lg:sticky lg:top-24">
              <h2 className="text-lg font-extrabold">Chuyến bay đã chọn</h2>
              <FlightSummary flight={outbound} date={departDate} label="Chuyến đi" />
              {returnFlight && <FlightSummary flight={returnFlight} date={returnDate} label="Chuyến về" />}
              <div className="flex items-baseline justify-between border-t border-[var(--color-border)] pt-4"><span className="text-sm font-bold">Tổng cộng · {passengers} khách</span><span className="text-xl font-extrabold tabular-nums text-[var(--color-primary-darker)]">{formatMoney(totalPrice)}</span></div>
              <p className="text-xs leading-5 text-[var(--color-text-muted)]">Tổng tiền sẽ được kiểm tra lại khi gửi yêu cầu.</p>
            </aside>
          </div>
        )}

        {result && (
          <div className="mx-auto max-w-xl space-y-5">
            <div className="rounded-2xl border border-[var(--color-primary-dark)]/30 bg-white p-8 text-center">
              <h1 className="text-2xl font-extrabold text-[var(--color-primary-darker)]">Thanh toán vé máy bay</h1>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Yêu cầu đặt vé đã được ghi nhận.</p>
              <p className="mt-3 text-sm text-[var(--color-text-secondary)]">{result.booking.passengers} hành khách · <span className="font-bold tabular-nums">{formatMoney(result.booking.totalPrice)}</span></p>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">Hoàn tất bước thanh toán để gửi yêu cầu đến quản trị viên xác nhận.</p>
            </div>
            <FlightBookingPayment
              bookingId={result.booking.id}
              payment={result.booking.payment}
              paymentStatus={result.booking.paymentStatus}
              onPaid={() => {
                if (tripId) {
                  router.push(`/trips/${tripId}/book-wizard?step=hotel`);
                }
              }}
            />
            <div className="flex justify-center gap-3">
              {tripId ? (
                <Link id="continue-to-hotel-booking" href={`/trips/${tripId}/book-wizard?step=hotel`} className="rounded-xl bg-[var(--color-primary-darker)] px-5 py-2.5 text-sm font-bold text-white">Tiếp tục đặt phòng khách sạn</Link>
              ) : (
                <Link id="find-another-flight" href={ROUTES.flights} className="rounded-xl bg-[var(--color-primary-darker)] px-5 py-2.5 text-sm font-bold text-white">Tìm chuyến bay khác</Link>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
