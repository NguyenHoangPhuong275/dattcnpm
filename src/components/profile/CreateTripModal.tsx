'use client';

import React from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface CreateTripModalProps {
  open: boolean;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  description: string;
  isPublic: boolean;
  creating: boolean;
  onClose: () => void;
  onTitleChange: (v: string) => void;
  onDestChange: (v: string) => void;
  onStartDateChange: (v: string) => void;
  onEndDateChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onIsPublicChange: (v: boolean) => void;
  onCreate: () => void;
}

export default function CreateTripModal({
  open,
  title,
  destination,
  startDate,
  endDate,
  description,
  isPublic,
  creating,
  onClose,
  onTitleChange,
  onDestChange,
  onStartDateChange,
  onEndDateChange,
  onDescriptionChange,
  onIsPublicChange,
  onCreate,
}: CreateTripModalProps): React.JSX.Element | null {
  if (!open) return null;

  const hasDateError = Boolean(startDate && endDate && endDate < startDate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="create-trip-title">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6">
        <h3 id="create-trip-title" className="mb-4 text-lg font-semibold">Tạo chuyến đi mới</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="trip-title" className="mb-1 block text-xs font-medium text-slate-500">Tiêu đề</label>
            <input
              id="trip-title"
              type="text"
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)]/20"
              placeholder="Hội An 4 ngày"
            />
          </div>
          <div>
            <label htmlFor="trip-destination" className="mb-1 block text-xs font-medium text-slate-500">Điểm đến</label>
            <input
              id="trip-destination"
              type="text"
              value={destination}
              onChange={(event) => onDestChange(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)]/20"
              placeholder="Hội An, Quảng Nam"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="trip-start-date" className="mb-1 block text-xs font-medium text-slate-500">Ngày đi</label>
              <input
                id="trip-start-date"
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(event) => onStartDateChange(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)]/20"
              />
            </div>
            <div>
              <label htmlFor="trip-end-date" className="mb-1 block text-xs font-medium text-slate-500">Ngày về</label>
              <input
                id="trip-end-date"
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => onEndDateChange(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)]/20"
                aria-invalid={hasDateError}
                aria-describedby={hasDateError ? 'trip-date-error' : undefined}
              />
            </div>
          </div>
          {hasDateError && (
            <p id="trip-date-error" className="text-sm font-medium text-red-600" role="alert">
              Ngày kết thúc phải sau ngày bắt đầu.
            </p>
          )}
          <div>
            <label htmlFor="trip-description" className="mb-1 block text-xs font-medium text-slate-500">Mô tả (tùy chọn)</label>
            <textarea
              id="trip-description"
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)]/20"
              rows={2}
              placeholder="Ghi chú thêm về chuyến đi..."
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(event) => onIsPublicChange(event.target.checked)}
              className="rounded accent-[var(--color-primary-dark)]"
            />
            Công khai chuyến đi
          </label>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-300 py-2 text-sm hover:bg-slate-50"
            disabled={creating}
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--color-primary-dark)] py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={creating || hasDateError}
          >
            {creating ? (
              <>
                <LoadingSpinner size="sm" />
                Đang tạo...
              </>
            ) : 'Tạo chuyến đi'}
          </button>
        </div>
      </div>
    </div>
  );
}
