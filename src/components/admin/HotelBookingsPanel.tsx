'use client';

import React, { useCallback, useEffect, useState } from 'react';

import { apiRequestStrictJson, getApiErrorMessage } from '@/lib/api-client';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatHotelPrice } from '@/lib/hotel-utils';

interface AdminBookingItem {
  type: 'room' | 'flight';
  id: string;
  code: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentStatus: 'unpaid' | 'paid';
  totalPrice: number;
  contactName: string;
  phone: string;
  contactEmail: string;
  note: string | null;
  createdAt?: string | null;
  paidAt?: string | null;

  hotelName?: string | null;
  roomName?: string;
  checkIn?: string;
  checkOut?: string;
  nights?: number;
  guests?: number;
  guestTitle?: string;
  guestName?: string;

  outboundSummary?: string;
  returnSummary?: string;
  passengers?: number;
  passengerNames?: string[];
}

interface BookingsResponse {
  success?: boolean;
  data?: AdminBookingItem[];
  message?: string;
}

interface UpdateResponse {
  success?: boolean;
  message?: string;
}

const STATUS_META: Record<AdminBookingItem['status'], { label: string; className: string }> = {
  pending: { label: 'Chờ xác nhận', className: 'bg-[var(--color-warning)]/15 text-amber-700' },
  confirmed: { label: 'Đã xác nhận', className: 'bg-[var(--color-success)]/15 text-emerald-700' },
  cancelled: { label: 'Đã hủy', className: 'bg-[var(--color-bg)] text-[var(--color-text-muted)]' },
};

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('vi-VN');
}

interface HotelBookingsPanelProps {
  onNotify: (message: string, type: 'success' | 'error') => void;
}

