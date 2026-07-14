import Image from 'next/image';

import { buildDemoCheckInQrUrl, getCheckInAvailability, type CheckInService } from '@/lib/check-in';
import type { BookingPaymentStatus, BookingStatus } from '@/types/booking';

interface BookingCheckInCardProps {
  code: string | null;
  status: BookingStatus;
  paymentStatus: BookingPaymentStatus;
  service: CheckInService;
}

const WAITING_COPY = {
  awaiting_payment: {
    title: 'Chưa thể nhận mã check-in',
    description: 'Hoàn tất thanh toán để nhận mã sau khi yêu cầu được xác nhận.',
  },
  awaiting_confirmation: {
    title: 'Thanh toán đã được ghi nhận',
    description: 'Mã check-in sẽ xuất hiện tại đây sau khi quản trị viên xác nhận yêu cầu.',
  },
  preparing: {
    title: 'Mã check-in đang được cập nhật',
    description: 'Yêu cầu đã được xác nhận. Vui lòng tải lại trang sau ít phút.',
  },
} as const;

export default function BookingCheckInCard({
  code,
  status,
  paymentStatus,
  service,
}: BookingCheckInCardProps): React.JSX.Element | null {
  const availability = getCheckInAvailability({ code, status, paymentStatus });

  if (availability === 'cancelled') return null;

  if (availability !== 'ready') {
    const copy = WAITING_COPY[availability];
    return (
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-5 py-4">
        <h4 className="text-sm font-extrabold text-[var(--color-text)]">{copy.title}</h4>
        <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">{copy.description}</p>
      </section>
    );
  }

  if (!code) return null;

  return (
    <section className="rounded-2xl border border-[var(--color-primary-light)] bg-[var(--color-primary-lightest)] px-5 py-5 text-center">
      <h4 className="text-sm font-extrabold text-[var(--color-primary-darker)]">Mã check-in</h4>
      <Image
        src={buildDemoCheckInQrUrl(code, service)}
        alt={`Mã QR check-in ${code}`}
        width={220}
        height={220}
        unoptimized
        className="mx-auto mt-4 h-44 w-44 rounded-xl border border-[var(--color-border)] bg-white p-2"
      />
      <p className="mt-3 text-lg font-extrabold tracking-[0.12em] text-[var(--color-primary-darker)]">{code}</p>
      <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">Xuất trình mã này khi làm thủ tục.</p>
    </section>
  );
}
