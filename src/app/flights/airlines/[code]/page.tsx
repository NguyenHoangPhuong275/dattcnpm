import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import AppHeader from '@/components/AppHeader';
import { getAirlineByCode, getAirportByCode, VIETNAM_AIRLINES, VIETNAM_FLIGHTS_SCHEDULE } from '@/data/vietnam-flights';
import { ROUTES } from '@/lib/constants';
import { buildFlightSearchHref } from '@/lib/flight-search';
import { formatMoney } from '@/lib/trip-utils';

type AirlinePageProps = { params: Promise<{ code: string }> };

const TYPE_LABELS = {
  'Full Service': 'Hãng hàng không truyền thống',
  'Low Cost': 'Hãng hàng không giá tiết kiệm',
  Hybrid: 'Hãng hàng không lai',
} as const;

export function generateStaticParams(): Array<{ code: string }> {
  return VIETNAM_AIRLINES.map((airline) => ({ code: airline.code.toLowerCase() }));
}

export async function generateMetadata({ params }: AirlinePageProps): Promise<Metadata> {
  const { code } = await params;
  const airline = getAirlineByCode(code);
  if (!airline) return { title: 'Hãng hàng không không tồn tại | LOTUS TRAVEL' };
  return {
    title: `${airline.name} | LOTUS TRAVEL`,
    description: airline.description,
  };
}

export default async function AirlineDetailPage({ params }: AirlinePageProps): Promise<React.JSX.Element> {
  const { code } = await params;
  const airline = getAirlineByCode(code);
  if (!airline) notFound();

  const flights = VIETNAM_FLIGHTS_SCHEDULE.filter((flight) => flight.airline === airline.code);
  const routes = Array.from(new Map(flights.map((flight) => [`${flight.from}-${flight.to}`, flight])).values());
  const lowestPrice = flights.length > 0 ? Math.min(...flights.map((flight) => flight.basePrice)) : null;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <AppHeader active="flights" showSearch={false} />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link id="back-to-flights-from-airline" href={ROUTES.flights} className="mb-5 inline-flex text-sm font-semibold text-[var(--color-primary-darker)] hover:underline">Quay lại tìm chuyến bay</Link>

        <section className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white shadow-sm">
          <div className="bg-gradient-to-br from-[var(--color-primary-lightest)] via-white to-white p-6 sm:p-9">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <Image src={airline.logoUrl} alt={`Logo ${airline.name}`} width={96} height={96} priority className="h-24 w-24 rounded-2xl bg-white shadow-sm" />
              <div className="min-w-0">
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--color-primary-dark)]">{TYPE_LABELS[airline.type]}</p>
                <h1 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">{airline.name}</h1>
              </div>
            </div>
            <p className="mt-6 max-w-3xl text-base leading-7 text-[var(--color-text-secondary)]">{airline.description}</p>
          </div>

          <div className="grid gap-8 border-t border-[var(--color-border)] p-6 sm:p-9 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div>
              <h2 className="text-xl font-extrabold">Dịch vụ và tiện ích</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {airline.amenities.map((amenity) => (
                  <li key={amenity} className="flex items-start gap-2 rounded-xl bg-[var(--color-bg)] px-4 py-3 text-sm font-medium text-[var(--color-text-secondary)]">
                    <span aria-hidden="true" className="text-[var(--color-primary-dark)]">✓</span>{amenity}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs leading-5 text-[var(--color-text-muted)]">Tiện ích có thể thay đổi theo hạng vé và từng chuyến bay. Hãy kiểm tra điều kiện vé trước khi thanh toán.</p>
            </div>

            <aside className="h-fit rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5">
              <h2 className="font-extrabold">Thông tin hãng</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-[var(--color-text-muted)]">Mã hãng</dt><dd className="font-bold">{airline.code}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-[var(--color-text-muted)]">Số chuyến đang hiển thị</dt><dd className="font-bold tabular-nums">{flights.length} chuyến</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-[var(--color-text-muted)]">Giá vé từ</dt><dd className="font-bold tabular-nums text-[var(--color-primary-darker)]">{lowestPrice === null ? '—' : formatMoney(lowestPrice)}</dd></div>
              </dl>
              <Link id={`search-${airline.code.toLowerCase()}-flights`} href={ROUTES.flights} className="mt-5 flex w-full items-center justify-center rounded-xl bg-[var(--color-primary-darker)] px-5 py-3 text-sm font-bold text-white hover:bg-[var(--color-primary-dark)]">Tìm chuyến bay</Link>
            </aside>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-extrabold">Các chặng bay phổ biến</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">Khám phá các chặng bay hiện có của hãng.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {routes.map((flight) => {
              const from = getAirportByCode(flight.from);
              const to = getAirportByCode(flight.to);
              return (
                <Link id={`airline-route-${flight.from.toLowerCase()}-${flight.to.toLowerCase()}`} key={`${flight.from}-${flight.to}`} href={buildFlightSearchHref(flight.from, flight.to)} className="rounded-2xl border border-[var(--color-border)] bg-white p-4 transition hover:border-[var(--color-primary-dark)] hover:shadow-sm">
                  <p className="font-extrabold">{from?.city ?? flight.from} - {to?.city ?? flight.to}</p>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">Từ {formatMoney(flight.basePrice)} · {flight.duration}</p>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