export default function HotelBookingsPanel({ onNotify }: HotelBookingsPanelProps): React.JSX.Element {
  const [bookings, setBookings] = useState<AdminBookingItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'all'>('pending');
  const [typeFilter, setTypeFilter] = useState<'all' | 'room' | 'flight'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<AdminBookingItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const params = [];
      if (statusFilter === 'pending') params.push('status=pending');
      if (typeFilter !== 'all') params.push(`type=${typeFilter}`);
      const query = params.length ? `?${params.join('&')}` : '';

      const { response, data } = await apiRequestStrictJson<BookingsResponse>(`/api/admin/bookings${query}`);
      if (!response.ok || data.success === false) {
        setErrorMessage(getApiErrorMessage(data, 'Không thể tải danh sách đặt chỗ'));
        return;
      }
      setBookings(Array.isArray(data.data) ? data.data : []);
    } catch {
      setErrorMessage('Không thể tải danh sách đặt chỗ');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpdate = async (id: string, status: 'confirmed' | 'cancelled'): Promise<void> => {
    setUpdatingId(id);
    try {
      const { response, data } = await apiRequestStrictJson<UpdateResponse>(`/api/admin/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok || data.success === false) {
        onNotify(getApiErrorMessage(data, 'Không thể cập nhật đặt chỗ'), 'error');
        return;
      }
      onNotify(data.message || 'Đã cập nhật đặt chỗ', 'success');
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status } : b))
      );
      if (selectedBooking && selectedBooking.id === id) {
        setSelectedBooking((prev) => (prev ? { ...prev, status } : null));
      }
    } catch {
      onNotify('Không thể cập nhật đặt chỗ', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      b.code?.toLowerCase().includes(query) ||
      b.contactName?.toLowerCase().includes(query) ||
      b.phone?.toLowerCase().includes(query) ||
      b.contactEmail?.toLowerCase().includes(query) ||
      (b.hotelName && b.hotelName.toLowerCase().includes(query)) ||
      (b.roomName && b.roomName.toLowerCase().includes(query))
    );
  });

  return (
    <section className="admin-surface overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-black/[0.055] px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div className="flex flex-col gap-1.5 sm:gap-2">
          <h2 className="text-lg font-extrabold text-[var(--color-text)]">
            {typeFilter === 'all' && 'Tất cả yêu cầu đặt chỗ'}
            {typeFilter === 'room' && 'Yêu cầu đặt phòng khách sạn'}
            {typeFilter === 'flight' && 'Yêu cầu đặt vé máy bay'}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="admin-bookings-type-all"
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${typeFilter === 'all' ? 'bg-[var(--color-primary-darker)] text-white border-transparent' : 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-bg)]'}`}
            >
              Tất cả
            </button>
            <button
              id="admin-bookings-type-room"
              type="button"
              onClick={() => setTypeFilter('room')}
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${typeFilter === 'room' ? 'bg-[var(--color-primary-darker)] text-white border-transparent' : 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-bg)]'}`}
            >
              Phòng khách sạn
            </button>
            <button
              id="admin-bookings-type-flight"
              type="button"
              onClick={() => setTypeFilter('flight')}
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${typeFilter === 'flight' ? 'bg-[var(--color-primary-darker)] text-white border-transparent' : 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-bg)]'}`}
            >
              Vé máy bay
            </button>
          </div>
        </div>
        <div className="admin-segment self-start sm:self-center">
          <button
            id="admin-bookings-pending"
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${statusFilter === 'pending' ? 'bg-white text-[var(--color-primary-darker)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'}`}
          >
            Chờ xác nhận
          </button>
          <button
            id="admin-bookings-all"
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${statusFilter === 'all' ? 'bg-white text-[var(--color-primary-darker)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'}`}
          >
            Tất cả
          </button>
        </div>
      </div>

      <div className="p-6 sm:px-7">
        <div className="mb-4">
          <input
            id="admin-bookings-search"
            type="text"
            aria-label="Tìm đặt chỗ"
            placeholder="Tìm theo mã đặt chỗ, số điện thoại hoặc tên khách"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-field"
          />
        </div>

        {isLoading && filteredBookings.length === 0 && (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="sm" className="text-[var(--color-primary-dark)]" />
          </div>
        )}

        {errorMessage && !isLoading && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-3 py-2">
            <span className="text-sm text-[var(--color-danger)]">{errorMessage}</span>
            <button id="admin-bookings-retry" type="button" onClick={load} className="shrink-0 text-xs font-semibold text-[var(--color-primary-darker)] hover:underline">
              Thử lại
            </button>
          </div>
        )}

        {!isLoading && !errorMessage && filteredBookings.length === 0 && (
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-6 text-center text-sm text-[var(--color-text-muted)]">
            {searchQuery ? 'Không tìm thấy đặt chỗ phù hợp.' : (statusFilter === 'pending' ? 'Không có đặt chỗ nào đang chờ xác nhận.' : 'Chưa có đặt chỗ nào.')}
          </div>
        )}

        {filteredBookings.length > 0 && (
          <ul className="divide-y divide-[var(--color-border)]">
            {filteredBookings.map((booking) => {
              const statusMeta = STATUS_META[booking.status];
              const isFlight = booking.type === 'flight';

              return (
                <li key={booking.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold tabular-nums text-[var(--color-primary-darker)]">{booking.code}</span>
                      <span className="text-sm font-semibold text-[var(--color-text)]">
                        {isFlight ? 'Đặt vé máy bay' : (booking.hotelName ?? 'Khách sạn')}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusMeta.className}`}>
                        {statusMeta.label}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          booking.paymentStatus === 'paid'
                            ? 'bg-[var(--color-success)]/15 text-emerald-700'
                            : 'bg-[var(--color-warning)]/15 text-amber-700'
                        }`}
                      >
                        {booking.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                      </span>
                    </div>

                    <div className="mt-1 text-sm text-[var(--color-text-secondary)]">
                      {isFlight ? (
                        <span>Hành trình: {booking.outboundSummary?.split('): ')[1] || booking.outboundSummary}</span>
                      ) : (
                        <span>Phòng: {booking.roomName}</span>
                      )}
                      {' · Tổng tiền: '}
                      <span className="font-bold tabular-nums text-[var(--color-text)]">{formatHotelPrice(booking.totalPrice)}</span>
                    </div>

                    <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                      Khách hàng: <span className="font-semibold text-[var(--color-text-secondary)]">{booking.contactName}</span>
                      {booking.createdAt && ` • Đặt lúc ${new Date(booking.createdAt).toLocaleString('vi-VN')}`}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      id={`admin-booking-detail-${booking.id}`}
                      type="button"
                      onClick={() => setSelectedBooking(booking)}
                      className="rounded-full border border-[var(--color-border)] bg-white px-3.5 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg)] cursor-pointer"
                    >
                      Xem chi tiết
                    </button>

                    {booking.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          id={`admin-booking-confirm-${booking.id}`}
                          type="button"
                          onClick={() => handleUpdate(booking.id, 'confirmed')}
                          disabled={updatingId !== null || !booking.paidAt}
                          title={booking.paidAt ? 'Xác nhận đặt chỗ' : 'Chờ khách hoàn tất thanh toán'}
                          className="rounded-full bg-[var(--color-primary-darker)] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                        >
                          {updatingId === booking.id ? 'Đang xử lý...' : 'Xác nhận đặt chỗ'}
                        </button>
                        <button
                          id={`admin-booking-cancel-${booking.id}`}
                          type="button"
                          onClick={() => handleUpdate(booking.id, 'cancelled')}
                          disabled={updatingId !== null}
                          title="Hủy yêu cầu"
                          className="rounded-full border border-[var(--color-border)] bg-white px-4 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                        >
                          Hủy yêu cầu
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative flex max-h-[90dvh] w-full max-w-lg flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
              <h2 className="font-display text-base font-extrabold text-slate-800">
                Chi tiết yêu cầu đặt chỗ
              </h2>
              <button
                id="admin-booking-modal-close-icon"
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                aria-label="Đóng"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="text-center space-y-2">
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                  selectedBooking.status === 'confirmed'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : selectedBooking.status === 'pending'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}>
                  {selectedBooking.status === 'confirmed' ? 'Đã xác nhận' : selectedBooking.status === 'pending' ? 'Chờ xác nhận' : 'Đã hủy'}
                </span>
                <h3 className="font-display text-xl font-extrabold text-[var(--color-text)] leading-tight">
                  {selectedBooking.code}
                </h3>
                <p className="text-sm font-medium text-slate-500">
                  Loại dịch vụ: {selectedBooking.type === 'flight' ? 'Vé máy bay' : 'Phòng khách sạn'}
                </p>
              </div>

              <div className="border-t border-b border-dashed border-slate-200 py-4 my-2 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary-darker)]">Thông tin đặt chỗ</h4>
                {selectedBooking.type === 'flight' ? (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 text-sm">
                      <div className="font-bold text-slate-800">Chặng đi</div>
                      <div className="mt-1 text-xs text-slate-600 font-medium">{selectedBooking.outboundSummary}</div>
                    </div>
                    {selectedBooking.returnSummary && (
                      <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 text-sm">
                        <div className="font-bold text-slate-800">Chặng về</div>
                        <div className="mt-1 text-xs text-slate-600 font-medium">{selectedBooking.returnSummary}</div>
                      </div>
                    )}
                    <div className="text-sm">
                      <span className="text-slate-400">Số lượng khách bay: </span>
                      <span className="font-semibold text-slate-800">{selectedBooking.passengers} khách</span>
                    </div>
                    {selectedBooking.passengerNames && selectedBooking.passengerNames.length > 0 && (
                      <div className="text-sm">
                        <span className="text-slate-400">Danh sách khách bay: </span>
                        <span className="font-semibold text-slate-800">{selectedBooking.passengerNames.join(', ')}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Khách sạn:</span>
                      <span className="font-bold text-slate-800">{selectedBooking.hotelName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Loại phòng:</span>
                      <span className="font-bold text-slate-800">{selectedBooking.roomName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Thời gian lưu trú:</span>
                      <span className="font-bold text-slate-800">
                        {selectedBooking.checkIn ? formatDate(selectedBooking.checkIn) : ''} – {selectedBooking.checkOut ? formatDate(selectedBooking.checkOut) : ''} ({selectedBooking.nights} đêm)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Số lượng khách:</span>
                      <span className="font-bold text-slate-800">{selectedBooking.guests} khách</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="py-2 space-y-3 text-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary-darker)]">Thông tin liên hệ</h4>
                <div className="grid grid-cols-2 gap-y-3">
                  <div>
                    <span className="text-slate-400 text-xs block">Họ tên</span>
                    <span className="font-bold text-slate-800">{selectedBooking.contactName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block">Số điện thoại</span>
                    <span className="font-bold text-slate-800 tabular-nums">{selectedBooking.phone}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 text-xs block">Email</span>
                    <span className="font-bold text-slate-800 break-all">{selectedBooking.contactEmail}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block">Thanh toán</span>
                    <span className={`font-bold ${selectedBooking.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {selectedBooking.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </span>
                  </div>
                  {selectedBooking.createdAt && (
                    <div>
                      <span className="text-slate-400 text-xs block">Thời gian tạo</span>
                      <span className="font-semibold text-slate-700">{new Date(selectedBooking.createdAt).toLocaleString('vi-VN')}</span>
                    </div>
                  )}
                </div>

                {selectedBooking.note && (
                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-slate-400 text-xs block">Ghi chú từ khách hàng</span>
                    <span className="text-xs text-slate-600 mt-1 italic block">“{selectedBooking.note}”</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center bg-[var(--color-primary-lightest)] rounded-2xl px-5 py-4 border border-[var(--color-primary-light)]">
                <p className="text-xs font-semibold text-[var(--color-primary-darker)]">Tổng tiền</p>
                <p className="text-xl font-extrabold text-[var(--color-primary-darker)] tabular-nums">
                  {formatHotelPrice(selectedBooking.totalPrice)}
                </p>
              </div>

            </div>

            <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex gap-3 justify-between items-center shrink-0">
              <div>
                {selectedBooking.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      id={`admin-booking-modal-confirm-${selectedBooking.id}`}
                      type="button"
                      onClick={() => handleUpdate(selectedBooking.id, 'confirmed')}
                      disabled={updatingId !== null || !selectedBooking.paidAt}
                      title={selectedBooking.paidAt ? 'Xác nhận đặt chỗ' : 'Chờ khách hoàn tất thanh toán'}
                      className="rounded-xl bg-[var(--color-primary-darker)] px-4 py-2 text-xs font-bold text-white transition hover:bg-[var(--color-primary-dark)] disabled:opacity-50 cursor-pointer"
                    >
                      {updatingId === selectedBooking.id ? 'Đang xử lý...' : 'Xác nhận đặt chỗ'}
                    </button>
                    <button
                      id={`admin-booking-modal-cancel-${selectedBooking.id}`}
                      type="button"
                      onClick={() => handleUpdate(selectedBooking.id, 'cancelled')}
                      disabled={updatingId !== null}
                      title="Hủy yêu cầu"
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                    >
                      Hủy yêu cầu
                    </button>
                  </div>
                )}
              </div>
              <button
                id="admin-booking-modal-close"
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="rounded-xl bg-slate-200 px-5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-300 cursor-pointer"
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
