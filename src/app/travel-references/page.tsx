import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import AppHeader from '@/components/AppHeader';
import {
  TRAVEL_REFERENCES,
  TRAVEL_REFERENCE_SLUGS,
} from '@/data/travel-references';
import { getTravelReferenceHref } from '@/lib/travel-references';

export const metadata: Metadata = {
  title: 'Tin tức và cẩm nang du lịch | LOTUS TRAVEL',
  description: 'Các chủ đề du lịch cùng danh sách địa điểm tham khảo theo từng vùng.',
};

export default function TravelReferencesPage(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <AppHeader active="news" />

      <main className="mx-auto w-full max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-primary-darker)]">
            Cẩm nang LOTUS TRAVEL
          </p>
          <h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">
            Tin tức và địa điểm tham khảo
          </h1>
          <p className="mt-3 text-base leading-7 text-[var(--color-text-secondary)]">
            Chọn một chủ đề để xem danh sách địa điểm đúng với vùng xuất hiện trong hình ảnh và chủ động đưa điểm phù hợp vào lịch trình.
          </p>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TRAVEL_REFERENCE_SLUGS.map((slug) => {
            const reference = TRAVEL_REFERENCES[slug];
            return (
              <Link
                id={`travel-reference-${slug}`}
                key={slug}
                href={getTravelReferenceHref(slug)}
                className="group overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm transition hover:-translate-y-1 hover:border-[var(--color-primary-dark)] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              >
                <div className="relative aspect-[16/10] bg-[var(--color-primary-lightest)]">
                  <Image
                    src={reference.image}
                    alt={reference.sourceLocation}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-primary-darker)]">
                    {reference.sourceLocation} · {reference.region}
                  </p>
                  <h2 className="mt-2 line-clamp-2 text-lg font-extrabold text-[var(--color-text)]">
                    {reference.title}
                  </h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                    {reference.description}
                  </p>
                  <span className="mt-4 inline-flex text-sm font-bold text-[var(--color-primary-darker)]">
                    Xem danh sách tham khảo
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
