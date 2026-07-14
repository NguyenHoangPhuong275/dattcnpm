import Link from 'next/link';

import { ROUTES } from '@/lib/constants';
import type { TripSummary } from '@/types/profile';

interface TripDetailHeaderProps {
  trip: TripSummary;
  canEdit: boolean;
  isEditing: boolean;
  onStartEdit: () => void;
  onClose: () => void;
}

export function TripDetailHeader({
  trip,
  canEdit,
  isEditing,
  onStartEdit,
  onClose,
}: TripDetailHeaderProps): React.JSX.Element {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <h3 className="font-semibold text-lg text-[var(--color-text)]">Chi tiết chuyến đi</h3>
        <p className="break-words text-xs text-[var(--color-text-muted)]">{trip.destination}</p>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2 sm:shrink-0">
        <Link
          id={`profile-trip-schedule-${trip._id}`}
          href={`${ROUTES.scheduleReference}/${trip._id}`}
          className="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-primary-darker)] hover:bg-[var(--color-primary-lightest)]"
        >
          Xem lịch trình
        </Link>
        {!isEditing && canEdit && (
          <button
            id={`profile-trip-edit-${trip._id}`}
            type="button"
            onClick={onStartEdit}
            className="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-lightest)]"
          >
            Sửa thông tin
          </button>
        )}
        <button
          id={`profile-trip-close-${trip._id}`}
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="rounded-lg p-2 text-[var(--color-text-muted)] transition hover:bg-[var(--color-bg)] hover:text-[var(--color-text-secondary)]"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
