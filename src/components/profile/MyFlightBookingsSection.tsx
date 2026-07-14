'use client';

import { useEffect, useState } from 'react';

import FlightBookingPayment from '@/components/flights/FlightBookingPayment';
import BookingCheckInCard from '@/components/profile/BookingCheckInCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { usePaginatedBookingList } from '@/hooks/usePaginatedBookingList';
import { formatDate } from '@/lib/date';
import { formatMoney } from '@/lib/trip-utils';
import type { FlightBookingListItem } from '@/types/booking';

function getStatusLabel(booking: FlightBookingListItem): string {
  if (booking.status === 'cancelled') return 'Đã hủy';
  if (booking.status === 'confirmed') return 'Đã xác nhận';
  return booking.paymentStatus === 'paid' ? 'Chờ xác nhận' : 'Chờ thanh toán';
}

const FLIGHT_BOOKINGS_ERROR_MESSAGE = 'Không thể tải danh sách vé máy bay';

interface MyFlightBookingsSectionProps {
  userId: string;
}

export default function MyFlightBookingsSection({ userId }: MyFlightBookingsSectionProps): React.JSX.Element {
  const [payingId, setPayingId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<FlightBookingListItem | null>(null);
  const {
    data: bookings,
    status,
    error,
    loadingMore,
    hasMore,
    actions: { loadFirstPage, loadMore, refreshLoadedPages },
  } = usePaginatedBookingList<FlightBookingListItem>({
    endpoint: '/api/flight-bookings/my',
    fallbackMessage: FLIGHT_BOOKINGS_ERROR_MESSAGE,
    userId,
  });

  useEffect(() => { void loadFirstPage(); }, [loadFirstPage]);

  return (
    <section aria-labelledby="my-flight-bookings-title">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-primary-dark)]">Vé máy bay</p>
          <h3 id="my-flight-bookings-title" className="mt-1 text-lg font-extrabold">Chuyến bay đã đặt</h3>
        </div>
        <a id="profile-find-flights" href="/flights" className="text-sm font-bold text-[var(--color-primary-darker)] hover:underline">Tìm chuyến bay</a>
      </div>

      {status === 'loading' && <div className="flex items-center gap-2 py-6 text-sm text-[var(--color-text-muted)]"><LoadingSpinner size="sm" />Đang tải danh sách vé...</div>}
      {status === 'error' && <div className="flex justify-between rounded-xl border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]"><span>{error}</span><button id="retry-flight-bookings" type="button" onClick={loadFirstPage} className="font-bold">Thử lại</button></div>}
      {status === 'success' && bookings.length === 0 && <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-white px-5 py-7 text-center text-sm text-[var(--color-text-muted)]">Bạn chưa có vé máy bay nào.</div>}

      {bookings.length > 0 && (
        <ul className="space-y-3">
          {bookings.map((booking) => (
            <li key={booking.id} className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <button
                    id={`profile-flight-booking-${booking.id}`}
                    type="button"
                    onClick={() => setSelectedInvoice(booking)}
                    className="text-left text-sm font-bold text-[var(--color-primary-darker)] hover:underline cursor-pointer"
                  >
                    {booking.outbound.airlineName} · {booking.outbound.flightNumber}
                  </button>
                  <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">{booking.passengers} hành khách</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-extrabold tabular-nums text-[var(--color-primary-darker)]">{formatMoney(booking.totalPrice)}</p>
                  <span className="mt-1.5 inline-block rounded-full bg-[var(--color-primary-lightest)] px-2.5 py-0.5 text-xs font-bold text-[var(--color-primary-darker)]">{getStatusLabel(booking)}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm text-[var(--color-text-secondary)]">
                <div>
                  Hành trình: <span className="font-bold text-[var(--color-text)]">{booking.outbound.fromCity} → {booking.outbound.toCity}</span>
                  {booking.returnFlight ? ' (Khứ hồi)' : ' (Một chiều)'}
                </div>
                <button
                  id={`profile-flight-booking-details-${booking.id}`}
                  type="button"
                  onClick={() => setSelectedInvoice(booking)}
                  className="font-bold text-[var(--color-primary-darker)] hover:underline cursor-pointer text-xs"
                >
                  Xem chi tiết
                </button>
              </div>

              {booking.status !== 'cancelled' && booking.paymentStatus === 'unpaid' && (
                <div className="mt-4 border-t border-[var(--color-border)] pt-4">
                  {payingId === booking.id
                    ? <FlightBookingPayment bookingId={booking.id} payment={booking.payment} paymentStatus={booking.paymentStatus} onPaid={() => { void refreshLoadedPages(); }} />
                    : <button id={`open-flight-payment-${booking.id}`} type="button" onClick={() => setPayingId(booking.id)} className="rounded-xl bg-[var(--color-primary-darker)] px-5 py-2.5 text-sm font-bold text-white cursor-pointer">Thanh toán vé</button>}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {bookings.length > 0 && (hasMore || loadingMore || error) && (
        <div className="mt-5 flex flex-col items-center gap-2">
          {error && <p className="text-sm font-semibold text-[var(--color-danger)]">{error}</p>}
          {hasMore && (
            <button
              id="load-more-flight-bookings"
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              aria-busy={loadingMore}
              className="rounded-xl border border-[var(--color-border)] bg-white px-5 py-2.5 text-sm font-bold text-[var(--color-primary-darker)] transition-colors hover:bg-[var(--color-primary-lightest)] disabled:cursor-wait disabled:opacity-60"
            >
              {loadingMore ? 'Đang tải thêm...' : 'Xem thêm vé máy bay'}
            </button>
          )}
        </div>
      )}

      {selectedInvoice && (
        <div id="flight-print-invoice-backdrop" data-print-invoice-backdrop className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:p-0">
          <div id="flight-print-invoice-modal" data-print-invoice-modal role="dialog" aria-modal="true" aria-labelledby="flight-invoice-title" className="relative flex max-h-[90dvh] w-full max-w-lg flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden print:border-0 print:shadow-none">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0 print:hidden">
              <h2 id="flight-invoice-title" className="font-display text-sm font-extrabold text-slate-800">Chi tiết vé máy bay</h2>
              <button
                id="flight-invoice-close-icon"
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                aria-label="Đóng"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 print:overflow-visible">
              <div className="text-center space-y-2">
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                  selectedInvoice.status === 'confirmed'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : selectedInvoice.status === 'pending'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}>
                  {selectedInvoice.status === 'confirmed'
                    ? 'Đã xác nhận'
                    : selectedInvoice.status === 'pending'
                    ? 'Đang chờ xác nhận'
                    : 'Đã hủy'}
                </span>
                <h3 className="font-display text-xl font-extrabold text-[var(--color-text)] leading-tight">
                  {selectedInvoice.outbound.fromCity} → {selectedInvoice.outbound.toCity}
                </h3>
                <p className="text-sm font-medium text-slate-500">
                  {selectedInvoice.outbound.airlineName} · {selectedInvoice.outbound.flightNumber} · {selectedInvoice.passengers} hành khách
                </p>
              </div>

              <div className="border-t border-b border-dashed border-slate-200 py-4 my-2 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary-darker)]">Lịch trình bay</h4>
                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 text-sm">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>Chiều đi: {selectedInvoice.outbound.fromCity} → {selectedInvoice.outbound.toCity}</span>
                    <span className="text-[var(--color-primary-darker)]">{selectedInvoice.outbound.flightNumber}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {selectedInvoice.outbound.airlineName} · {formatDate(selectedInvoice.outbound.flightDate)} · {selectedInvoice.outbound.departureTime} – {selectedInvoice.outbound.arrivalTime}
                  </div>
                </div>

                {selectedInvoice.returnFlight && (
                  <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 text-sm">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>Chiều về: {selectedInvoice.returnFlight.fromCity} → {selectedInvoice.returnFlight.toCity}</span>
                      <span className="text-[var(--color-primary-darker)]">{selectedInvoice.returnFlight.flightNumber}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {selectedInvoice.returnFlight.airlineName} · {formatDate(selectedInvoice.returnFlight.flightDate)} · {selectedInvoice.returnFlight.departureTime} – {selectedInvoice.returnFlight.arrivalTime}
                    </div>
                  </div>
                )}
              </div>

              <div className="py-2 space-y-4 text-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary-darker)]">Thông tin hành khách và liên hệ</h4>
                <dl className="grid grid-cols-2 gap-y-4 gap-x-6">
                  <div>
                    <dt className="text-slate-400 text-xs">Người liên hệ</dt>
                    <dd className="font-bold text-slate-800 mt-0.5">{selectedInvoice.contactName}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 text-xs">Số điện thoại</dt>
                    <dd className="font-bold text-slate-800 mt-0.5 tabular-nums">{selectedInvoice.phone}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-slate-400 text-xs">Email liên hệ</dt>
                    <dd className="font-bold text-slate-800 mt-0.5 break-all">{selectedInvoice.contactEmail}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-slate-400 text-xs">Danh sách hành khách bay</dt>
                    <dd className="font-bold text-slate-800 mt-0.5">
                      {selectedInvoice.passengerNames?.join(', ') || 'Chưa cập nhật'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 text-xs">Trạng thái thanh toán</dt>
                    <dd className={`font-bold mt-0.5 ${
                      selectedInvoice.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'
                    }`}>
                      {selectedInvoice.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </dd>
                  </div>
                </dl>

                {selectedInvoice.note && (
                  <div className="pt-3 border-t border-slate-100">
                    <dt className="text-slate-400 text-xs">Ghi chú</dt>
                    <dd className="text-xs text-slate-600 mt-1 italic">“{selectedInvoice.note}”</dd>
                  </div>
                )}
              </div>

              <BookingCheckInCard
                code={selectedInvoice.code}
                status={selectedInvoice.status}
                paymentStatus={selectedInvoice.paymentStatus}
                service="flight"
              />

              <div className="flex justify-between items-center bg-[var(--color-primary-lightest)] rounded-2xl px-5 py-4 border border-[var(--color-primary-light)]">
                <p className="text-xs font-semibold text-[var(--color-primary-darker)]">Tổng tiền</p>
                <p className="text-xl font-extrabold text-[var(--color-primary-darker)] tabular-nums">
                  {formatMoney(selectedInvoice.totalPrice)}
                </p>
              </div>

            </div>

            <div id="flight-print-invoice-footer" data-print-invoice-footer className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex gap-3 justify-end shrink-0 print:hidden">
              <button
                id="flight-invoice-print"
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
              >
                In chi tiết
              </button>
              <button
                id="flight-invoice-close"
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="rounded-xl bg-[var(--color-primary-darker)] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[var(--color-primary-dark)] cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
