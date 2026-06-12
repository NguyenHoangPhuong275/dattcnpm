'use client';

import Image from 'next/image';
import { FEATURED_DESTINATIONS } from '@/lib/home';

interface FeaturedDestinationsProps {
  onSelect: (title: string) => void;
}

export default function FeaturedDestinations({ onSelect }: FeaturedDestinationsProps) {
  return (
    <section className="border-t border-[var(--color-border)] bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8 xl:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h2 className="font-display text-3xl font-extrabold text-[var(--color-text)]">Gợi ý điểm đến</h2>
          <p className="mt-1 text-sm font-medium text-[var(--color-text-secondary)]">Một vài địa danh nổi bật để bắt đầu lên lịch trình.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED_DESTINATIONS.map((item) => (
            <button
              type="button"
              key={item.title}
              onClick={() => onSelect(item.title)}
              className="group overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm text-left transition hover:-translate-y-1 hover:border-[var(--color-primary-dark)] hover:shadow-md cursor-pointer w-full focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <div className="relative aspect-[4/3] w-full bg-slate-100">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <h3 className="text-base font-extrabold text-slate-900 group-hover:text-[var(--color-primary-darker)] transition-colors">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm font-medium text-slate-500">{item.description}</p>
                <span className="mt-2 inline-block text-xs font-semibold text-[var(--color-primary-darker)]">
                  Chọn điểm đến →
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
