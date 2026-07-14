import { AppError } from '@/lib/api-response';
import { formatUtcDateOnlyStrict, getVietnamDateTimeParts, parseDateOnly } from '@/lib/date';
import type { Trip } from '@/types/trip';

export function getDateOnlyForTripDay(trip: Trip, day: number): string {
  const startDate = parseDateOnly(formatUtcDateOnlyStrict(trip.startDate));
  if (!startDate) {
    throw new AppError('VALIDATION_ERROR', 'Ngày bắt đầu chuyến đi không hợp lệ', 400);
  }
  startDate.setUTCDate(startDate.getUTCDate() + day - 1);
  return startDate.toISOString().slice(0, 10);
}

export function getDateForTripDay(trip: Trip, day: number): Date {
  const [year, month, date] = getDateOnlyForTripDay(trip, day).split('-').map(Number);
  return new Date(year, month - 1, date);
}

export function assertTripDayIsSchedulable(trip: Trip, day: number, now: Date = new Date()): void {
  const itineraryDate = getDateOnlyForTripDay(trip, day);
  const today = getVietnamDateTimeParts(now).date;
  const tripEndDate = formatUtcDateOnlyStrict(trip.endDate);

  if (itineraryDate < today) {
    throw new AppError('VALIDATION_ERROR', 'Không thể thêm lịch trình vào ngày đã qua', 400);
  }

  if (itineraryDate > tripEndDate) {
    throw new AppError('VALIDATION_ERROR', 'Ngày lịch trình vượt quá ngày kết thúc chuyến đi', 400);
  }
}
