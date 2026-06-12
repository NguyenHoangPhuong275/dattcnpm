const DEFAULT_TRIP_LENGTH_DAYS = 5;

export interface DefaultTripDates {
  startDate: string;
  endDate: string;
}

function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDefaultStartDate(baseDate: Date = new Date()): string {
  return toLocalIsoDate(baseDate);
}

export function getDefaultEndDate(daysFromStart: number = DEFAULT_TRIP_LENGTH_DAYS, baseDate: Date = new Date()): string {
  const days = Math.max(1, Math.round(daysFromStart));
  const date = new Date(baseDate);
  date.setDate(date.getDate() + days);
  return toLocalIsoDate(date);
}

export function getDefaultTripDates(days: number = DEFAULT_TRIP_LENGTH_DAYS, baseDate: Date = new Date()): DefaultTripDates {
  return {
    startDate: getDefaultStartDate(baseDate),
    endDate: getDefaultEndDate(days, baseDate),
  };
}
