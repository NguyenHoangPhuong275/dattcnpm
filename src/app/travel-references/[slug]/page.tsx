import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import AppHeader from '@/components/AppHeader';
import DestinationReferenceCard from '@/components/local/DestinationReferenceCard';
import { TRAVEL_REFERENCE_SLUGS } from '@/data/travel-references';
import { ROUTES } from '@/lib/constants';
import { getTravelReferencePageData } from '@/lib/travel-references';

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
              href={ROUTES.travelReferences}
              className="mb-5 w-fit text-sm font-bold text-white/85 transition hover:text-white"
            >
              ← Tất cả cẩm nang
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
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div>
              <h2 className="font-display text-3xl font-extrabold">
                Danh sách địa điểm tham khảo
              </h2>
              <p className="mt-2 text-base leading-7 text-[var(--color-text-secondary)]">
                Các địa điểm dưới đây được lấy theo khu vực {reference.region}, tương ứng với địa danh trong hình ảnh.
              </p>

              {destinations.length > 0 ? (
                <div id="reference-destination-list" className="mt-7 grid gap-5 sm:grid-cols-2">
                  {destinations.map((destination) => (
                    <DestinationReferenceCard key={destination.id} destination={destination} />
                  ))}
                </div>
              ) : (
                <div className="mt-7 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
                  <p className="font-semibold text-[var(--color-text-secondary)]">
                    Chưa có địa điểm tham khảo cho khu vực này.
                  </p>
                </div>
              )}
            </div>

            <aside className="h-fit rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 lg:sticky lg:top-24">
              <h2 className="font-display text-xl font-extrabold">Lưu ý cho hành trình</h2>
              <ul className="mt-4 space-y-3">
                {reference.tips.map((tip) => (
                  <li key={tip} className="flex gap-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary-dark)]" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}
