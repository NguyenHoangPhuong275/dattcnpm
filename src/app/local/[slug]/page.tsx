import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import AppHeader from '@/components/AppHeader';
import {
  LOCALITIES,
  LOCALITY_DISCOVERY,
  LOCALITY_NEWS,
  type Locality,
  type StoryCard,
  getLocalityBySlug,
  getLocalityGuideSections,
} from '@/lib/localities';

type LocalityDetailPageProps = {
  params: Promise<{ slug: string }>;
};

interface RegionBannerProps {
  locality: Locality;
}

interface RegionOverviewProps {
  locality: Locality;
}

interface SectionTitleProps {
  title: string;
  href?: string;
}

interface StoryGridProps {
  items: StoryCard[];
}

export function generateStaticParams() {
  return LOCALITIES.map((locality) => ({ slug: locality.slug }));
}

export async function generateMetadata({ params }: LocalityDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const locality = getLocalityBySlug(slug);

  if (!locality) {
    return {
      title: 'Địa phương không tồn tại | LOTUS TRAVEL',
    };
  }

  return {
    title: `${locality.name} | LOTUS TRAVEL`,
    description: locality.summary,
  };
}

function RegionBanner({ locality }: RegionBannerProps) {
  return (
    <section className="relative h-[320px] overflow-hidden bg-slate-900 sm:h-[420px] lg:h-[500px]">
      <Image
        src={locality.image}
        alt={locality.name}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/15 to-black/55" />
      <div className="relative z-10 mx-auto flex h-full w-full max-w-[1180px] flex-col justify-end px-4 pb-8 sm:px-6 lg:px-8 lg:pb-12">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/80">
          {locality.region}
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-normal text-white sm:text-5xl lg:text-6xl">
          {locality.name}
        </h1>
      </div>
    </section>
  );
}

function RegionOverview({ locality }: RegionOverviewProps) {
  const sections = getLocalityGuideSections(locality);

  return (
    <section className="mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <h2 className="font-display text-3xl font-bold text-[var(--color-text)]">
        Những điều cần biết khi đến {locality.name}
      </h2>

      <div className="mt-8 space-y-8">
        {sections.map((section) => (
          <article key={section.title} className="space-y-3">
            <h3 className="font-display text-2xl font-bold text-[var(--color-text)]">
              {section.title}
            </h3>
            {section.paragraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="max-w-4xl text-base leading-8 text-[var(--color-text-secondary)]"
              >
                {paragraph}
              </p>
            ))}
          </article>
        ))}
      </div>
    </section>
  );
}

function SectionTitle({
  title,
  href,
}: SectionTitleProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="font-display text-3xl font-bold text-[var(--color-text)]">{title}</h2>
      {href && (
        <Link
          href={href}
          className="whitespace-nowrap text-sm font-semibold text-[var(--color-primary-darker)] transition-colors hover:text-[var(--color-primary-dark)]"
        >
          See more
        </Link>
      )}
    </div>
  );
}

function StoryGrid({ items }: StoryGridProps) {
  return (
    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <article
          key={item.title}
          className="group overflow-hidden rounded-[18px] border border-[var(--color-border)] bg-white"
        >
          <div className="relative aspect-[1.45/1] bg-slate-100">
            <Image
              src={item.image}
              alt={item.title}
              fill
              sizes="(max-width: 1024px) 50vw, 280px"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </div>
          <div className="p-4">
            <h3 className="line-clamp-2 text-base font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary-darker)]">
              {item.title}
            </h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--color-text-secondary)]">
              {item.description}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}

function RegionNews() {
  return (
    <section id="travel-news" className="bg-white py-10 lg:py-14">
      <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <SectionTitle title="Tin tức du lịch" />
        <StoryGrid items={LOCALITY_NEWS} />
      </div>
    </section>
  );
}

function RegionDiscover() {
  return (
    <section className="bg-white py-10 lg:py-14">
      <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <SectionTitle title="Khám phá thêm" />
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {LOCALITY_DISCOVERY.map((item) => (
            <article
              key={item.title}
              className="group overflow-hidden rounded-[18px] border border-[var(--color-border)] bg-white"
            >
              <div className="relative aspect-[1.25/1] bg-slate-100">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 360px"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-4">
                <h3 className="text-base font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary-darker)]">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                  {item.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function LocalityDetailPage({ params }: LocalityDetailPageProps) {
  const { slug } = await params;
  const locality = getLocalityBySlug(slug);

  if (!locality) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white text-[var(--color-text)]">
      <AppHeader active="local" showSearch={false} />

      <main>
        <RegionBanner locality={locality} />
        <RegionOverview locality={locality} />
        <RegionNews />
        <RegionDiscover />
      </main>
    </div>
  );
}
