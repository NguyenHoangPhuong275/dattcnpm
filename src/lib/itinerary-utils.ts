import { AppError } from '@/lib/api-response';
import type { Trip } from '@/types/trip';

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function getDateForTripDay(trip: Trip, day: number): Date {
  const tripDate = startOfDay(new Date(trip.startDate));
  tripDate.setDate(tripDate.getDate() + day - 1);
  return tripDate;
}

export function assertTripDayIsSchedulable(trip: Trip, day: number): void {
  const itineraryDate = getDateForTripDay(trip, day);
  const today = startOfDay(new Date());
  const tripEndDate = startOfDay(new Date(trip.endDate));

  if (itineraryDate < today) {
    throw new AppError('VALIDATION_ERROR', 'Không thể thêm lịch trình vào ngày đã qua', 400);
  }

  if (itineraryDate > tripEndDate) {
    throw new AppError('VALIDATION_ERROR', 'Ngày lịch trình vượt quá ngày kết thúc chuyến đi', 400);
  }
}
