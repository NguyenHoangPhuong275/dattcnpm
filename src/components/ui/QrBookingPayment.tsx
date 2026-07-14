'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';

import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { apiRequest, ensureApiSuccess, getApiErrorMessage, type ApiEnvelope } from '@/lib/api-client';
import type { BookingPaymentProps } from '@/types/booking';

interface PaymentCopy {
  title: string;
  description: string;
  imageAlt: (content: string) => string;
  success: string;
  error: string;
}

interface QrBookingPaymentProps extends Omit<BookingPaymentProps, 'bookingId'> {
  endpoint: string;
  buttonId: string;
  copy: PaymentCopy;
  formatAmount: (amount: number) => string;
}

export default function QrBookingPayment({
  payment,
  paymentStatus,
  onPaid,
  endpoint,
  buttonId,
  copy,
  formatAmount,
}: QrBookingPaymentProps): React.JSX.Element {
  const [paid, setPaid] = useState(paymentStatus === 'paid');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const requestInFlight = useRef(false);
  const isDemo = payment.mode === 'demo';
  const paymentReady = Boolean(
    payment.qrImageUrl
    && (isDemo || (payment.bankCode && payment.accountNo && payment.accountName)),
  );

  const confirmPaid = async (): Promise<void> => {
    if (requestInFlight.current || paid) return;
    requestInFlight.current = true;
    setSubmitting(true);
    setError('');

    try {
      const { response, data } = await apiRequest<ApiEnvelope>(endpoint, { method: 'POST' });
      ensureApiSuccess(response, data, copy.error);
      setPaid(true);
      onPaid?.();
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, copy.error));
    } finally {
      requestInFlight.current = false;
      setSubmitting(false);
    }
  };

  if (paid) {
    return (
      <div className="rounded-xl border border-[var(--color-success)]/30 bg-[var(--color-success)]/5 px-4 py-3 text-sm font-semibold text-[var(--color-success)]">
        {copy.success}
      </div>
    );
  }

  if (!paymentReady) {
    return (
      <div className="rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5 px-4 py-3">
        <h3 className="text-sm font-bold text-[var(--color-text)]">Thanh toán trực tuyến chưa khả dụng</h3>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Vui lòng quay lại sau để hoàn tất thanh toán.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
      <h3 className="text-base font-bold text-[var(--color-text)]">{copy.title}</h3>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        {isDemo ? 'Quét mã QR để hoàn tất bước thanh toán cho yêu cầu này.' : copy.description}
      </p>

      <div className={`mt-4 flex flex-col gap-5 ${isDemo ? 'items-center' : 'sm:flex-row sm:items-center'}`}>
        <Image
          src={payment.qrImageUrl}
          alt={isDemo ? 'Mã QR thanh toán' : copy.imageAlt(payment.content)}
          width={220}
          height={isDemo ? 220 : 280}
          unoptimized
          className={`h-auto w-52 shrink-0 rounded-xl border border-[var(--color-border)] ${isDemo ? 'mx-auto' : 'mx-auto sm:mx-0'}`}
        />

        {isDemo ? (
          <div className="rounded-xl bg-[var(--color-bg)] px-5 py-3 text-center">
            <p className="text-xs font-semibold text-[var(--color-text-muted)]">Giá trị thanh toán</p>
            <p className="mt-1 text-lg font-extrabold tabular-nums text-[var(--color-primary-darker)]">
              {formatAmount(payment.amount)}
            </p>
          </div>
        ) : (
          <dl className="flex-1 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--color-text-muted)]">Ngân hàng</dt>
              <dd className="font-bold text-[var(--color-text)]">{payment.bankCode}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--color-text-muted)]">Số tài khoản</dt>
              <dd className="font-bold tabular-nums text-[var(--color-text)]">{payment.accountNo}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--color-text-muted)]">Chủ tài khoản</dt>
              <dd className="text-right font-bold text-[var(--color-text)]">{payment.accountName}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--color-text-muted)]">Số tiền</dt>
              <dd className="font-bold tabular-nums text-[var(--color-primary-darker)]">{formatAmount(payment.amount)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--color-text-muted)]">Nội dung</dt>
              <dd className="font-bold tabular-nums text-[var(--color-text)]">{payment.content}</dd>
            </div>
          </dl>
        )}
      </div>

      <button
        id={buttonId}
        type="button"
        onClick={confirmPaid}
        disabled={submitting}
        className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary-darker)] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--color-primary-dark)] disabled:opacity-50"
      >
        {submitting ? (
          <>
            <LoadingSpinner size="sm" className="border-t-transparent" />
            <span>Đang xử lý...</span>
          </>
        ) : isDemo ? (
          'Xác nhận đã thanh toán'
        ) : (
          'Xác nhận đã chuyển khoản'
        )}
      </button>
      {error && <p className="mt-2 text-sm font-semibold text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}
