'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import BookingPayment from '@/components/hotels/BookingPayment';
import BookingCheckInCard from '@/components/profile/BookingCheckInCard';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { usePaginatedBookingList } from '@/hooks/usePaginatedBookingList';
import { ROUTES } from '@/lib/constants';
import { formatDate } from '@/lib/date';
import { formatHotelPrice } from '@/lib/hotel-utils';
import type { HotelBookingListItem } from '@/types/booking';

const STATUS_META: Record<HotelBookingListItem['status'], { label: string; className: string }> = {
  pending: { label: 'Chờ xác nhận', className: 'bg-[var(--color-warning)]/15 text-amber-700' },
  confirmed: { label: 'Đã xác nhận', className: 'bg-[var(--color-success)]/15 text-emerald-700' },
  cancelled: { label: 'Đã hủy', className: 'bg-[var(--color-bg)] text-[var(--color-text-muted)]' },
};

const BOOKINGS_ERROR_MESSAGE = 'Không thể tải danh sách đặt phòng';

interface MyBookingsSectionProps {
  userId: string;
}

export default function MyBookingsSection({ userId }: MyBookingsSectionProps): React.JSX.Element {
  const [payingId, setPayingId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<HotelBookingListItem | null>(null);
  const {
    data: bookings,
    status,
    error,
    loadingMore,
    hasMore,
    actions: { loadFirstPage, loadMore, refreshLoadedPages },
  } = usePaginatedBookingList<HotelBookingListItem>({
    endpoint: '/api/bookings/my',
    fallbackMessage: BOOKINGS_ERROR_MESSAGE,
    userId,
  });

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-[var(--color-text-muted)]">
        <LoadingSpinner size="md" className="text-[var(--color-primary-dark)]" />
        Đang tải danh sách đặt phòng...
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
        <span className="text-sm text-red-600">{error}</span>
        <button id="retry-hotel-bookings" type="button" onClick={loadFirstPage} className="shrink-0 text-xs font-semibold text-[var(--color-primary-darker)] hover:underline">
          Thử lại
        </button>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <EmptyState
        title="Bạn chưa có đặt phòng nào."
        description="Tìm và đặt khách sạn cho chuyến đi sắp tới của bạn."
        actionLabel="Tìm khách sạn"
        actionHref={ROUTES.hotels}
      />
    );
  }

  return (
    <>
      <ul className="space-y-3">
        {bookings.map((booking) => {
          const statusMeta = STATUS_META[booking.status];
          return (
            <li key={booking.id} className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      id={`profile-hotel-booking-${booking.id}`}
                      type="button"
                      onClick={() => setSelectedInvoice(booking)}
                      className="text-sm font-semibold text-[var(--color-text)] hover:text-[var(--color-primary-darker)] hover:underline cursor-pointer text-left"
                    >
                      {booking.hotelName ?? 'Khách sạn'}
                    </button>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusMeta.className}`}>
                      {statusMeta.label}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    {booking.roomName} · {booking.nights} đêm · {booking.guests} khách
                  </div>
                  <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                    {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                  </div>
                </div>
                <div className="shrink-0 text-right flex flex-col items-end gap-1">
                  <div className="text-lg font-extrabold tabular-nums text-[var(--color-primary-darker)]">
                    {formatHotelPrice(booking.totalPrice)}
                  </div>
                  {booking.status === 'pending' && (
                    <p className="text-xs text-[var(--color-text-muted)]">Đang chờ xác nhận</p>
                  )}
                  <div>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                        booking.paymentStatus === 'paid'
                          ? 'bg-[var(--color-success)]/15 text-emerald-700'
                          : 'bg-[var(--color-warning)]/15 text-amber-700'
                      }`}
                    >
                      {booking.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </span>
                  </div>
                  <button
                    id={`profile-hotel-booking-details-${booking.id}`}
                    type="button"
                    onClick={() => setSelectedInvoice(booking)}
                    className="mt-1 text-xs font-bold text-[var(--color-primary-darker)] hover:underline cursor-pointer"
                  >
                    Xem chi tiết đặt phòng
                  </button>
                </div>
              </div>

              {booking.status !== 'cancelled' && booking.paymentStatus === 'unpaid' && (
                <div className="mt-4 border-t border-[var(--color-border)] pt-4">
                  {payingId === booking.id ? (
                    <BookingPayment
                      bookingId={booking.id}
                      payment={booking.payment}
                      paymentStatus={booking.paymentStatus}
                      onPaid={() => { void refreshLoadedPages(); }}
                    />
                  ) : (
                    <button
                      id={`open-hotel-payment-${booking.id}`}
                      type="button"
                      onClick={() => setPayingId(booking.id)}
                      className="rounded-xl bg-[var(--color-primary-darker)] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[var(--color-primary-dark)]"
                    >
                      Thanh toán
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {(hasMore || loadingMore || error) && (
        <div className="mt-5 flex flex-col items-center gap-2">
          {error && <p className="text-sm font-semibold text-[var(--color-danger)]">{error}</p>}
          {hasMore && (
            <button
              id="load-more-hotel-bookings"
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              aria-busy={loadingMore}
              className="rounded-xl border border-[var(--color-border)] bg-white px-5 py-2.5 text-sm font-bold text-[var(--color-primary-darker)] transition-colors hover:bg-[var(--color-primary-lightest)] disabled:cursor-wait disabled:opacity-60"
            >
              {loadingMore ? 'Đang tải thêm...' : 'Xem thêm đặt phòng'}
            </button>
          )}
        </div>
      )}

      {selectedInvoice && (
        <div id="hotel-print-invoice-backdrop" data-print-invoice-backdrop className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div id="hotel-print-invoice-modal" data-print-invoice-modal role="dialog" aria-modal="true" aria-label="Chi tiết đặt phòng" className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
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
                <h3 className="font-display text-xl font-extrabold text-[var(--color-text)] leading-tight">{selectedInvoice.hotelName}</h3>
                <p className="text-sm font-medium text-slate-500">{selectedInvoice.roomName}</p>
              </div>

              <div className="border-t border-b border-dashed border-slate-200 py-4 my-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary-darker)] mb-3">Thông tin chi tiết</h4>
                <dl className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                  {selectedInvoice.guestName && (
                    <div>
                      <dt className="text-slate-400 text-xs">Người đặt phòng</dt>
                      <dd className="font-bold text-slate-800 mt-0.5">
                        {selectedInvoice.guestTitle ? `${selectedInvoice.guestTitle} ` : ''}{selectedInvoice.guestName}
                      </dd>
                    </div>
                  )}
                  {selectedInvoice.phone && (
                    <div>
                      <dt className="text-slate-400 text-xs">Số điện thoại liên hệ</dt>
                      <dd className="font-bold text-slate-800 mt-0.5 tabular-nums">{selectedInvoice.phone}</dd>
                    </div>
                  )}
                  {selectedInvoice.contactEmail && (
                    <div>
                      <dt className="text-slate-400 text-xs">Email liên hệ</dt>
                      <dd className="font-bold text-slate-800 mt-0.5 break-all">{selectedInvoice.contactEmail}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-slate-400 text-xs">Số lượng khách</dt>
                    <dd className="font-bold text-slate-800 mt-0.5">{selectedInvoice.guests} khách</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 text-xs">Ngày nhận phòng</dt>
                    <dd className="font-bold text-slate-800 mt-0.5">{formatDate(selectedInvoice.checkIn)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 text-xs">Ngày trả phòng</dt>
                    <dd className="font-bold text-slate-800 mt-0.5">{formatDate(selectedInvoice.checkOut)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 text-xs">Số đêm lưu trú</dt>
                    <dd className="font-bold text-slate-800 mt-0.5">{selectedInvoice.nights} đêm</dd>
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
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <dt className="text-slate-400 text-xs">Yêu cầu đặc biệt</dt>
                    <dd className="text-xs text-slate-600 mt-1 italic">“{selectedInvoice.note}”</dd>
                  </div>
                )}
              </div>

              <BookingCheckInCard
                code={selectedInvoice.code}
                status={selectedInvoice.status}
                paymentStatus={selectedInvoice.paymentStatus}
                service="hotel"
              />

              <div className="flex justify-between items-center bg-[var(--color-primary-lightest)] rounded-2xl px-5 py-4 border border-[var(--color-primary-light)]">
                <p className="text-xs font-semibold text-[var(--color-primary-darker)]">Tổng tiền</p>
                <p className="text-xl font-extrabold text-[var(--color-primary-darker)] tabular-nums">
                  {formatHotelPrice(selectedInvoice.totalPrice)}
                </p>
              </div>

            </div>

            <div id="hotel-print-invoice-footer" data-print-invoice-footer className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex gap-3 justify-end shrink-0">
              <button
                id="hotel-invoice-print"
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
              >
                In chi tiết
              </button>
              <button
                id="hotel-invoice-close"
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
    </>
  );
}
