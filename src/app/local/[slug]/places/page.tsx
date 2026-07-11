import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import AppHeader from '@/components/AppHeader';
import DestinationReferenceCard from '@/components/local/DestinationReferenceCard';
import EmptyState from '@/components/ui/EmptyState';
import { LOCALITIES, getLocalityBySlug, type PlacesTheme } from '@/data/localities';
import { getTourismDestinationsByRegion, type TourismDestination } from '@/lib/vietnam-tourism';

type LocalityPlacesPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ theme?: string }>;
};

const THEMES: Record<PlacesTheme, { label: string; keywords: string[] }> = {
  'van-hoa': {
    label: 'văn hóa – di tích',
    keywords: ['văn hóa', 'lịch sử', 'di tích', 'chùa', 'tâm linh', 'biểu tượng', 'địa danh nổi tiếng'],
  },
  'thien-nhien': {
    label: 'thiên nhiên',
    keywords: ['thiên nhiên', 'cảnh đẹp', 'núi', 'rừng', 'biển', 'hồ', 'thác', 'sinh thái'],
  },
};

function isPlacesTheme(value: string | undefined): value is PlacesTheme {
  return value === 'van-hoa' || value === 'thien-nhien';
}

function matchesTheme(destination: TourismDestination, keywords: string[]): boolean {
  return destination.keywords.some((keyword) => keywords.includes(keyword));
}

function sortByTheme(destinations: TourismDestination[], theme: PlacesTheme | null): TourismDestination[] {
  if (!theme) return destinations;
  const keywords = THEMES[theme].keywords;
  return [...destinations].sort(
    (a, b) => Number(matchesTheme(b, keywords)) - Number(matchesTheme(a, keywords))
  );
}

export function generateStaticParams(): Array<{ slug: string }> {
  return LOCALITIES.map((locality) => ({ slug: locality.slug }));
}

export async function generateMetadata({ params }: LocalityPlacesPageProps): Promise<Metadata> {
  const { slug } = await params;
  const locality = getLocalityBySlug(slug);

  if (!locality) {
    return {
      title: 'Địa phương không tồn tại | LOTUS TRAVEL',
    };
  }

  return {
    title: `Địa điểm tham khảo tại ${locality.name} | LOTUS TRAVEL`,
    description: `Danh sách địa điểm du lịch tham khảo tại ${locality.name}.`,
  };
}

export default async function LocalityPlacesPage({ params, searchParams }: LocalityPlacesPageProps): Promise<React.JSX.Element> {
  const [{ slug }, { theme: rawTheme }] = await Promise.all([params, searchParams]);
  const locality = getLocalityBySlug(slug);

  if (!locality) {
    notFound();
  }

  const theme = isPlacesTheme(rawTheme) ? rawTheme : null;
  const destinations = sortByTheme(getTourismDestinationsByRegion(locality.name), theme);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <AppHeader active="local" showSearch={false} />

      <main className="mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <Link
          href={`/local/${locality.slug}`}
          className="text-sm font-semibold text-[var(--color-primary-darker)] transition-colors hover:text-[var(--color-primary-dark)]"
        >
          ← Quay lại {locality.name}
        </Link>

        <h1 className="mt-4 font-display text-3xl font-extrabold sm:text-4xl">
          Địa điểm tham khảo tại {locality.name}
        </h1>
        <p className="mt-2 max-w-3xl text-base leading-7 text-[var(--color-text-secondary)]">
          {theme
            ? `Danh sách gợi ý, ưu tiên nhóm ${THEMES[theme].label}. Chọn một địa điểm để đưa vào lịch trình của bạn.`
            : 'Danh sách gợi ý những điểm đến nổi bật. Chọn một địa điểm để đưa vào lịch trình của bạn.'}
        </p>

        {destinations.length > 0 ? (
          <div id="locality-destination-list" className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.map((destination) => (
              <DestinationReferenceCard key={destination.id} destination={destination} />
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <EmptyState
              title={`Chưa có dữ liệu địa điểm tham khảo cho ${locality.name}.`}
              description="Bạn có thể tìm kiếm địa điểm trực tiếp trên trang chủ."
              actionLabel="Tìm kiếm địa điểm"
              actionHref={`/?q=${encodeURIComponent(locality.name)}`}
            />
          </div>
        )}
      </main>
    </div>
  );
}
