'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  DEFAULT_REGION,
  REGIONS,
  searchLocalities,
  type Locality,
  type RegionName,
} from '@/lib/localities';

function LocalitySearch({
  query,
  onQueryChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
}) {
  return (
    <form
      className="mx-auto mt-7 flex h-[60px] max-w-[750px] items-center rounded-full border border-slate-200 bg-white px-4"
      onSubmit={(event) => event.preventDefault()}
    >
      <input
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Nhập nội dung tìm kiếm"
        className="min-w-0 flex-1 bg-transparent py-3 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] sm:text-base"
      />
      <button
        type="submit"
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-secondary)]"
        aria-label="Tìm kiếm địa phương"
      >
        <span className="relative block h-5 w-5 rounded-full border-2 border-current after:absolute after:-bottom-1 after:-right-1 after:h-2 after:w-0.5 after:rotate-[-45deg] after:rounded-full after:bg-current" />
      </button>
    </form>
  );
}

function RegionNavigation({
  activeRegion,
  onRegionChange,
}: {
  activeRegion: RegionName;
  onRegionChange: (region: RegionName) => void;
}) {
  return (
    <aside className="border-r border-[var(--color-border)] pr-0 lg:pr-6">
      <div className="flex gap-3 overflow-x-auto pb-2 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
        {REGIONS.map((region) => {
          const isActive = region === activeRegion;

          return (
            <button
              key={region}
              type="button"
              onClick={() => onRegionChange(region)}
              className={`flex-shrink-0 whitespace-nowrap rounded-none border-r-2 px-4 py-3 text-left text-sm font-medium transition-colors lg:block lg:w-full lg:border-r-0 lg:border-l-2 lg:px-4 lg:py-4 lg:text-base ${
                isActive
                  ? 'border-[var(--color-primary-darker)] bg-[var(--color-primary-lightest)] text-[var(--color-primary-darker)] lg:bg-transparent lg:font-semibold'
                  : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
              }`}
            >
              {region}
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function LocalityCard({ locality }: { locality: Locality }) {
  return (
    <Link
      href={`/local/${locality.slug}`}
      className="group relative aspect-[1.05/1] overflow-hidden rounded-[18px] bg-slate-100 text-left transition-all hover:-translate-y-1"
    >
      <Image
        src={locality.image}
        alt={locality.name}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/15 to-black/55" />
      <div className="absolute inset-x-0 bottom-0 px-4 pb-4 text-center">
        <span className="font-display text-base font-bold text-white drop-shadow-sm sm:text-lg">
          {locality.name}
        </span>
      </div>
    </Link>
  );
}

function LocalityGrid({ localities }: { localities: Locality[] }) {
  if (localities.length === 0) {
    return (
      <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] bg-slate-50 px-6 text-center text-sm text-[var(--color-text-muted)]">
        Không tìm thấy địa phương phù hợp trong khu vực này.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {localities.map((locality) => (
        <LocalityCard key={locality.slug} locality={locality} />
      ))}
    </div>
  );
}

export default function LocalityBrowser() {
  const [activeRegion, setActiveRegion] = useState<RegionName>(DEFAULT_REGION);
  const [query, setQuery] = useState('');

  const visibleLocalities = useMemo(() => {
    return searchLocalities(activeRegion, query);
  }, [activeRegion, query]);

  return (
    <>
      <section className="mx-auto max-w-4xl text-center">
        <h1 className="font-display text-3xl font-bold tracking-normal text-[var(--color-text)] sm:text-[36px]">
          Danh sách địa phương
        </h1>

        <LocalitySearch query={query} onQueryChange={setQuery} />
      </section>

      <section className="mt-12 grid gap-8 lg:grid-cols-[260px_1fr] xl:grid-cols-[300px_1fr]">
        <RegionNavigation activeRegion={activeRegion} onRegionChange={setActiveRegion} />
        <LocalityGrid localities={visibleLocalities} />
      </section>
    </>
  );
}
