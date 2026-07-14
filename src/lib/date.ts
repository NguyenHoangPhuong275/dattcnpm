const DEFAULT_TRIP_LENGTH_DAYS = 5;
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
export const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';

export interface DefaultTripDates {
  startDate: string;
  endDate: string;
}

export interface DateTimeParts {
  date: string;
  time: string;
}

export function parseDateOnly(value: string): Date | null {
  const match = DATE_ONLY_PATTERN.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

export function isValidDateOnly(value: string): boolean {
  return parseDateOnly(value) !== null;
}

export function getDateTimeParts(
  value: Date = new Date(),
  timeZone: string = VIETNAM_TIME_ZONE,
): DateTimeParts {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(value);
  const read = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? '';

  return {
    date: `${read('year')}-${read('month')}-${read('day')}`,
    time: `${read('hour')}:${read('minute')}`,
  };
}

export function getVietnamDateTimeParts(value: Date = new Date()): DateTimeParts {
  return getDateTimeParts(value, VIETNAM_TIME_ZONE);
}

export function differenceInCalendarDays(start: string, end: string): number | null {
  const startDate = parseDateOnly(start);
  const endDate = parseDateOnly(end);
  if (!startDate || !endDate) return null;
  return Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000);
}

function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateInputValue(
  value?: string | null,
  options: { timeZone?: 'local' | 'utc' } = {}
): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  if (options.timeZone === 'utc') {
    return formatUtcDateOnly(value, value);
  }

  return toLocalIsoDate(date);
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

export function parseValidDate(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatUtcDateOnly(
  value: unknown,
  fallback = '',
  onError?: (error: unknown) => void
): string {
  try {
    const date = parseValidDate(value);
    return date ? date.toISOString().split('T')[0] : fallback;
  } catch (error) {
    onError?.(error);
    return fallback;
  }
}

export function formatUtcDateOnlyStrict(value: string | Date): string {
  return new Date(value).toISOString().split('T')[0];
}

export function formatDate(value?: string | Date | null): string {
  const date = parseValidDate(value);
  if (!date) return '—';
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
