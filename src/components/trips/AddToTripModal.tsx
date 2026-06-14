'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAddToTrip } from '@/hooks/useAddToTrip';
import { ROUTES } from '@/lib/constants';
import CardSkeleton from '@/components/ui/CardSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import TripCard from '@/components/trips/TripCard';

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
    return undefined;
  }, [status, onClose]);

  if (!isOpen) return null;

  const handleAdd = async (): Promise<void> => {
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
        className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id="add-to-trip-title" className="text-xl font-bold text-slate-900">
            Them {placeName} vao lich trinh
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Dong"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            x
          </button>
        </div>

        {showSuccess && (
          <div className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700" role="status">
            Da them {placeName} vao chuyen di.
          </div>
        )}

        {status === 'loading-trips' && (
          <div className="mt-6 space-y-3">
            <CardSkeleton variant="horizontal" />
            <CardSkeleton variant="horizontal" />
          </div>
        )}

        {status === 'error' && errorMessage && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
            {errorMessage}
          </div>
        )}

        {status === 'ready' && trips.length === 0 && (
          <div className="mt-6">
            <EmptyState
              title="Ban chua co chuyen di nao."
              description="Tao mot lich trinh truoc khi them dia diem nay."
            />
            <Link
              href={ROUTES.trips}
              className="mt-3 inline-flex w-full justify-center rounded-lg bg-[var(--color-primary-darker)] px-4 py-2 text-sm font-bold text-white"
              onClick={onClose}
            >
              Tao chuyen di moi
            </Link>
          </div>
        )}

        {(status === 'ready' || status === 'error') && trips.length > 0 && !showSuccess && (
          <>
            <div className="mt-4">
              <label className="mb-1 block text-sm font-semibold text-slate-700">Chon chuyen di</label>
              <div className="max-h-80 space-y-2 overflow-auto rounded-lg border border-slate-200 p-2">
                {trips.map((trip) => (
                  <TripCard
                    key={trip._id}
                    trip={trip}
                    variant="horizontal"
                    selected={selectedTripId === trip._id}
                    onClick={() => setSelectedTripId(trip._id)}
                  />
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="day" className="mb-1 block text-sm font-semibold text-slate-700">
                Ngay thu
              </label>
              <input
                id="day"
                type="number"
                min={1}
                max={30}
                value={selectedDay}
                onChange={(event) => setSelectedDay(Math.max(1, Math.min(30, parseInt(event.target.value, 10) || 1)))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                aria-label="Ngay trong lich trinh"
              />
            </div>

            {errorMessage && status === 'error' && (
              <div className="mt-3 text-sm text-red-600" role="alert">{errorMessage}</div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Huy
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={!selectedTripId || isLoading}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--color-primary-darker)] py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Dang them...
                  </>
                ) : 'Them vao lich trinh'}
              </button>
            </div>
          </>
        )}

        {status === 'submitting' && (
          <div className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-slate-600">
            <LoadingSpinner size="sm" />
            Dang them dia diem...
          </div>
        )}
      </div>
    </div>
  );
}
