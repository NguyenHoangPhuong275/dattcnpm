const DEFAULT_TRIP_LENGTH_DAYS = 5;
const ISO_DATE_SEPARATOR = 'T';

export interface DefaultTripDates {
  startDate: string;
  endDate: string;
}

function toIsoDate(date: Date): string {
  return date.toISOString().split(ISO_DATE_SEPARATOR)[0];
}

export function getDefaultStartDate(baseDate: Date = new Date()): string {
  return toIsoDate(baseDate);
}

export function getDefaultEndDate(daysFromStart: number = DEFAULT_TRIP_LENGTH_DAYS, baseDate: Date = new Date()): string {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + daysFromStart);
  return toIsoDate(date);
}

export function getDefaultTripDates(days: number = DEFAULT_TRIP_LENGTH_DAYS, baseDate: Date = new Date()): DefaultTripDates {
  return {
    startDate: getDefaultStartDate(baseDate),
    endDate: getDefaultEndDate(days, baseDate),
  };
}
