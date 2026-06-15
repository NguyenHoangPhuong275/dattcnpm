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

export function formatDate(value?: string | Date | null): string {
  const date = parseValidDate(value);
  if (!date) return '—';
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
