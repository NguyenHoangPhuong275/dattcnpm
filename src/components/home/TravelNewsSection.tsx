import Image from 'next/image';
import Link from 'next/link';
import { HOME_NEWS } from '@/data/home';
import { getTravelReferenceHref } from '@/lib/travel-references';

export default function TravelNewsSection(): React.JSX.Element {
  return (
    <section id="travel-news" className="border-t border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-12 sm:px-6 sm:py-16 lg:px-8 xl:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h2 className="font-display text-3xl font-extrabold text-[var(--color-text)]">Tin tức du lịch</h2>
          <p className="mt-1 text-sm font-medium text-[var(--color-text-secondary)]">Cập nhật tin tức, xu hướng và cẩm nang du lịch mới nhất.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {HOME_NEWS.map((item) => (
            <Link
              id={`home-news-${item.referenceSlug}`}
              key={item.referenceSlug}
              href={getTravelReferenceHref(item.referenceSlug)}
              className="group overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white text-left shadow-sm transition hover:-translate-y-1 hover:border-[var(--color-primary-dark)] hover:shadow-md cursor-pointer w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            >
              <div className="relative aspect-[16/10] bg-[var(--color-primary-lightest)] w-full">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-5 space-y-3">
                <span className="inline-block rounded-full bg-[var(--color-primary-lightest)] px-2.5 py-1 text-xs font-bold text-[var(--color-primary-darker)]">
                  {item.category}
                </span>
                <h3 className="line-clamp-2 text-base font-extrabold text-[var(--color-text)] group-hover:text-[var(--color-primary-darker)] transition-colors">
                  {item.title}
                </h3>
                <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] font-medium">
                  <span>{item.date}</span>
                  <span>{item.views} lượt xem</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
