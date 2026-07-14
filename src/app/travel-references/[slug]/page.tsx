import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import AppHeader from '@/components/AppHeader';
import DestinationReferenceCard from '@/components/local/DestinationReferenceCard';
import { TRAVEL_REFERENCE_SLUGS } from '@/data/travel-references';
import { ROUTES } from '@/lib/constants';
import ReferenceViewCounter from '@/components/ReferenceViewCounter';
import {
  formatReferenceDate,
  getRelatedTravelReferences,
  getTravelReferenceHref,
  getTravelReferencePageData,
} from '@/lib/travel-references';

type TravelReferencePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams(): Array<{ slug: string }> {
  return TRAVEL_REFERENCE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: TravelReferencePageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = getTravelReferencePageData(slug);
  if (!data) {
    return { title: 'Cẩm nang không tồn tại | LOTUS TRAVEL' };
  }
  return {
    title: `${data.reference.title} | LOTUS TRAVEL`,
    description: data.reference.description,
  };
}

export default async function TravelReferencePage({ params }: TravelReferencePageProps): Promise<React.JSX.Element> {
  const { slug } = await params;
  const data = getTravelReferencePageData(slug);
  if (!data) {
    notFound();
  }

  const { reference, destinations } = data;
  const relatedReferences = getRelatedTravelReferences(slug);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <AppHeader active="news" />

      <main>
        <section className="relative min-h-[360px] overflow-hidden bg-slate-900 sm:min-h-[440px]">
          <Image
            src={reference.image}
            alt={reference.sourceLocation}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/35 to-black/80" />
          <div className="relative z-10 mx-auto flex min-h-[360px] w-full max-w-[1180px] flex-col justify-end px-4 py-10 text-white sm:min-h-[440px] sm:px-6 lg:px-8">
            <Link
              id="travel-reference-back-to-list"
              href={ROUTES.travelReferences}
              className="mb-5 w-fit text-sm font-bold text-white/85 transition hover:text-white"
            >
              Tất cả cẩm nang
            </Link>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/80">
              {reference.sourceLocation === reference.region ? reference.region : `${reference.sourceLocation} · ${reference.region}`}
            </p>
            <h1 className="mt-3 max-w-4xl font-display text-3xl font-extrabold leading-tight sm:text-5xl">
              {reference.title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-white/85">
              {reference.description}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-semibold text-white/80">
              <span className="rounded-full bg-white/15 px-3 py-1">{reference.category}</span>
              <span>{formatReferenceDate(reference.publishedAt)}</span>
              <ReferenceViewCounter slug={slug} />
            </div>
          </div>
        </section>

        {reference.tips.length > 0 && (
          <section aria-label="Lưu ý cho hành trình" className="border-b border-[var(--color-border)] bg-white">
            <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-3 px-4 py-5 sm:px-6 lg:flex-row lg:items-baseline lg:gap-10 lg:px-8">
              <p className="shrink-0 text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-primary-darker)]">
                Lưu ý cho hành trình
              </p>
              <ul className="flex flex-col gap-2 lg:flex-row lg:gap-10">
                {reference.tips.map((tip) => (
                  <li key={tip} className="flex gap-2.5 text-sm leading-6 text-[var(--color-text-secondary)]">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary-dark)]" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {reference.sections.length > 0 && (
          <article className="mx-auto w-full max-w-[820px] px-4 pt-10 sm:px-6 lg:px-8 lg:pt-14">
            <div className="space-y-9">
              {reference.sections.map((section, index) => (
                <section key={section.heading} aria-label={section.heading}>
                  <h2 className="font-display text-2xl font-extrabold leading-snug text-[var(--color-text)]">
                    {section.heading}
                  </h2>
                  {section.paragraphs.map((paragraph, paragraphIndex) => (
                    <p
                      key={paragraphIndex}
                      className={`mt-4 leading-8 text-[var(--color-text-secondary)] ${
                        index === 0 && paragraphIndex === 0 ? 'text-lg font-medium text-[var(--color-text)]' : 'text-base'
                      }`}
                    >
                      {paragraph}
                    </p>
                  ))}
                </section>
              ))}
            </div>
          </article>
        )}

        <section className="mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-primary-darker)]">
            Cẩm nang · {reference.region}
          </p>
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3 border-b border-[var(--color-border)] pb-5">
            <h2 className="font-display text-3xl font-extrabold">Điểm đến nổi bật</h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              {destinations.length} địa điểm tại khu vực {reference.region}
            </p>
          </div>

          {destinations.length > 0 ? (
            <div id="reference-destination-list" className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {destinations.map((destination) => (
                <DestinationReferenceCard key={destination.id} destination={destination} />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
              <p className="font-semibold text-[var(--color-text-secondary)]">
                Chưa có gợi ý điểm đến cho khu vực này.
              </p>
            </div>
          )}
        </section>

        {relatedReferences.length > 0 && (
          <section aria-label="Bài viết liên quan" className="border-t border-[var(--color-border)] bg-white">
            <div className="mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="font-display text-3xl font-extrabold">Bài viết liên quan</h2>
                <Link
                  id="travel-reference-related-view-all"
                  href={ROUTES.travelReferences}
                  className="text-sm font-bold text-[var(--color-primary-darker)] transition-colors hover:text-[var(--color-primary-dark)]"
                >
                  Xem tất cả cẩm nang
                </Link>
              </div>

              <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {relatedReferences.map((related) => (
                  <Link
                    id={`travel-reference-related-${related.slug}`}
                    key={related.slug}
                    href={getTravelReferenceHref(related.slug)}
                    className="group overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm transition hover:shadow-md"
                  >
                    <span className="relative block aspect-[16/10] overflow-hidden bg-[var(--color-primary-lightest)]">
                      <Image
                        src={related.image}
                        alt={related.sourceLocation}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </span>
                    <span className="block p-5">
                      <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                        {related.sourceLocation} · {related.category}
                      </span>
                      <span className="mt-1.5 line-clamp-2 block font-display text-lg font-extrabold leading-snug text-[var(--color-text)] transition-colors group-hover:text-[var(--color-primary-darker)]">
                        {related.title}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
