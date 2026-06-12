import { LOCALITIES } from './localities';

const DEFAULT_TRIP_IMAGE = '/images/hanoi_temple.jpg';
const DAY_MS = 86_400_000;
const DEFAULT_LOCALE = 'vi-VN';
const DEFAULT_CURRENCY = 'VND';

export interface TripDisplayInfo {
  destination: string;
  coverImage?: string | null;
}

export interface TripDuration {
  days: number;
  nights: number;
  label: string;
}

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

function parseValidDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function calculateDuration(startDate?: string | null, endDate?: string | null): TripDuration {
  const start = parseValidDate(startDate);
  const end = parseValidDate(endDate);

  if (!start || !end) {
    return { days: 1, nights: 0, label: '1 ngày' };
  }

  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1);
  const nights = Math.max(0, days - 1);
  return { days, nights, label: `${days} ngày ${nights} đêm` };
}

export function getTripImage(trip: TripDisplayInfo | null | undefined): string {
  if (trip?.coverImage) return trip.coverImage;

  const destination = normalizeText(trip?.destination || '');
  const locality = LOCALITIES.find((item) => destination.includes(normalizeText(item.name)));
  return locality?.image || DEFAULT_TRIP_IMAGE;
}

export function getTripCities(destination: string): string[] {
  return destination
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
}

export function formatDateRange(startDate: string, endDate: string): string {
  const start = parseValidDate(startDate);
  const end = parseValidDate(endDate);

  if (!start || !end) {
    return `${startDate} - ${endDate}`;
  }

  const { days, nights } = calculateDuration(startDate, endDate);
  const startLabel = start.toLocaleDateString(DEFAULT_LOCALE, { day: '2-digit', month: '2-digit' });
  const endLabel = end.toLocaleDateString(DEFAULT_LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric' });

  return `${startLabel} - ${endLabel} (${days} ngày ${nights} đêm)`;
}

export function getDuration(startDate?: string, endDate?: string): TripDuration {
  return calculateDuration(startDate, endDate);
}

export function formatTripDayDate(startDate: string, day: number): string {
  const date = parseValidDate(startDate);
  if (!date) return '';

  date.setDate(date.getDate() + day - 1);
  return date.toLocaleDateString(DEFAULT_LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatMoney(value: number, locale: string = DEFAULT_LOCALE, currency: string = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
