'use client';

import { useMemo, useState, type FormEvent } from 'react';

import { VIETNAM_AIRPORTS } from '@/data/vietnam-flights';
import {
  getFlightSearchError,
  resolveFlightSearchRoute,
  toFlightDateInputValue,
  toFlightSearchCriteria,
  type FlightSearchCriteria,
  type FlightSearchDraft,
} from '@/lib/flight-search';

const DAY_MS = 86_400_000;

const fieldBaseClass =
  'w-full min-w-0 rounded-xl border border-[var(--color-border)] bg-white py-3 text-sm font-medium text-[var(--color-text)] shadow-sm outline-none transition-colors disabled:bg-[var(--color-bg)] disabled:text-[var(--color-text-muted)]';

const fieldClass = `${fieldBaseClass} px-4`;

const selectClass = `${fieldBaseClass} app-select px-4`;

const labelClass = 'flex min-w-0 flex-1 flex-col gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)]';

interface FlightSearchFormProps {
  onSearch: (criteria: FlightSearchCriteria | null) => void;
  initialFrom?: string | null;
  initialTo?: string | null;
}

export default function FlightSearchForm({
  onSearch,
  initialFrom,
  initialTo,
}: FlightSearchFormProps): React.JSX.Element {
  const today = useMemo(() => toFlightDateInputValue(new Date()), []);
  const defaultReturn = useMemo(() => toFlightDateInputValue(new Date(Date.now() + 2 * DAY_MS)), []);
  const initialRoute = useMemo(
    () => resolveFlightSearchRoute(initialFrom, initialTo),
    [initialFrom, initialTo],
  );
  const [from, setFrom] = useState(initialRoute.from);
  const [to, setTo] = useState(initialRoute.to);
  const [departDate, setDepartDate] = useState(today);
  const [returnDate, setReturnDate] = useState(defaultReturn);
  const [roundTrip, setRoundTrip] = useState(false);
  const [passengers, setPassengers] = useState(1);
  const [error, setError] = useState('');

  const swapRoute = (): void => {
    setFrom(to);
    setTo(from);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const draft: FlightSearchDraft = { from, to, departDate, returnDate, roundTrip, passengers };
    const nextError = getFlightSearchError(draft);

    if (nextError) {
      setError(nextError);
      onSearch(null);
      return;
    }

    setError('');
    onSearch(toFlightSearchCriteria(draft));
  };

  return (
    <section className="mb-6 overflow-hidden rounded-3xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-primary-lightest)] via-white to-white p-6 shadow-sm sm:p-8">


      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-end">
            <label className={labelClass}>
              Điểm đi
              <select id="flight-origin" value={from} onChange={(event) => setFrom(event.target.value)} className={selectClass}>
                {VIETNAM_AIRPORTS.map((airport) => (
                  <option key={airport.code} value={airport.code}>
                    {airport.city} ({airport.code})
                  </option>
                ))}
              </select>
            </label>

            <div className="flex h-11 items-center justify-center sm:mb-0.5 shrink-0">
              <button
                id="swap-flight-route"
                type="button"
                onClick={swapRoute}
                aria-label="Đổi chiều điểm đi và điểm đến"
                title="Đổi chiều"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-white text-sm font-bold text-[var(--color-primary-darker)] shadow-sm transition-colors hover:bg-[var(--color-primary-lightest)]"
              >
                ⇄
              </button>
            </div>

            <label className={labelClass}>
              Điểm đến
              <select id="flight-destination" value={to} onChange={(event) => setTo(event.target.value)} className={selectClass}>
                {VIETNAM_AIRPORTS.map((airport) => (
                  <option key={airport.code} value={airport.code}>
                    {airport.city} ({airport.code})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex min-w-0 flex-col gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)] sm:w-40 sm:shrink-0">
            Số hành khách
            <select
              id="flight-passenger-count"
              value={passengers}
              onChange={(event) => setPassengers(Number(event.target.value))}
              className={selectClass}
            >
              {Array.from({ length: 9 }, (_, index) => index + 1).map((count) => (
                <option key={count} value={count}>
                  {count} hành khách
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className="flex min-h-5 items-center">Ngày khởi hành</span>
              <input
                id="flight-depart-date"
                type="date"
                value={departDate}
                min={today}
                onChange={(event) => setDepartDate(event.target.value)}
                className={fieldClass}
              />
            </label>

            <div className={labelClass}>
              <label className="flex min-h-5 items-center gap-2 cursor-pointer select-none">
                <input
                  id="flight-round-trip"
                  type="checkbox"
                  checked={roundTrip}
                  onChange={(event) => setRoundTrip(event.target.checked)}
                  className="h-3.5 w-3.5 accent-[var(--color-primary-darker)]"
                />
                <span>Khứ hồi — ngày về</span>
              </label>
              <input
                id="flight-return-date"
                type="date"
                value={returnDate}
                min={departDate || today}
                disabled={!roundTrip}
                onChange={(event) => setReturnDate(event.target.value)}
                className={fieldClass}
              />
            </div>
          </div>

          <button
            id="search-flights"
            type="submit"
            className="h-11 w-full shrink-0 whitespace-nowrap rounded-xl bg-[var(--color-primary-darker)] px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[var(--color-primary-dark)] sm:w-40"
          >
            Tìm chuyến bay
          </button>
        </div>

        {error && <p className="text-sm font-semibold text-[var(--color-danger)]">{error}</p>}
      </form>
    </section>
  );
}
