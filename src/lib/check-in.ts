import type { BookingPaymentStatus, BookingStatus } from '@/types/booking';

export type CheckInService = 'hotel' | 'flight';

export type CheckInAvailability =
  | 'awaiting_payment'
  | 'awaiting_confirmation'
  | 'preparing'
  | 'ready'
  | 'cancelled';

interface CheckInStatusInput {
  code: string | null;
  status: BookingStatus;
  paymentStatus: BookingPaymentStatus;
}

export function getCheckInAvailability({
  code,
  status,
  paymentStatus,
}: CheckInStatusInput): CheckInAvailability {
  if (status === 'cancelled') return 'cancelled';
  if (paymentStatus !== 'paid') return 'awaiting_payment';
  if (status !== 'confirmed') return 'awaiting_confirmation';
  return code ? 'ready' : 'preparing';
}

export function buildDemoCheckInQrUrl(code: string, service: CheckInService): string {
  const params = new URLSearchParams({
    size: '220x220',
    margin: '12',
    data: `LOTUS_CHECK_IN|${service.toUpperCase()}|${code.trim()}`,
  });
  return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`;
}
