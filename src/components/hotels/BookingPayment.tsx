'use client';

import QrBookingPayment from '@/components/ui/QrBookingPayment';
import { formatHotelPrice } from '@/lib/hotel-utils';
import type { BookingPaymentProps } from '@/types/booking';

const paymentCopy = {
  title: 'Thanh toán qua mã QR',
  description: 'Quét mã VietQR bằng ứng dụng ngân hàng, số tiền và nội dung đã được điền sẵn.',
  imageAlt: (content: string) => `Mã QR chuyển khoản ${content}`,
  success: 'Đã ghi nhận thông tin thanh toán.',
  error: 'Không thể xác nhận thanh toán',
};

export default function BookingPayment({ bookingId, ...props }: BookingPaymentProps): React.JSX.Element {
  return (
    <QrBookingPayment
      {...props}
      endpoint={`/api/bookings/${bookingId}/pay`}
      buttonId={`confirm-hotel-payment-${bookingId}`}
      copy={paymentCopy}
      formatAmount={formatHotelPrice}
    />
  );
}
