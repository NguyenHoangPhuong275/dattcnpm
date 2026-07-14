import Link from 'next/link';
import DestinationImage from '@/components/local/DestinationImage';
import { getDestinationDetailHref, getPlannerDestinationHref } from '@/lib/travel-references';
import type { TourismDestination } from '@/lib/vietnam-tourism';

interface DestinationReferenceCardProps {
  destination: TourismDestination;
}

export default function DestinationReferenceCard({ destination }: DestinationReferenceCardProps): React.JSX.Element {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:border-[var(--color-primary-dark)]/20">
      <Link
        id={`view-destination-image-${destination.id}`}
        href={getDestinationDetailHref(destination.id)}
        aria-label={`Xem chi tiết ${destination.name}`}
        className="relative block aspect-[16/10] overflow-hidden bg-[var(--color-primary-lightest)] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary-dark)]"
      >
        <DestinationImage
          src={destination.image || null}
          name={destination.name}
          province={destination.province}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </Link>

      <div className="flex flex-1 flex-col p-6">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary-dark)]">
          {destination.province}
        </span>
        <Link
          id={`view-destination-${destination.id}`}
          href={getDestinationDetailHref(destination.id)}
          aria-label={`Xem chi tiết ${destination.name}`}
          className="block outline-none hover:underline focus-visible:underline"
        >
          <h2 className="mt-1 font-display text-xl font-extrabold leading-snug text-[var(--color-text)] transition-colors group-hover:text-[var(--color-primary-darker)]">
            {destination.name}
          </h2>
        </Link>

        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {destination.description}
        </p>

        <div className="mt-auto border-t border-slate-100 pt-5">
          <Link
            id={`plan-reference-${destination.id}`}
            href={getPlannerDestinationHref(destination.name)}
            className="inline-flex text-sm font-bold text-[var(--color-primary-darker)] transition-all hover:text-[var(--color-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-dark)]"
          >
            Lên lịch trình với điểm đến này
          </Link>
        </div>
      </div>
    </article>
  );
}
