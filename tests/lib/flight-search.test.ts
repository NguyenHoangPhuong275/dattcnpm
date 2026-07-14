import { describe, expect, it } from 'vitest';

import {
  buildFlightBookingHref,
  buildFlightSearchHref,
  findAirportCodeByLocation,
  findFlights,
  getAirportLabel,
  getFlightSearchError,
  getFlightSelectionMessage,
  resolveFlightSearchRoute,
  toFlightSearchCriteria,
  type FlightSearchCriteria,
  type FlightSearchDraft,
} from '@/lib/flight-search';

const oneWayDraft: FlightSearchDraft = {
  from: 'SGN',
  to: 'HAN',
  departDate: '2026-08-10',
  returnDate: '2026-08-12',
  roundTrip: false,
  passengers: 2,
};

const oneWayCriteria: FlightSearchCriteria = toFlightSearchCriteria(oneWayDraft);

describe('flight search validation', () => {
  it('preserves the validation priority and Vietnamese messages', () => {
    expect(getFlightSearchError({ ...oneWayDraft, to: 'SGN', departDate: '' })).toBe(
      'Điểm đi và điểm đến phải khác nhau.',
    );
    expect(getFlightSearchError({ ...oneWayDraft, departDate: '' })).toBe('Vui lòng chọn ngày khởi hành.');
    expect(
      getFlightSearchError({ ...oneWayDraft, roundTrip: true, returnDate: '2026-08-09' }),
    ).toBe('Ngày về phải từ ngày khởi hành trở đi.');
    expect(getFlightSearchError(oneWayDraft)).toBeNull();
  });

  it('removes the return date from one-way criteria', () => {
    expect(oneWayCriteria).toEqual({
      from: 'SGN',
      to: 'HAN',
      departDate: '2026-08-10',
      returnDate: null,
      passengers: 2,
    });
  });

  it('normalizes route query values and rejects unknown or identical airports', () => {
    expect(resolveFlightSearchRoute('dad', ' han ')).toEqual({ from: 'DAD', to: 'HAN' });
    expect(resolveFlightSearchRoute('unknown', 'HAN')).toEqual({ from: 'SGN', to: 'HAN' });
    expect(resolveFlightSearchRoute('HAN', 'HAN')).toEqual({ from: 'HAN', to: 'SGN' });
    expect(resolveFlightSearchRoute(null, 'SGN')).toEqual({ from: 'HAN', to: 'SGN' });
  });
});

describe('flight schedule lookup', () => {
  it('returns matching schedules ordered by departure time', () => {
    const flights = findFlights('SGN', 'HAN');

    expect(flights.length).toBeGreaterThan(1);
    expect(flights.every((flight) => flight.from === 'SGN' && flight.to === 'HAN')).toBe(true);
    expect(flights.map((flight) => flight.departureTime)).toEqual(
      [...flights].map((flight) => flight.departureTime).sort(),
    );
  });

  it('formats known airports and preserves unknown codes', () => {
    expect(getAirportLabel('SGN')).toBe('Hồ Chí Minh (SGN)');
    expect(getAirportLabel('XYZ')).toBe('XYZ');
  });

  it('maps Vietnamese locations to airports without duplicating accent normalization', () => {
    expect(findAirportCodeByLocation('Thành phố Hồ Chí Minh')).toBe('SGN');
    expect(findAirportCodeByLocation('Khánh Hòa, Việt Nam')).toBe('CXR');
    expect(findAirportCodeByLocation('TPHCM')).toBe('SGN');
    expect(findAirportCodeByLocation('Quảng Ninh')).toBeNull();
  });
});

describe('flight booking navigation', () => {
  it('preserves a selected airline route in the flight-search URL', () => {
    expect(buildFlightSearchHref('SGN', 'DAD')).toBe('/flights?from=SGN&to=DAD');
  });

  it('builds the same one-way query contract once the outbound flight is selected', () => {
    expect(buildFlightBookingHref(oneWayCriteria, 'FL-SGN-HAN-01', null)).toBe(
      '/flights/booking?outbound=FL-SGN-HAN-01&departDate=2026-08-10&passengers=2',
    );
    expect(buildFlightBookingHref(oneWayCriteria, null, null)).toBeNull();
  });

  it('requires both flights and includes both dates for a round trip', () => {
    const roundTripCriteria = toFlightSearchCriteria({ ...oneWayDraft, roundTrip: true });

    expect(buildFlightBookingHref(roundTripCriteria, 'FL-SGN-HAN-01', null)).toBeNull();
    expect(buildFlightBookingHref(roundTripCriteria, 'FL-SGN-HAN-01', 'FL-HAN-SGN-01')).toBe(
      '/flights/booking?outbound=FL-SGN-HAN-01&return=FL-HAN-SGN-01&departDate=2026-08-10&returnDate=2026-08-12&passengers=2',
    );
  });

  it('derives the selection prompt from the required legs', () => {
    const roundTripCriteria = toFlightSearchCriteria({ ...oneWayDraft, roundTrip: true });

    expect(getFlightSelectionMessage(roundTripCriteria, null, null)).toBe('Chọn một chuyến đi để tiếp tục');
    expect(getFlightSelectionMessage(roundTripCriteria, 'outbound', null)).toBe(
      'Chọn thêm chuyến về để tiếp tục',
    );
    expect(getFlightSelectionMessage(roundTripCriteria, 'outbound', 'return')).toBe(
      'Hành trình đã sẵn sàng để đặt vé',
    );
  });
});
