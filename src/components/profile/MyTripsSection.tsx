'use client';

import React, { memo } from 'react';
import { PlusIcon } from '@/components/icons';
import TripCard from '@/components/trips/TripCard';
import { TripSummary } from '@/types/profile';

interface MyTripsSectionProps {
  trips: TripSummary[];
  onCreateNew: () => void;
  onViewDetail: (trip: TripSummary) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

const MyTripsSection = memo(({ trips, onCreateNew, onViewDetail, onDelete, loading }: MyTripsSectionProps) => (
  <div className="space-y-5">
    <div className="flex items-center justify-end">
      <button
        onClick={onCreateNew}
        className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary-dark)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--color-primary-darker)] disabled:opacity-60"
        disabled={loading}
      >
        <PlusIcon className="h-4 w-4" />
        Tạo lịch trình
      </button>
    </div>

    {loading ? (
      <div className="rounded-lg border border-slate-200 py-10 text-center text-sm text-slate-500">Đang tải danh sách chuyến đi...</div>
    ) : trips.length > 0 ? (
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {trips.map((trip) => (
          <TripCard key={trip._id} trip={trip} variant="horizontal" onClick={onViewDetail} onDelete={onDelete} />
        ))}
      </div>
    ) : (
      <div className="rounded-lg border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500">
        Bạn chưa có chuyến đi nào. Hãy bắt đầu tạo lịch trình đầu tiên.
      </div>
    )}
  </div>
));

MyTripsSection.displayName = 'MyTripsSection';

export default MyTripsSection;
