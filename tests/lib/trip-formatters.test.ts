import { describe, expect, it } from 'vitest';
import type { ItineraryItem, TripAccommodation, TripBudget } from '@/types/trip';
import {
  extractTrips,
  extractTripsPagination,
  toAccommodationResponse,
  toBudgetResponse,
  toItineraryItemResponse,
} from '@/lib/trip-formatters';

describe('toBudgetResponse', () => {
  it('maps a budget item and stringifies ids/dates', () => {
    const item = {
      _id: 'b1',
      tripId: 't1',
      category: 'food',
      amount: 120,
      currency: 'VND',
      note: null,
      date: new Date('2026-01-02T00:00:00Z'),
      type: 'expense',
      createdAt: new Date('2026-01-01T00:00:00Z'),
    } as unknown as TripBudget;
    expect(toBudgetResponse(item)).toEqual({
      id: 'b1',
      tripId: 't1',
      category: 'food',
      amount: 120,
      currency: 'VND',
      note: null,
      date: '2026-01-02T00:00:00.000Z',
      type: 'expense',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('keeps null date/createdAt when absent', () => {
    const item = { _id: 'b2', tripId: 't1', category: 'misc', amount: 0, currency: 'VND', type: 'expense' } as unknown as TripBudget;
    const res = toBudgetResponse(item);
    expect(res.date).toBeNull();
    expect(res.createdAt).toBeNull();
    expect(res.note).toBeNull();
  });
});

describe('toAccommodationResponse', () => {
  it('renames bookingRef to bookingCode and defaults currency to VND', () => {
    const item = {
      _id: 'a1',
      tripId: 't1',
      name: 'Hotel',
      address: null,
      checkIn: new Date('2026-02-01T00:00:00Z'),
      checkOut: new Date('2026-02-03T00:00:00Z'),
      bookingRef: 'BK1',
      note: null,
      createdAt: new Date('2026-01-01T00:00:00Z'),
    } as unknown as TripAccommodation;
    const res = toAccommodationResponse(item);
    expect(res.bookingCode).toBe('BK1');
    expect(res.hotelId).toBeNull();
    expect(res.currency).toBe('VND');
    expect(res.checkIn).toBe('2026-02-01T00:00:00.000Z');
  });

  it('giữ hotelId để mở lại trang chi tiết', () => {
    const item = {
      _id: 'a2',
      tripId: 't1',
      hotelId: '507f1f77bcf86cd799439101',
      name: 'Hotel',
      checkIn: new Date('2026-02-01T00:00:00Z'),
      checkOut: new Date('2026-02-03T00:00:00Z'),
      currency: 'VND',
    } as unknown as TripAccommodation;

    expect(toAccommodationResponse(item).hotelId).toBe('507f1f77bcf86cd799439101');
  });
});

describe('extractTrips', () => {
  const summary = { _id: 's1', title: 'Trip', destination: 'Hue' };

  it('returns [] for non-object payloads', () => {
    expect(extractTrips(null)).toEqual([]);
    expect(extractTrips('x')).toEqual([]);
  });

  it('reads a flat data array and filters non-summaries', () => {
    expect(extractTrips({ data: [summary, { bad: true }] })).toEqual([summary]);
  });

  it('reads a nested data.data array', () => {
    expect(extractTrips({ data: { data: [summary] } })).toEqual([summary]);
  });
});

describe('extractTripsPagination', () => {
  it('returns null when there is no pagination info', () => {
    expect(extractTripsPagination({ data: { data: [] } })).toBeNull();
    expect(extractTripsPagination(null)).toBeNull();
  });

  it('reads a nested pagination object', () => {
    expect(extractTripsPagination({ data: { pagination: { page: 2, limit: 10, total: 30, totalPages: 3 } } }))
      .toEqual({ page: 2, limit: 10, total: 30, totalPages: 3 });
  });

  it('reads flat pagination fields on data', () => {
    expect(extractTripsPagination({ data: { page: 1, total: 5 } }))
      .toEqual({ page: 1, limit: undefined, total: 5, totalPages: undefined });
  });
});

describe('toItineraryItemResponse', () => {
  const base = {
    _id: 'i1',
    tripId: 't1',
    placeId: 'p1',
    day: 1,
    orderIndex: 0,
    note: 'hi',
    startTime: new Date('2026-03-01T08:00:00Z'),
    endTime: null,
    cost: null,
    currency: null,
    createdAt: new Date('2026-02-01T00:00:00Z'),
    updatedAt: new Date('2026-02-02T00:00:00Z'),
  } as unknown as ItineraryItem;

  it('maps core fields and serializes times', () => {
    const res = toItineraryItemResponse(base);
    expect(res.startTime).toBe('2026-03-01T08:00:00.000Z');
    expect(res.endTime).toBeNull();
    expect(res.updatedAt).toBeUndefined();
    expect('place' in res).toBe(false);
  });

  it('includes updatedAt and place when requested', () => {
    const place = { _id: 'p1', name: 'Place', address: 'A', lat: 1, lng: 2 };
    const res = toItineraryItemResponse(base, { includeUpdatedAt: true, place });
    expect(res.updatedAt).toBe('2026-02-02T00:00:00.000Z');
    expect(res.place).toEqual({ _id: 'p1', name: 'Place', address: 'A', lat: 1, lng: 2 });
  });

  it('sets place to null when explicitly passed null', () => {
    const res = toItineraryItemResponse(base, { place: null });
    expect(res.place).toBeNull();
  });
});
