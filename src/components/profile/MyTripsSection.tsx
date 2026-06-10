'use client';

import React, { memo } from 'react';
import { TripSummary } from '@/types/profile';

export type { TripSummary }; 

interface MyTripsSectionProps {
  trips: TripSummary[];
  onCreateNew: () => void;
  onViewDetail: (trip: TripSummary) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

const MyTripsSection = memo(({ trips, onCreateNew, onViewDetail, onDelete, loading }: MyTripsSectionProps) => (
  <div>
    <div className="flex items-center justify-end mb-4">
      <button
        onClick={onCreateNew}
        className="text-sm font-semibold bg-[var(--color-primary-dark)] hover:bg-[var(--color-primary-darker)] text-white px-3 py-1.5 rounded-xl transition-colors disabled:opacity-60"
        disabled={loading}
      >
        + Tạo chuyến đi mới
      </button>
    </div>

    {loading ? (
      <div className="text-center py-8 text-slate-400 text-sm">Đang tải hành trình...</div>
    ) : trips.length > 0 ? (
      <div className="space-y-3">
        {trips.map(trip => (
          <div key={trip._id} className="border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-lg">{trip.title}</div>
              <div className="text-sm text-slate-500">{trip.destination} • {trip.startDate} → {trip.endDate}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-3 py-1 rounded-full font-bold ${trip.isPublic ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                {trip.isPublic ? 'Công khai' : 'Riêng tư'}
              </span>
              <button
                onClick={() => onViewDetail(trip)}
                className="text-sm font-semibold text-[var(--color-primary-dark)] hover:bg-[var(--color-primary-dark)]/10 px-2 py-1 rounded transition-colors"
              >
                Xem chi tiết →
              </button>
              <button
                onClick={() => onDelete(trip._id)}
                className="text-sm text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                title="Xóa chuyến đi"
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-10 text-slate-400">Bạn chưa có chuyến đi nào. Hãy bắt đầu tạo chuyến đi đầu tiên!</div>
    )}
  </div>
));

MyTripsSection.displayName = 'MyTripsSection';

export default MyTripsSection;
