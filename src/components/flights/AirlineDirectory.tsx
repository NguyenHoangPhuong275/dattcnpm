import Image from 'next/image';
import Link from 'next/link';

import { VIETNAM_AIRLINES } from '@/data/vietnam-flights';

export default function AirlineDirectory(): React.JSX.Element {
  return (
    <section aria-label="Các hãng hàng không" className="mt-10">
      <h2 className="mb-4 text-lg font-bold text-[var(--color-text)]">Hãng hàng không nội địa</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {VIETNAM_AIRLINES.map((airline) => (
          <Link
            id={`airline-detail-${airline.code.toLowerCase()}`}
            key={airline.code}
            href={`/flights/airlines/${airline.code.toLowerCase()}`}
            className="group rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm transition hover:border-[var(--color-primary-dark)] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-dark)]"
          >
            <div className="flex min-w-0 items-center gap-3">
              <Image
                src={airline.logoUrl}
                alt={airline.name}
                width={40}
                height={40}
                className="h-10 w-10 shrink-0 rounded-lg shadow-sm"
              />
              <h3 className="truncate font-bold text-[var(--color-text)]">{airline.name}</h3>
            </div>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">{airline.description}</p>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {airline.amenities.map((amenity) => (
                <li key={amenity} className="rounded-full bg-[var(--color-bg)] px-2.5 py-1 text-xs text-[var(--color-text-secondary)]">
                  {amenity}
                </li>
              ))}
            </ul>
            <span className="mt-4 inline-flex text-sm font-bold text-[var(--color-primary-darker)] group-hover:underline">
              Xem thông tin hãng
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
