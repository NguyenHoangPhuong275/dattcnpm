'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAddToTrip } from '@/hooks/useAddToTrip';
import { ROUTES } from '@/lib/constants';

interface AddToTripModalProps {
  isOpen: boolean;
  placeName: string;
  placeId: string;
  onClose: () => void;
}

export default function AddToTripModal({
  isOpen,
  placeName,
  placeId,
  onClose,
}: AddToTripModalProps): React.JSX.Element | null {
  const { status, trips, errorMessage, openModal, closeModal, addToTrip } = useAddToTrip();
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<number>(1);

  useEffect(() => {
    if (isOpen) {
      openModal();
      setSelectedTripId('');
      setSelectedDay(1);
    } else {
      closeModal();
    }
  }, [isOpen, openModal, closeModal]);

  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        onClose();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [status, onClose]);

  if (!isOpen) return null;

  const handleAdd = async () => {
    if (!selectedTripId) return;
    await addToTrip(selectedTripId, selectedDay, placeId);
  };

  const isLoading = status === 'loading-trips' || status === 'submitting';
  const showSuccess = status === 'success';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-to-trip-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 id="add-to-trip-title" className="text-xl font-bold text-slate-900">
            Thêm {placeName} vào lịch trình
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-full p-2 text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {showSuccess && (
          <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700" role="status">
            Đã thêm {placeName} vào chuyến đi!
          </div>
        )}

        {status === 'loading-trips' && (
          <div className="mt-6 space-y-3">
            <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
          </div>
        )}

        {status === 'error' && errorMessage && (
          <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
            {errorMessage}
          </div>
        )}

        {status === 'ready' && trips.length === 0 && (
          <div className="mt-6 text-center">
            <p className="text-sm font-medium text-slate-600">Bạn chưa có chuyến đi nào.</p>
            <Link
              href={ROUTES.trips}
              className="mt-3 inline-block rounded-2xl bg-[var(--color-primary-darker)] px-4 py-2 text-sm font-bold text-white"
              onClick={onClose}
            >
              Tạo chuyến đi mới
            </Link>
          </div>
        )}

        {(status === 'ready' || status === 'error') && trips.length > 0 && !showSuccess && (
          <>
            <div className="mt-4">
              <label className="mb-1 block text-sm font-semibold text-slate-700">Chọn chuyến đi</label>
              <div className="max-h-48 space-y-2 overflow-auto rounded-xl border border-slate-200 p-1">
                {trips.map((trip) => (
                  <button
                    key={trip._id}
                    type="button"
                    onClick={() => setSelectedTripId(trip._id)}
                    className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                      selectedTripId === trip._id
                        ? 'border-[var(--color-primary-dark)] bg-[var(--color-primary-lightest)]'
                        : 'border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-slate-800">{trip.title}</div>
                    <div className="text-xs text-slate-500">{trip.destination}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="day" className="mb-1 block text-sm font-semibold text-slate-700">
                Ngày thứ
              </label>
              <input
                id="day"
                type="number"
                min={1}
                max={30}
                value={selectedDay}
                onChange={(e) => setSelectedDay(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                aria-label="Ngày trong lịch trình"
              />
            </div>

            {errorMessage && status === 'error' && (
              <div className="mt-3 text-sm text-red-600" role="alert">{errorMessage}</div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-2xl border border-slate-200 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={!selectedTripId || isLoading}
                className="flex-1 rounded-2xl bg-[var(--color-primary-darker)] py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                {isLoading ? 'Đang thêm...' : 'Thêm vào lịch trình'}
              </button>
            </div>
          </>
        )}

        {status === 'submitting' && (
          <div className="mt-6 text-center text-sm font-medium text-slate-600">Đang thêm địa điểm...</div>
        )}
      </div>
    </div>
  );
}
