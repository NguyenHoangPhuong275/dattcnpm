'use client';

import QrBookingPayment from '@/components/ui/QrBookingPayment';
import { formatMoney } from '@/lib/trip-utils';
import type { BookingPaymentProps } from '@/types/booking';

const paymentCopy = {
  title: 'Thanh toán vé qua mã QR',
  description: 'Quét mã VietQR bằng ứng dụng ngân hàng. Số tiền và nội dung chuyển khoản đã được điền sẵn.',
  imageAlt: (content: string) => `Mã QR thanh toán vé ${content}`,
  success: 'Đã ghi nhận thông tin thanh toán.',
  error: 'Không thể xác nhận thanh toán vé máy bay',
};

export default function FlightBookingPayment({ bookingId, ...props }: BookingPaymentProps): React.JSX.Element {
  return (
    <QrBookingPayment
      {...props}
      endpoint={`/api/flight-bookings/${bookingId}/pay`}
      buttonId={`confirm-flight-payment-${bookingId}`}
      copy={paymentCopy}
      formatAmount={formatMoney}
    />
  );
}
