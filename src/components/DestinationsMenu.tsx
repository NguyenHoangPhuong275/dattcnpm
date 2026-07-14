'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

import { ChevronDownIcon } from '@/components/icons';
import { LOCALITIES, REGIONS, type Locality, type RegionName } from '@/data/localities';
import { ROUTES } from '@/lib/constants';

interface DestinationsMenuProps {
  triggerId: string;
  href: string;
  label: string;
  isActive: boolean;
}

export default function DestinationsMenu({ triggerId, href, label, isActive }: DestinationsMenuProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [activeRegion, setActiveRegion] = useState<RegionName>(REGIONS[0]);

  const localitiesByRegion = useMemo(() => {
    const grouped = new Map<RegionName, Locality[]>();
    for (const region of REGIONS) grouped.set(region, []);
    for (const locality of LOCALITIES) {
      grouped.get(locality.region)?.push(locality);
    }
    return grouped;
  }, []);

  const regionLocalities = localitiesByRegion.get(activeRegion) ?? [];

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setOpen(false);
      }}
    >
      <Link
        id={triggerId}
        href={href}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-current={isActive ? 'page' : undefined}
        className={`app-nav-link inline-flex items-center gap-1 ${isActive ? 'app-nav-link-active' : ''}`}
      >
        {label}
        <ChevronDownIcon className={open ? 'rotate-180' : ''} />
      </Link>

      {open && (
        <div className="absolute left-1/2 top-full z-50 w-[620px] -translate-x-1/2 pt-3">
          <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-xl">
            <div className="grid grid-cols-[220px_minmax(0,1fr)]">
              <ul className="border-r border-[var(--color-border)] bg-[var(--color-bg)] py-2">
                {REGIONS.map((region) => (
                  <li key={region}>
                    <button
                      id={`destination-region-${REGIONS.indexOf(region)}`}
                      type="button"
                      onMouseEnter={() => setActiveRegion(region)}
                      onFocus={() => setActiveRegion(region)}
                      className={`w-full px-4 py-2 text-left text-sm font-semibold transition-colors ${
                        region === activeRegion
                          ? 'border-r-2 border-[var(--color-primary-dark)] bg-white text-[var(--color-primary-darker)]'
                          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                      }`}
                    >
                      {region}
                    </button>
                  </li>
                ))}
              </ul>

              <div className="p-4">
                {regionLocalities.length > 0 ? (
                  <ul className="grid grid-cols-2 gap-1">
                    {regionLocalities.map((locality) => (
                      <li key={locality.slug}>
                        <Link
                          id={`destination-locality-${locality.slug}`}
                          href={`${ROUTES.local}/${locality.slug}`}
                          onClick={() => setOpen(false)}
                          className="block rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-primary-lightest)] hover:text-[var(--color-primary-darker)]"
                        >
                          {locality.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-3 py-2 text-sm text-[var(--color-text-muted)]">
                    Chưa có địa phương cho vùng này.
                  </p>
                )}

                <Link
                  id="destination-all-localities"
                  href={ROUTES.local}
                  onClick={() => setOpen(false)}
                  className="mt-3 inline-flex items-center gap-1 px-3 text-sm font-bold text-[var(--color-primary-darker)] transition-colors hover:text-[var(--color-primary-dark)]"
                >
                  Xem tất cả địa phương
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
