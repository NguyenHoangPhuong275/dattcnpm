'use client';

import React, { memo } from 'react';
import { PlusIcon } from '@/components/icons';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PageSkeleton from '@/components/ui/PageSkeleton';
import TripCard from '@/components/trips/TripCard';
import type { TripSummary } from '@/types/profile';

interface MyTripsSectionProps {
  trips: TripSummary[];
  onCreateNew: () => void;
  onViewDetail: (trip: TripSummary) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

const MyTripsSection = memo(({
  trips,
  onCreateNew,
  onViewDetail,
  onDelete,
  loading,
}: MyTripsSectionProps): React.JSX.Element => (
  <div className="space-y-5">
    <div className="flex items-center justify-end">
      <button
        id="profile-create-trip-button"
        type="button"
        onClick={onCreateNew}
        className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary-dark)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--color-primary-darker)] disabled:opacity-60"
        disabled={loading}
      >
        {loading ? <LoadingSpinner size="sm" /> : <PlusIcon className="h-4 w-4" />}
        Tao lich trinh
      </button>
    </div>

    {loading ? (
      <PageSkeleton count={4} variant="horizontal" />
    ) : trips.length > 0 ? (
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {trips.map((trip) => (
          <TripCard key={trip._id} trip={trip} variant="horizontal" onClick={onViewDetail} onDelete={onDelete} />
        ))}
      </div>
    ) : (
      <EmptyState
        title="Ban chua co chuyen di nao."
        description="Hay bat dau tao lich trinh dau tien."
        actionLabel="Tao lich trinh"
        onAction={onCreateNew}
      />
    )}
  </div>
));

MyTripsSection.displayName = 'MyTripsSection';

export default MyTripsSection;
