'use client';

import React, { useEffect, useState } from 'react';
import AppHeader from '@/components/AppHeader';
import ProfileToast from '@/components/profile/ProfileToast';
import CreateTripModal from '@/components/profile/CreateTripModal';
import TripCard from '@/components/trips/TripCard';
import { PlusIcon } from '@/components/icons';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useMyTrips } from '@/hooks/useMyTrips';
import { useToast } from '@/hooks/useToast';
import { getDefaultTripDates } from '@/lib/date';

export default function MyTripsPage(): React.JSX.Element {
  const { user, isLoading: userLoading } = useCurrentUser({ redirectIfNone: true });
  const { trips, loading, createTrip, loadTrips } = useMyTrips({ userId: user?.id ?? null });
  const { message: toastMessage, visible: showToastVisible, showToast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDest, setNewDest] = useState('');
  const [creating, setCreating] = useState(false);
  const { startDate: initialStart, endDate: initialEnd } = getDefaultTripDates(3);
  const [startDate, setStartDate] = useState(initialStart);
  const [endDate, setEndDate] = useState(initialEnd);
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadTrips();
    }
  }, [user?.id, loadTrips]);

  const resetCreateForm = (): void => {
    setNewTitle('');
    setNewDest('');
    setDescription('');
    setIsPublic(false);
  };

  const closeCreateModal = (): void => {
    setShowCreateModal(false);
    resetCreateForm();
  };

  const handleCreate = async (): Promise<void> => {
    if (!newTitle.trim() || !newDest.trim()) {
      showToast('Vui lòng nhập tiêu đề và điểm đến');
      return;
    }

    setCreating(true);
    const result = await createTrip({
      title: newTitle.trim(),
      destination: newDest.trim(),
      startDate,
      endDate,
      description: description.trim(),
      isPublic,
    });
    setCreating(false);

    if (result.success) {
      closeCreateModal();
      showToast('Chuyến đi mới đã được tạo');
      loadTrips();
    } else {
      showToast(result.message || 'Tạo chuyến đi thất bại');
    }
  };

  if (userLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary-dark)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-white font-sans text-slate-800">
      <ProfileToast message={toastMessage} visible={showToastVisible} />
      <AppHeader active="profile" />

      <main className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-slate-950">Danh sách chuyến đi</h1>
            <p className="mt-1 text-sm text-slate-500">Quản lý các lịch trình đã tạo và tiếp tục chỉnh sửa khi cần.</p>
          </div>
          <button
            id="trips-create-schedule-button"
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary-dark)] px-5 py-3 text-sm font-bold text-white transition hover:bg-[var(--color-primary-darker)]"
          >
            <PlusIcon className="h-4 w-4" />
            Tạo lịch trình
          </button>
        </div>

        {loading ? (
          <div className="rounded-lg border border-slate-200 py-12 text-center text-sm font-semibold text-slate-500">Đang tải danh sách chuyến đi...</div>
        ) : trips.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {trips.map((trip) => (
              <TripCard key={trip._id} trip={trip} href={`/schedule-reference/${trip._id}`} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 py-16 text-center">
            <p className="mb-4 text-sm font-semibold text-slate-500">Bạn chưa có chuyến đi nào.</p>
            <button
              id="trips-create-first-schedule-button"
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="rounded-lg bg-[var(--color-primary-dark)] px-6 py-3 text-sm font-bold text-white transition hover:bg-[var(--color-primary-darker)]"
            >
              Tạo lịch trình đầu tiên
            </button>
          </div>
        )}
      </main>

      <CreateTripModal
        open={showCreateModal}
        title={newTitle}
        destination={newDest}
        startDate={startDate}
        endDate={endDate}
        description={description}
        isPublic={isPublic}
        creating={creating}
        onClose={closeCreateModal}
        onTitleChange={setNewTitle}
        onDestChange={setNewDest}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onDescriptionChange={setDescription}
        onIsPublicChange={setIsPublic}
        onCreate={handleCreate}
      />
    </div>
  );
}
