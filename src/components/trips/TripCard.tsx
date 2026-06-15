'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { KeyboardEvent, MouseEvent } from 'react';
import { CalendarIcon, TrashIcon } from '@/components/icons';
import { formatDateRange, getTripCities, getTripImage } from '@/lib/trip-utils';
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
    'group overflow-hidden rounded-lg border bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--color-primary-dark)] hover:shadow-md',
    selected ? 'border-[var(--color-primary-dark)] ring-2 ring-[var(--color-primary-dark)]/20' : 'border-slate-200',
  ].join(' ');
}

function CityChips({ destination }: CityChipsProps): React.JSX.Element {
  const cities = getTripCities(destination);
  const labels = cities.length > 0 ? cities : [destination];

  return (
    <div className="flex flex-wrap gap-1.5 text-xs font-semibold text-slate-600">
      {labels.map((city) => (
        <span key={city} className="rounded-full bg-slate-100 px-2.5 py-1">
          {city}
        </span>
      ))}
    </div>
  );
}

function TripMeta({ trip }: TripMetaProps): React.JSX.Element {
  return (
    <div className="space-y-2 text-sm text-slate-600">
      <div className="flex items-center gap-2">
        <CalendarIcon className="h-4 w-4 text-[var(--color-primary-dark)]" />
        <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
      </div>
    </div>
  );
}

function TripStatus({ isPublic }: TripStatusProps): React.JSX.Element {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${isPublic ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
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
      alt={trip.title}
      fill
      sizes={sizes}
      className="object-cover transition duration-300 group-hover:scale-105"
    />
  );
}

function TripCardContent({ trip, variant, onDelete }: TripCardContentProps): React.JSX.Element {
  const handleDelete = (event: MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    onDelete?.(trip._id);
  };

  if (variant === 'horizontal') {
    return (
      <div className="grid grid-cols-[132px_minmax(0,1fr)] sm:grid-cols-[168px_minmax(0,1fr)]">
        <div className="relative min-h-[176px] bg-slate-100">
          <TripImage trip={trip} variant={variant} />
        </div>
        <div className="flex min-w-0 flex-col gap-3 p-4">
          <div className="min-w-0">
            <div className="truncate text-lg font-bold text-slate-900">{trip.title}</div>
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
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50"
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
      <div className="relative h-48 bg-slate-100">
        <TripImage trip={trip} variant={variant} />
      </div>
      <div className="space-y-3 p-4">
        <div>
          <h2 className="truncate text-lg font-extrabold text-slate-950">{trip.title}</h2>
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

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (!onClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick(trip);
    }
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
        className={`w-full ${getCardClassName(selected)}`}
        aria-pressed={selected}
      >
        <TripCardContent trip={trip} variant={variant} onDelete={onDelete} />
      </button>
    );
  }

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick ? handleClick : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      className={getCardClassName(selected)}
    >
      <TripCardContent trip={trip} variant={variant} onDelete={onDelete} />
    </div>
  );
}
