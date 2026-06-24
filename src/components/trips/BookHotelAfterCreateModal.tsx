'use client';

import React from 'react';
import TripAccommodationSection from '@/components/trips/TripAccommodationSection';

interface BookHotelAfterCreateModalProps {
  open: boolean;
  tripId: string;
  destination: string;
  userId: string | null;
  startDate?: string | null;
  endDate?: string | null;
  onClose: () => void;
}

export default function BookHotelAfterCreateModal({
  open,
  tripId,
  destination,
  userId,
  startDate,
  endDate,
  onClose,
}: BookHotelAfterCreateModalProps): React.JSX.Element | null {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-hotel-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-[var(--color-surface)] shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-6 py-4">
          <div>
            <h2 id="book-hotel-title" className="text-xl font-bold text-[var(--color-text)]">Đặt khách sạn cho chuyến đi</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Gợi ý khách sạn tại {destination || 'điểm đến'}. Bấm &quot;Lưu vào chuyến đi&quot; để đặt ngay, hoặc để sau.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg)]"
          >
            Đóng
          </button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-4">
          <TripAccommodationSection
            tripId={tripId}
            userId={userId}
            destination={destination}
            startDate={startDate ?? undefined}
            endDate={endDate ?? undefined}
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-[var(--color-border)] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--color-border)] px-5 py-2 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]"
          >
            Để sau
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[var(--color-primary-darker)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]"
          >
            Xong
          </button>
        </div>
      </div>
    </div>
  );
}
