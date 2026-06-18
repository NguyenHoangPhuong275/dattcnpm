'use client';

import Image from 'next/image';
import Link from 'next/link';
import { CalendarIcon, TrashIcon } from '@/components/icons';
import { formatDateRange, getTripCities, getTripImage, getTripScheduleBadge } from '@/lib/trip-utils';
import type { TripSummary } from '@/types/profile';

interface TripCardProps {
  trip: TripSummary;
  variant?: 'horizontal' | 'vertical';
  href?: string;
  onClick?: (trip: TripSummary) => void;
  onDelete?: (id: string) => void;
  selected?: boolean;
}

interface CityChipsProps {
  destination: string;
}

interface TripMetaProps {
  trip: TripSummary;
}

interface TripStatusProps {
  isPublic: boolean;
}

interface TripCardContentProps {
  trip: TripSummary;
  variant: 'horizontal' | 'vertical';
  onDelete?: (id: string) => void;
}

interface TripImageProps {
  trip: TripSummary;
  variant: 'horizontal' | 'vertical';
}

function getCardClassName(selected = false): string {
  return [
    'group overflow-hidden rounded-lg border bg-[var(--color-surface)] text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--color-primary-dark)] hover:shadow-md',
    selected ? 'border-[var(--color-primary-dark)] ring-2 ring-[var(--color-primary-dark)]/20' : 'border-[var(--color-border)]',
  ].join(' ');
}

function CityChips({ destination }: CityChipsProps): React.JSX.Element {
  const cities = getTripCities(destination);
  const labels = cities.length > 0 ? cities : [destination];

  return (
    <div className="flex flex-wrap gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)]">
      {labels.map((city) => (
        <span key={city} className="rounded-full bg-[var(--color-primary-lightest)] px-2.5 py-1">
          {city}
        </span>
      ))}
    </div>
  );
}

function TripMeta({ trip }: TripMetaProps): React.JSX.Element {
  const scheduleBadge = getTripScheduleBadge(trip.startDate, trip.endDate);

  return (
    <div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
      <div className="flex flex-wrap items-center gap-2">
        <CalendarIcon className="h-4 w-4 text-[var(--color-primary-dark)]" />
        <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
        {scheduleBadge && (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${scheduleBadge.className}`}>
            {scheduleBadge.label}
          </span>
        )}
      </div>
    </div>
  );
}

function TripStatus({ isPublic }: TripStatusProps): React.JSX.Element {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${isPublic ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]' : 'bg-[var(--color-bg)] text-[var(--color-text-secondary)]'}`}>
      {isPublic ? 'Công khai' : 'Riêng tư'}
    </span>
  );
}
function TripImage({ trip, variant }: TripImageProps): React.JSX.Element {
  const sizes = variant === 'horizontal'
    ? '180px'
    : '(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw';

  return (
    <Image
      src={getTripImage(trip)}
      alt={`Ảnh bìa chuyến đi ${trip.title}`}
      fill
      sizes={sizes}
      className="object-cover transition duration-300 group-hover:scale-105"
    />
  );
}

function TripCardContent({ trip, variant, onDelete }: TripCardContentProps): React.JSX.Element {
  const handleDelete = (event: React.MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    onDelete?.(trip._id);
  };

  if (variant === 'horizontal') {
    return (
      <div className="grid grid-cols-[132px_minmax(0,1fr)] sm:grid-cols-[168px_minmax(0,1fr)]">
        <div className="relative min-h-[176px] bg-[var(--color-bg)]">
          <TripImage trip={trip} variant={variant} />
        </div>
        <div className="flex min-w-0 flex-col gap-3 p-4">
          <div className="min-w-0">
            <div className="truncate text-lg font-bold text-[var(--color-text)]">{trip.title}</div>
            <div className="mt-1">
              <CityChips destination={trip.destination} />
            </div>
          </div>

          <TripMeta trip={trip} />

          <div className="mt-auto flex items-center justify-between gap-3">
            <TripStatus isPublic={trip.isPublic} />
            {onDelete && (
              <button
                id={`trip-card-delete-button-${trip._id}`}
                type="button"
                onClick={handleDelete}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-danger)] transition hover:bg-[var(--color-danger)]/10"
                aria-label="Xóa chuyến đi"
                title="Xóa chuyến đi"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative h-48 bg-[var(--color-bg)]">
        <TripImage trip={trip} variant={variant} />
      </div>
      <div className="space-y-3 p-4">
        <div>
          <h2 className="truncate text-lg font-extrabold text-[var(--color-text)]">{trip.title}</h2>
          <div className="mt-2">
            <CityChips destination={trip.destination} />
          </div>
        </div>
        <TripMeta trip={trip} />
      </div>
    </>
  );
}

export default function TripCard({ trip, variant = 'vertical', href, onClick, onDelete, selected }: TripCardProps): React.JSX.Element {
  const handleClick = (): void => {
    onClick?.(trip);
  };

  if (href) {
    return (
      <Link href={href} className={getCardClassName(selected)}>
        <TripCardContent trip={trip} variant={variant} onDelete={onDelete} />
      </Link>
    );
  }

  if (onClick && !onDelete) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`w-full text-left ${getCardClassName(selected)}`}
        aria-pressed={selected}
      >
        <TripCardContent trip={trip} variant={variant} onDelete={onDelete} />
      </button>
    );
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>): void => {
    if (!onClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick(trip);
    }
  };

  return (
    <article
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick ? handleClick : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      className={getCardClassName(selected)}
    >
      <TripCardContent trip={trip} variant={variant} onDelete={onDelete} />
    </article>
  );
}
