import Link from 'next/link';
import { MapPinIcon } from '@/components/icons';
import { getPlannerDestinationHref } from '@/lib/travel-references';
import type { TourismDestination } from '@/lib/vietnam-tourism';

interface DestinationReferenceCardProps {
  destination: TourismDestination;
}

export default function DestinationReferenceCard({ destination }: DestinationReferenceCardProps): React.JSX.Element {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm transition hover:border-[var(--color-primary-dark)] hover:shadow-md">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-lightest)] text-[var(--color-primary-darker)]">
          <MapPinIcon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold text-[var(--color-text)]">{destination.name}</h2>
          <p className="mt-0.5 text-sm font-semibold text-[var(--color-text-muted)]">
            {destination.province}{destination.rating ? ` · ${destination.rating}` : ''}
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-[var(--color-text-secondary)]">
        {destination.description}
      </p>

      {destination.keywords.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {destination.keywords.slice(0, 3).map((keyword) => (
            <span
              key={keyword}
              className="rounded-full bg-[var(--color-primary-lightest)] px-2.5 py-1 text-xs font-semibold text-[var(--color-primary-darker)]"
            >
              {keyword}
            </span>
          ))}
        </div>
      )}

      <Link
        id={`plan-reference-${destination.id}`}
        href={getPlannerDestinationHref(destination.name)}
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--color-primary-darker)] px-4 text-sm font-bold text-white transition hover:bg-[var(--color-primary-dark)]"
      >
        Đưa vào thanh tạo lịch trình
      </Link>
    </article>
  );
}
