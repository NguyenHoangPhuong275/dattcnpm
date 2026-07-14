import { useId, type Dispatch, type SetStateAction } from 'react';

import { formatDate } from '@/lib/date';
import { getTripScheduleBadge } from '@/lib/trip-utils';
import type { TripSummary } from '@/types/profile';

import type { TripEditDraft } from './types';

interface TripOverviewSectionProps {
  trip: TripSummary;
  itemCount: number;
  isEditing: boolean;
  draft: TripEditDraft;
  saving: boolean;
  setDraft: Dispatch<SetStateAction<TripEditDraft>>;
  onSave: () => void;
  onCancel: () => void;
}

export function TripOverviewSection({
  trip,
  itemCount,
  isEditing,
  draft,
  saving,
  setDraft,
  onSave,
  onCancel,
}: TripOverviewSectionProps): React.JSX.Element {
  const idPrefix = `trip-overview-${trip._id}-${useId()}`;

  if (isEditing) {
    return (
      <div className="rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-primary-lightest)]/30 p-4 mb-6">
        <div className="text-sm font-semibold text-[var(--color-text)] mb-3">Chỉnh sửa thông tin chuyến đi</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Tiêu đề</label>
            <input
              id={`${idPrefix}-title`}
              type="text"
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Điểm đến</label>
            <input
              id={`${idPrefix}-destination`}
              type="text"
              value={draft.destination}
              onChange={(event) => setDraft((current) => ({ ...current, destination: event.target.value }))}
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Ngày đi</label>
            <input
              id={`${idPrefix}-start-date`}
              type="date"
              value={draft.startDate}
              onChange={(event) => setDraft((current) => ({ ...current, startDate: event.target.value }))}
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Ngày về</label>
            <input
              id={`${idPrefix}-end-date`}
              type="date"
              value={draft.endDate}
              min={draft.startDate || undefined}
              onChange={(event) => setDraft((current) => ({ ...current, endDate: event.target.value }))}
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Mô tả</label>
            <textarea
              id={`${idPrefix}-description`}
              value={draft.description}
              onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              rows={3}
              maxLength={2000}
              placeholder="Ghi chú, mục tiêu chuyến đi..."
              className="w-full resize-y border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Liên kết ảnh bìa</label>
            <input
              id={`${idPrefix}-cover-image`}
              type="url"
              value={draft.coverImage}
              onChange={(event) => setDraft((current) => ({ ...current, coverImage: event.target.value }))}
              placeholder="https://..."
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] cursor-pointer">
            <input
              id={`${idPrefix}-public`}
              type="checkbox"
              checked={draft.isPublic}
              onChange={(event) => setDraft((current) => ({ ...current, isPublic: event.target.checked }))}
              className="rounded"
            />
            Công khai
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            id={`${idPrefix}-save`}
            type="button"
            onClick={onSave}
            disabled={saving || !draft.title.trim() || !draft.destination.trim()}
            className="text-sm px-4 py-2 rounded-lg bg-[var(--color-primary-darker)] hover:bg-[var(--color-primary-hover)] text-white disabled:opacity-50"
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
          <button
            id={`${idPrefix}-cancel`}
            type="button"
            onClick={onCancel}
            className="text-sm px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-lightest)]"
          >
            Hủy
          </button>
        </div>
      </div>
    );
  }

  const scheduleBadge = getTripScheduleBadge(trip.startDate, trip.endDate);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-6">
      <div className="rounded-xl border border-[var(--color-border)] px-3 py-2">
        <div className="text-xs text-[var(--color-text-muted)]">Tiêu đề</div>
        <div className="font-medium text-[var(--color-text)]">{trip.title}</div>
      </div>
      <div className="rounded-xl border border-[var(--color-border)] px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-[var(--color-text-muted)]">Thời gian</div>
          {scheduleBadge && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${scheduleBadge.className}`}>
              {scheduleBadge.label}
            </span>
          )}
        </div>
        <div className="font-medium text-[var(--color-text)]">{formatDate(trip.startDate)} đến {formatDate(trip.endDate)}</div>
      </div>
      <div className="rounded-xl border border-[var(--color-border)] px-3 py-2">
        <div className="text-xs text-[var(--color-text-muted)]">Trạng thái</div>
        <div className="font-medium text-[var(--color-text)]">{trip.isPublic ? 'Công khai' : 'Riêng tư'}</div>
      </div>
      <div className="rounded-xl border border-[var(--color-border)] px-3 py-2">
        <div className="text-xs text-[var(--color-text-muted)]">Số điểm dừng</div>
        <div className="font-medium text-[var(--color-text)]">{itemCount}</div>
      </div>
      {trip.description && (
        <div className="sm:col-span-2 rounded-xl border border-[var(--color-border)] px-3 py-2">
          <div className="text-xs text-[var(--color-text-muted)]">Mô tả</div>
          <div className="whitespace-pre-wrap font-medium text-[var(--color-text)]">{trip.description}</div>
        </div>
      )}
    </div>
  );
}
