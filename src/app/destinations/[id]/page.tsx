import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import AppHeader from '@/components/AppHeader';
import { MapPinIcon } from '@/components/icons';
import DestinationImage from '@/components/local/DestinationImage';
import DestinationReferenceCard from '@/components/local/DestinationReferenceCard';
import { ROUTES } from '@/lib/constants';
import { buildDestinationEditorialContent } from '@/lib/destination-content';
import { getPlannerDestinationHref } from '@/lib/travel-references';
import { getTourismDestinationById, getTourismDestinationsByRegion } from '@/lib/vietnam-tourism';

type DestinationPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: DestinationPageProps): Promise<Metadata> {
  const { id } = await params;
  const destination = getTourismDestinationById(id);

  if (!destination) {
    return { title: 'Địa điểm không tồn tại | LOTUS TRAVEL' };
  }

  return {
    title: `${destination.name} | LOTUS TRAVEL`,
    description: destination.description,
  };
}

export default async function DestinationPage({ params }: DestinationPageProps): Promise<React.JSX.Element> {
  const { id } = await params;
  const destination = getTourismDestinationById(id);

  if (!destination) {
    notFound();
  }

  const relatedDestinations = getTourismDestinationsByRegion(destination.province)
    .filter((item) => item.id !== destination.id)
    .slice(0, 3);
  const editorial = buildDestinationEditorialContent(destination, relatedDestinations);
  const mapQuery = `${destination.name}, ${destination.province}`;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <AppHeader active="destinations" showSearch={false} />

      <main>
        <section className="mx-auto w-full max-w-[1240px] px-4 pb-10 pt-6 sm:px-6 sm:pb-14 sm:pt-8 lg:px-8 lg:pb-16">
          <Link
            id="back-to-travel-references"
            href={ROUTES.travelReferences}
            className="inline-flex min-h-11 items-center text-sm font-bold text-[var(--color-primary-darker)] transition-colors hover:text-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-dark)]"
          >
            Quay lại cẩm nang du lịch
          </Link>

          <div className="mt-4 grid overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-float)] lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
            <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12 xl:p-14">
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--color-primary-darker)]">
                Cẩm nang điểm đến
              </p>
              <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-muted)]">
                <MapPinIcon className="h-4 w-4 shrink-0 text-[var(--color-primary-dark)]" />
                <span>{destination.province}</span>
              </div>
              <h1 className="mt-4 max-w-xl font-display text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-6xl">
                {destination.name}
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-[var(--color-text-secondary)] sm:text-lg">
                {destination.description}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  id={`plan-destination-${destination.id}`}
                  href={getPlannerDestinationHref(destination.name)}
                  className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-[var(--color-primary-darker)] px-5 text-center text-sm font-bold text-white transition-colors hover:bg-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-darker)] focus-visible:ring-offset-2"
                >
                  Lên lịch trình
                </Link>
                <a
                  id={`map-destination-${destination.id}`}
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-5 text-center text-sm font-bold text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary-dark)] hover:text-[var(--color-primary-darker)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-dark)] focus-visible:ring-offset-2"
                >
                  Xem trên bản đồ
                  <span className="sr-only">, mở trong thẻ mới</span>
                </a>
              </div>
            </div>

            <div className="relative min-h-[300px] overflow-hidden bg-[var(--color-primary-lightest)] sm:min-h-[420px] lg:min-h-[560px]">
              <DestinationImage
                src={destination.image || null}
                name={destination.name}
                province={destination.province}
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        <section className="border-y border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="mx-auto grid w-full max-w-[1180px] gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14 lg:px-8 lg:py-20">
            <article className="min-w-0">
              <section aria-labelledby="destination-overview-title">
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--color-primary-darker)]">
                  Tổng quan
                </p>
                <h2
                  id="destination-overview-title"
                  className="mt-3 max-w-3xl font-display text-3xl font-extrabold leading-tight sm:text-4xl"
                >
                  {editorial.overviewTitle}
                </h2>
                <div className="mt-6 max-w-3xl space-y-5">
                  {editorial.overviewParagraphs.map((paragraph) => (
                    <p key={paragraph} className="text-base leading-8 text-[var(--color-text-secondary)] sm:text-lg">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>

              <section aria-labelledby="destination-experience-title" className="mt-14 sm:mt-16">
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--color-primary-darker)]">
                  Gợi ý trải nghiệm
                </p>
                <h2
                  id="destination-experience-title"
                  className="mt-3 max-w-3xl font-display text-3xl font-extrabold leading-tight"
                >
                  {editorial.experienceTitle}
                </h2>
                <ol className="mt-7 grid gap-4">
                  {editorial.experienceItems.map((item, index) => (
                    <li
                      key={item.title}
                      className="grid gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5 sm:grid-cols-[52px_minmax(0,1fr)] sm:p-6"
                    >
                      <span
                        aria-hidden="true"
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-primary-lightest)] font-display text-sm font-extrabold text-[var(--color-primary-darker)]"
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <h3 className="font-display text-lg font-extrabold text-[var(--color-text)]">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-sm leading-7 text-[var(--color-text-secondary)] sm:text-base">
                          {item.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              <section
                aria-labelledby="destination-related-route-title"
                className="mt-14 rounded-3xl border border-[var(--color-border)] bg-[var(--color-primary-lightest)] p-6 sm:mt-16 sm:p-8"
              >
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--color-primary-darker)]">
                  Kết nối điểm đến
                </p>
                <h2 id="destination-related-route-title" className="mt-3 font-display text-2xl font-extrabold">
                  {editorial.relatedTitle}
                </h2>
                <p className="mt-4 text-base leading-8 text-[var(--color-text-secondary)]">
                  {editorial.relatedParagraph}
                </p>
              </section>
            </article>

            <aside aria-labelledby="destination-preparation-title" className="lg:pt-1">
              <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6 shadow-[var(--shadow-card)] lg:sticky lg:top-24">
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--color-primary-darker)]">
                  Trước khi khởi hành
                </p>
                <h2 id="destination-preparation-title" className="mt-3 font-display text-2xl font-extrabold leading-tight">
                  Chuẩn bị gọn, trải nghiệm chủ động
                </h2>
                <ul className="mt-6 divide-y divide-[var(--color-border)]">
                  {editorial.preparationItems.map((item) => (
                    <li key={item.title} className="py-5 first:pt-0 last:pb-0">
                      <h3 className="text-sm font-extrabold text-[var(--color-text)]">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                        {item.description}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </section>

        {relatedDestinations.length > 0 && (
          <section className="bg-[var(--color-bg)]">
            <div className="mx-auto w-full max-w-[1180px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
              <div className="max-w-2xl">
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--color-primary-darker)]">
                  Khám phá thêm
                </p>
                <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
                  Điểm đến khác tại {destination.province}
                </h2>
                <p className="mt-4 text-base leading-7 text-[var(--color-text-secondary)]">
                  Tiếp tục mở rộng hành trình với những điểm dừng cùng khu vực và lựa chọn nhịp di chuyển phù hợp với thời gian của bạn.
                </p>
              </div>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {relatedDestinations.map((item) => (
                  <DestinationReferenceCard key={item.id} destination={item} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
