'use client';

import Image from 'next/image';
import Link from 'next/link';

import EmptyState from '@/components/ui/EmptyState';
import { getAirlineByCode, type FlightSchedule } from '@/data/vietnam-flights';
import {
  buildFlightBookingHref,
  findFlights,
  formatFlightDateLabel,
  getAirportLabel,
  getFlightSelectionMessage,
  type FlightSearchCriteria,
} from '@/lib/flight-search';
import { formatMoney } from '@/lib/trip-utils';

interface FlightRowProps {
  flight: FlightSchedule;
  selected: boolean;
  onSelect: (flightId: string) => void;
}

function FlightRow({ flight, selected, onSelect }: FlightRowProps): React.JSX.Element {
  const airline = getAirlineByCode(flight.airline);

  return (
    <article className={`flex flex-col gap-4 rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center sm:justify-between ${selected ? 'border-[var(--color-primary-dark)] ring-2 ring-[var(--color-primary-lightest)]' : 'border-[var(--color-border)]'}`}>
      <div className="flex min-w-0 items-start gap-3">
        {airline && (
          <Image
            src={airline.logoUrl}
            alt={airline.name}
            width={44}
            height={44}
            className="mt-0.5 h-11 w-11 shrink-0 rounded-xl shadow-sm"
          />
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-[var(--color-primary-darker)]">{flight.flightNumber}</span>
            {airline ? (
              <Link
                id={`flight-airline-${flight.id}`}
                href={`/flights/airlines/${airline.code.toLowerCase()}`}
                className="rounded-full bg-[var(--color-primary-lightest)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-primary-darker)] hover:underline"
              >
                {airline.name}
              </Link>
            ) : (
              <span>{flight.airline}</span>
            )}
          </div>
          <div className="mt-2 grid grid-cols-[minmax(6rem,auto)_auto_minmax(6rem,auto)] items-center gap-2 text-sm text-[var(--color-text)]">
            <div className="text-center">
              <div className="text-lg font-extrabold tabular-nums">{flight.departureTime}</div>
              <div className="truncate text-xs text-[var(--color-text-muted)]">{getAirportLabel(flight.from)}</div>
            </div>
            <div className="flex flex-col items-center px-2 text-[var(--color-text-muted)]">
              <span className="text-xs tabular-nums">{flight.duration}</span>
              <span aria-hidden="true" className="h-px w-14 bg-[var(--color-border-strong)]" />
              <span className="text-xs">Bay thẳng</span>
            </div>
            <div className="text-center">
              <div className="text-lg font-extrabold tabular-nums">{flight.arrivalTime}</div>
              <div className="truncate text-xs text-[var(--color-text-muted)]">{getAirportLabel(flight.to)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 text-left sm:text-right">
        <div className="text-xs text-[var(--color-text-muted)]">Giá vé từ</div>
        <div className="text-xl font-extrabold tabular-nums text-[var(--color-primary-darker)]">{formatMoney(flight.basePrice)}</div>
        <div className="text-xs text-[var(--color-text-muted)]">/khách</div>
        <button
          id={`select-flight-${flight.id}`}
          type="button"
          onClick={() => onSelect(flight.id)}
          className={`mt-3 min-w-28 rounded-xl px-4 py-2.5 text-sm font-bold transition ${selected ? 'bg-[var(--color-primary-lightest)] text-[var(--color-primary-darker)]' : 'bg-[var(--color-primary-darker)] text-white hover:bg-[var(--color-primary-dark)]'}`}
        >
          {selected ? 'Đã chọn ✓' : 'Chọn chuyến'}
        </button>
      </div>
    </article>
  );
}

interface FlightResultSectionProps {
  title: string;
  subtitle: string;
  flights: FlightSchedule[];
  selectedFlightId: string | null;
  onSelect: (flightId: string) => void;
}

function FlightResultSection({
  title,
  subtitle,
  flights,
  selectedFlightId,
  onSelect,
}: FlightResultSectionProps): React.JSX.Element {
  return (
    <section aria-label={title}>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="font-display text-xl font-extrabold text-[var(--color-text)]">{title}</h2>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">{subtitle}</p>
        </div>
        <span className="text-sm tabular-nums text-[var(--color-text-muted)]">{flights.length} chuyến bay</span>
      </div>

      {flights.length > 0 ? (
        <div className="space-y-3">
          {flights.map((flight) => (
            <FlightRow key={flight.id} flight={flight} selected={selectedFlightId === flight.id} onSelect={onSelect} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Chưa tìm thấy chuyến bay phù hợp."
          description="Hãy thử chặng khác giữa các thành phố lớn như Hồ Chí Minh, Hà Nội, Đà Nẵng, Nha Trang hoặc Phú Quốc."
        />
      )}
    </section>
  );
}

interface FlightSearchResultsProps {
  criteria: FlightSearchCriteria;
  selectedOutboundId: string | null;
  selectedReturnId: string | null;
  onSelectOutbound: (flightId: string) => void;
  onSelectReturn: (flightId: string) => void;
}

export default function FlightSearchResults({
  criteria,
  selectedOutboundId,
  selectedReturnId,
  onSelectOutbound,
  onSelectReturn,
}: FlightSearchResultsProps): React.JSX.Element {
  const outboundFlights = findFlights(criteria.from, criteria.to);
  const returnFlights = criteria.returnDate ? findFlights(criteria.to, criteria.from) : [];
  const bookingHref = buildFlightBookingHref(criteria, selectedOutboundId, selectedReturnId);

  return (
    <div className="space-y-10">
      <FlightResultSection
        title={`Chuyến đi: ${getAirportLabel(criteria.from)} - ${getAirportLabel(criteria.to)}`}
        subtitle={`${formatFlightDateLabel(criteria.departDate)} · ${criteria.passengers} hành khách`}
        flights={outboundFlights}
        selectedFlightId={selectedOutboundId}
        onSelect={onSelectOutbound}
      />
      {criteria.returnDate && (
        <FlightResultSection
          title={`Chuyến về: ${getAirportLabel(criteria.to)} - ${getAirportLabel(criteria.from)}`}
          subtitle={`${formatFlightDateLabel(criteria.returnDate)} · ${criteria.passengers} hành khách`}
          flights={returnFlights}
          selectedFlightId={selectedReturnId}
          onSelect={onSelectReturn}
        />
      )}

      <div className="sticky bottom-4 z-20 rounded-2xl border border-[var(--color-border)] bg-white/95 p-4 shadow-xl backdrop-blur sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-extrabold text-[var(--color-text)]">
            {getFlightSelectionMessage(criteria, selectedOutboundId, selectedReturnId)}
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">Giá sẽ được kiểm tra lại khi gửi yêu cầu đặt vé.</p>
        </div>
        {bookingHref ? (
          <Link
            id="continue-flight-booking"
            href={bookingHref}
            className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-[var(--color-primary-darker)] px-6 py-3 text-sm font-bold text-white hover:bg-[var(--color-primary-dark)] sm:mt-0 sm:w-auto"
          >
            Tiếp tục đặt vé
          </Link>
        ) : (
          <button
            id="continue-flight-booking-disabled"
            type="button"
            disabled
            className="mt-3 w-full rounded-xl bg-[var(--color-bg)] px-6 py-3 text-sm font-bold text-[var(--color-text-muted)] sm:mt-0 sm:w-auto"
          >
            Tiếp tục đặt vé
          </button>
        )}
      </div>
    </div>
  );
}
