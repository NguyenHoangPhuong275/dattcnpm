import {
  VIETNAM_AIRPORTS,
  VIETNAM_FLIGHTS_SCHEDULE,
  getAirportByCode,
  type FlightSchedule,
} from '@/data/vietnam-flights';
import { normalizeVietnameseText } from '@/lib/string';

const DEFAULT_FLIGHT_ORIGIN = 'SGN';
const DEFAULT_FLIGHT_DESTINATION = 'HAN';

const AIRPORT_LOCATION_ALIASES: Readonly<Record<string, readonly string[]>> = {
  SGN: ['ho chi minh', 'sai gon', 'tphcm'],
  HAN: ['ha noi'],
  DAD: ['da nang'],
  CXR: ['nha trang', 'khanh hoa', 'cam ranh'],
  PQC: ['phu quoc'],
  DLI: ['da lat', 'lam dong'],
  HUI: ['hue'],
  HPH: ['hai phong'],
  VII: ['vinh', 'nghe an'],
  UIH: ['quy nhon', 'binh dinh'],
  VCA: ['can tho'],
};

export interface FlightSearchCriteria {
  from: string;
  to: string;
  departDate: string;
  returnDate: string | null;
  passengers: number;
}

export interface FlightSearchDraft {
  from: string;
  to: string;
  departDate: string;
  returnDate: string;
  roundTrip: boolean;
  passengers: number;
}

export interface FlightSearchRoute {
  from: string;
  to: string;
}

function normalizeAirportCode(value: string | null | undefined): string | null {
  const normalized = value?.trim().toUpperCase();
  return normalized && getAirportByCode(normalized) ? normalized : null;
}

function getAlternativeAirport(excludedCode: string, preferredCode: string): string {
  if (preferredCode !== excludedCode && getAirportByCode(preferredCode)) return preferredCode;
  return VIETNAM_AIRPORTS.find((airport) => airport.code !== excludedCode)?.code ?? preferredCode;
}

export function resolveFlightSearchRoute(
  fromValue: string | null | undefined,
  toValue: string | null | undefined,
): FlightSearchRoute {
  const queryFrom = normalizeAirportCode(fromValue);
  const queryTo = normalizeAirportCode(toValue);
  let from = queryFrom ?? DEFAULT_FLIGHT_ORIGIN;
  let to = queryTo ?? DEFAULT_FLIGHT_DESTINATION;

  if (from === to) {
    if (queryFrom) {
      to = getAlternativeAirport(from, DEFAULT_FLIGHT_DESTINATION);
    } else {
      from = getAlternativeAirport(to, DEFAULT_FLIGHT_ORIGIN);
    }
  }

  return { from, to };
}

export function buildFlightSearchHref(from: string, to: string): string {
  const route = resolveFlightSearchRoute(from, to);
  const query = new URLSearchParams({ from: route.from, to: route.to });
  return `/flights?${query.toString()}`;
}

export function getAirportLabel(code: string): string {
  const airport = getAirportByCode(code);
  return airport ? `${airport.city} (${airport.code})` : code;
}

export function findAirportCodeByLocation(value: string): string | null {
  const normalized = normalizeVietnameseText(value);
  if (!normalized) return null;

  const airport = VIETNAM_AIRPORTS.find((candidate) => {
    const aliases = AIRPORT_LOCATION_ALIASES[candidate.code] ?? [];
    return aliases.some((alias) => normalized.includes(alias));
  });
  return airport?.code ?? null;
}

export function toFlightDateInputValue(date: Date): string {
  return date.toLocaleDateString('sv-SE');
}

export function formatFlightDateLabel(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function findFlights(from: string, to: string): FlightSchedule[] {
  return VIETNAM_FLIGHTS_SCHEDULE
    .filter((flight) => flight.from === from && flight.to === to)
    .sort((first, second) => first.departureTime.localeCompare(second.departureTime));
}

export function getFlightSearchError(draft: FlightSearchDraft): string | null {
  if (draft.from === draft.to) {
    return 'Điểm đi và điểm đến phải khác nhau.';
  }
  if (!draft.departDate) {
    return 'Vui lòng chọn ngày khởi hành.';
  }
  if (draft.roundTrip && draft.returnDate < draft.departDate) {
    return 'Ngày về phải từ ngày khởi hành trở đi.';
  }
  return null;
}

export function toFlightSearchCriteria(draft: FlightSearchDraft): FlightSearchCriteria {
  return {
    from: draft.from,
    to: draft.to,
    departDate: draft.departDate,
    returnDate: draft.roundTrip ? draft.returnDate : null,
    passengers: draft.passengers,
  };
}

export function buildFlightBookingHref(
  criteria: FlightSearchCriteria,
  outboundFlightId: string | null,
  returnFlightId: string | null,
): string | null {
  if (!outboundFlightId || (criteria.returnDate && !returnFlightId)) {
    return null;
  }

  const query = new URLSearchParams({
    outbound: outboundFlightId,
    ...(returnFlightId ? { return: returnFlightId } : {}),
    departDate: criteria.departDate,
    ...(criteria.returnDate ? { returnDate: criteria.returnDate } : {}),
    passengers: String(criteria.passengers),
  });

  return `/flights/booking?${query.toString()}`;
}

export function getFlightSelectionMessage(
  criteria: FlightSearchCriteria,
  outboundFlightId: string | null,
  returnFlightId: string | null,
): string {
  if (!outboundFlightId) {
    return 'Chọn một chuyến đi để tiếp tục';
  }
  if (criteria.returnDate && !returnFlightId) {
    return 'Chọn thêm chuyến về để tiếp tục';
  }
  return 'Hành trình đã sẵn sàng để đặt vé';
}
