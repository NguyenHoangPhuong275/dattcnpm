import { describe, expect, it } from 'vitest';
import type { Trip } from '@/types/trip';
import { assertTripDayIsSchedulable, getDateForTripDay } from '@/lib/itinerary-utils';

const DAY_MS = 24 * 60 * 60 * 1000;

function makeTrip(startDate: Date, endDate: Date): Trip {
  return { startDate: startDate.toISOString(), endDate: endDate.toISOString() } as unknown as Trip;
}

function atMidnight(offsetDays: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d;
}

describe('getDateForTripDay', () => {
  it('maps day 1 to the start date at midnight', () => {
    const trip = makeTrip(new Date('2026-04-10T09:30:00'), new Date('2026-04-20T00:00:00'));
    const result = getDateForTripDay(trip, 1);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(3);
    expect(result.getDate()).toBe(10);
    expect(result.getHours()).toBe(0);
  });

  it('advances one day per trip day index', () => {
    const trip = makeTrip(new Date('2026-04-10T00:00:00'), new Date('2026-04-20T00:00:00'));
    const d1 = getDateForTripDay(trip, 1);
    const d3 = getDateForTripDay(trip, 3);
    expect((d3.getTime() - d1.getTime()) / DAY_MS).toBe(2);
  });
});

describe('assertTripDayIsSchedulable', () => {
  it('allows a day within the trip window starting today', () => {
    const trip = makeTrip(atMidnight(0), atMidnight(10));
    expect(() => assertTripDayIsSchedulable(trip, 1)).not.toThrow();
  });

  it('rejects a day that resolves to a past date', () => {
    const trip = makeTrip(atMidnight(-5), atMidnight(5));
    expect(() => assertTripDayIsSchedulable(trip, 1)).toThrowError(/ngày đã qua/);
  });

  it('rejects a day beyond the trip end date', () => {
    const trip = makeTrip(atMidnight(0), atMidnight(2));
    expect(() => assertTripDayIsSchedulable(trip, 10)).toThrowError(/vượt quá/);
  });
});
