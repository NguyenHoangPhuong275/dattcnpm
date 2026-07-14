import { describe, expect, it } from 'vitest';
import {
  differenceInCalendarDays,
  formatDate,
  formatDateInputValue,
  formatUtcDateOnly,
  formatUtcDateOnlyStrict,
  getVietnamDateTimeParts,
  getDefaultEndDate,
  getDefaultStartDate,
  getDefaultTripDates,
  isValidDateOnly,
  parseDateOnly,
  parseValidDate,
} from '@/lib/date';

describe('date-only validation and Vietnam time', () => {
  it('rejects normalized or malformed calendar dates', () => {
    expect(isValidDateOnly('2026-02-31')).toBe(false);
    expect(isValidDateOnly('2026-02-29')).toBe(false);
    expect(isValidDateOnly('14/07/2026')).toBe(false);
    expect(parseDateOnly('2026-13-01')).toBeNull();
  });

  it('accepts valid leap dates and calculates calendar nights', () => {
    expect(isValidDateOnly('2024-02-29')).toBe(true);
    expect(differenceInCalendarDays('2026-07-30', '2026-08-02')).toBe(3);
    expect(differenceInCalendarDays('invalid', '2026-08-02')).toBeNull();
  });

  it('derives the business date and time in Vietnam independently of server timezone', () => {
    expect(getVietnamDateTimeParts(new Date('2026-07-13T18:30:00.000Z'))).toEqual({
      date: '2026-07-14',
      time: '01:30',
    });
  });
});

describe('formatDateInputValue', () => {
  it('returns empty string for nullish input', () => {
    expect(formatDateInputValue('')).toBe('');
    expect(formatDateInputValue(null)).toBe('');
    expect(formatDateInputValue(undefined)).toBe('');
  });

  it('returns the raw value when it is not a valid date', () => {
    expect(formatDateInputValue('not-a-date')).toBe('not-a-date');
  });

  it('formats a local datetime to YYYY-MM-DD', () => {
    expect(formatDateInputValue('2026-01-15T12:00:00')).toBe('2026-01-15');
  });

  it('formats using UTC date-only when timeZone is utc', () => {
    expect(formatDateInputValue('2026-03-20T23:30:00Z', { timeZone: 'utc' })).toBe('2026-03-20');
  });
});

describe('getDefaultStartDate / getDefaultEndDate / getDefaultTripDates', () => {
  const base = new Date(2026, 0, 15);

  it('returns the base date as start', () => {
    expect(getDefaultStartDate(base)).toBe('2026-01-15');
  });

  it('adds days to compute the end date', () => {
    expect(getDefaultEndDate(5, base)).toBe('2026-01-20');
  });

  it('clamps to at least one day and rounds fractional days', () => {
    expect(getDefaultEndDate(0, base)).toBe('2026-01-16');
    expect(getDefaultEndDate(2.6, base)).toBe('2026-01-18');
  });

  it('bundles start and end together', () => {
    expect(getDefaultTripDates(5, base)).toEqual({ startDate: '2026-01-15', endDate: '2026-01-20' });
  });
});

describe('parseValidDate', () => {
  it('returns null for nullish or invalid input', () => {
    expect(parseValidDate(null)).toBeNull();
    expect(parseValidDate(undefined)).toBeNull();
    expect(parseValidDate('garbage')).toBeNull();
  });

  it('passes through Date instances and parses valid strings', () => {
    const d = new Date('2026-05-01T00:00:00Z');
    expect(parseValidDate(d)).toBe(d);
    expect(parseValidDate('2026-05-01T00:00:00Z')?.toISOString()).toBe('2026-05-01T00:00:00.000Z');
  });
});

describe('formatUtcDateOnly / formatUtcDateOnlyStrict', () => {
  it('extracts the UTC date part', () => {
    expect(formatUtcDateOnly('2026-07-09T18:00:00Z')).toBe('2026-07-09');
    expect(formatUtcDateOnlyStrict('2026-07-09T18:00:00Z')).toBe('2026-07-09');
  });

  it('returns the fallback for invalid input', () => {
    expect(formatUtcDateOnly('nope', 'fallback')).toBe('fallback');
    expect(formatUtcDateOnly(null, '')).toBe('');
  });
});

describe('formatDate', () => {
  it('returns an em dash for invalid input', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate('garbage')).toBe('—');
  });

  it('formats a valid date in vi-VN day/month/year', () => {
    expect(formatDate('2026-02-03T12:00:00')).toBe('03/02/2026');
  });
});
