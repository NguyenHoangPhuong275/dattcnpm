import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import AppHeader from '@/components/AppHeader';
import { TRAVEL_REFERENCE_SLUGS } from '@/data/travel-references';
import { ROUTES } from '@/lib/constants';
import {
  formatReferenceDate,
  getLatestTravelReferences,
  getTravelReferenceHref,
} from '@/lib/travel-references';

export const metadata: Metadata = {
  title: 'Tin tức và cẩm nang du lịch | LOTUS TRAVEL',
  description: 'Cẩm nang du lịch và những điểm đến nổi bật trên khắp Việt Nam.',
};

const PAGE_SIZE = 6;

const CATEGORY_TABS = [
  { slug: null, label: 'Tất cả' },
  { slug: 'di-dau', label: 'Đi đâu' },
  { slug: 'o-dau', label: 'Ở đâu' },
  { slug: 'an-gi', label: 'Ăn gì' },
  { slug: 'choi-gi', label: 'Chơi gì' },
] as const;

type TravelReferencesPageProps = {
  searchParams: Promise<{ tab?: string; page?: string }>;
};

function buildHref(tabSlug: string | null, page: number): string {
  const params = new URLSearchParams();
  if (tabSlug) params.set('tab', tabSlug);
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return query ? `${ROUTES.travelReferences}?${query}` : ROUTES.travelReferences;
}

export default async function TravelReferencesPage({ searchParams }: TravelReferencesPageProps): Promise<React.JSX.Element> {
  const { tab: rawTab, page: rawPage } = await searchParams;

  const activeTab = CATEGORY_TABS.find((tab) => tab.slug === rawTab) ?? CATEGORY_TABS[0];
  const allArticles = getLatestTravelReferences(TRAVEL_REFERENCE_SLUGS.length);
  const filtered = activeTab.slug
    ? allArticles.filter((article) => article.category === activeTab.label)
    : allArticles;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const requestedPage = Number.parseInt(rawPage ?? '1', 10);
  const page = Number.isFinite(requestedPage) ? Math.min(Math.max(1, requestedPage), totalPages) : 1;
  const articles = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <AppHeader active="news" />

      <main className="mx-auto w-full max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-primary-darker)]">
            Cẩm nang LOTUS TRAVEL
          </p>
        </div>

        <nav aria-label="Phân loại cẩm nang" className="mt-8 flex flex-wrap gap-2">
          {CATEGORY_TABS.map((tab) => {
            const isActive = tab.slug === activeTab.slug;
            return (
              <Link
                id={`travel-reference-tab-${tab.slug ?? 'all'}`}
                key={tab.label}
                href={buildHref(tab.slug, 1)}
                aria-current={isActive ? 'page' : undefined}
                className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${isActive
                    ? 'bg-[var(--color-primary-darker)] text-white'
                    : 'border border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] hover:border-[var(--color-primary-dark)] hover:text-[var(--color-primary-darker)]'
                  }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {articles.length > 0 ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((reference) => (
              <Link
                id={`travel-reference-${reference.slug}`}
                key={reference.slug}
                href={getTravelReferenceHref(reference.slug)}
                className="group overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm transition hover:border-[var(--color-primary-dark)] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
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
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-xs font-bold uppercase tracking-wide text-[var(--color-primary-darker)]">
                      {reference.sourceLocation} · {reference.region}
                    </p>
                    <span className="shrink-0 rounded-full bg-[var(--color-primary-lightest)] px-2 py-0.5 text-[11px] font-bold text-[var(--color-primary-darker)]">
                      {reference.category}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">{formatReferenceDate(reference.publishedAt)}</p>
                  <h2 className="mt-2 line-clamp-2 text-lg font-extrabold text-[var(--color-text)]">
                    {reference.title}
                  </h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                    {reference.description}
                  </p>
                  <span className="mt-4 inline-flex text-sm font-bold text-[var(--color-primary-darker)]">
                    Xem cẩm nang
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-white px-6 py-12 text-center">
            <p className="text-sm font-semibold text-[var(--color-text)]">
              Chưa có bài viết trong mục “{activeTab.label}”.
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Hãy xem các mục khác hoặc quay lại sau khi có bài mới.
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <nav aria-label="Phân trang cẩm nang" className="mt-10 flex items-center justify-center gap-2">
            {(() => {
              const getPageNumbers = (current: number, total: number): Array<number | '...'> => {
                if (total <= 5) {
                  return Array.from({ length: total }, (_, i) => i + 1);
                }
                const pages: Array<number | '...'> = [];
                pages.push(1);
                if (current > 3) pages.push('...');
                const start = Math.max(2, current - 1);
                const end = Math.min(total - 1, current + 1);
                for (let i = start; i <= end; i++) {
                  if (i > 1 && i < total) {
                    pages.push(i);
                  }
                }
                if (current < total - 2) pages.push('...');
                pages.push(total);
                return pages;
              };

              return (
                <>
                  {page > 1 ? (
                    <Link
                      id="travel-reference-page-previous"
                      href={buildHref(activeTab.slug, page - 1)}
                      className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
                    >
                      &lt;
                    </Link>
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-50 text-slate-300 opacity-50 cursor-not-allowed">
                      &lt;
                    </span>
                  )}

                  {getPageNumbers(page, totalPages).map((p, idx) => {
                    if (p === '...') {
                      return (
                        <span
                          key={`ellipsis-${idx}`}
                          className="flex h-10 w-10 items-center justify-center font-bold text-sm text-slate-400 cursor-default"
                        >
                          ...
                        </span>
                      );
                    }

                    const isActive = p === page;
                    return (
                      <Link
                        id={`travel-reference-page-${p}`}
                        key={`page-${p}`}
                        href={buildHref(activeTab.slug, p)}
                        className={`flex h-10 w-10 items-center justify-center rounded-md font-bold text-sm transition-all duration-200 ${isActive
                            ? 'bg-[var(--color-primary)] text-white shadow-sm'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                      >
                        {p}
                      </Link>
                    );
                  })}

                  {page < totalPages ? (
                    <Link
                      id="travel-reference-page-next"
                      href={buildHref(activeTab.slug, page + 1)}
                      className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
                    >
                      &gt;
                    </Link>
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-50 text-slate-300 opacity-50 cursor-not-allowed">
                      &gt;
                    </span>
                  )}
                </>
              );
            })()}
          </nav>
        )}
      </main>
    </div>
  );
}
