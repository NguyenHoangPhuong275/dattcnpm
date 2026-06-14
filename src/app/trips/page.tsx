'use client';

import React, { useEffect, useState } from 'react';
import AppHeader from '@/components/AppHeader';
import ProfileToast from '@/components/profile/ProfileToast';
import CreateTripModal from '@/components/profile/CreateTripModal';
import TripCard from '@/components/trip/TripCard';
import { PlusIcon } from '@/components/icons';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PageSkeleton from '@/components/ui/PageSkeleton';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useMyTrips } from '@/hooks/useMyTrips';
import { useToast } from '@/hooks/useToast';
import { getDefaultTripDates } from '@/lib/date';
import { ROUTES } from '@/lib/constants';

export default function MyTripsPage(): React.JSX.Element {
  const userHook = useCurrentUser({ redirectIfNone: true });
  const user = userHook.data;
  const userLoading = userHook.status === 'loading';

  const myTripsHook = useMyTrips({ userId: user?.id ?? null });
  const trips = myTripsHook.data;
  const loading = myTripsHook.status === 'loading';
  const { createTrip, loadTrips } = myTripsHook.actions;

  const toast = useToast();
  const toastMessage = toast.data.message;
  const showToastVisible = toast.status === 'visible';
  const { showToast } = toast.actions;

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

    if (endDate < startDate) {
      showToast('Ngày kết thúc phải sau ngày bắt đầu');
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
        <LoadingSpinner size="lg" className="text-[var(--color-primary-dark)]" />
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
          <PageSkeleton count={6} />
        ) : trips.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {trips.map((trip) => (
              <TripCard key={trip._id} trip={trip} href={`${ROUTES.scheduleReference}/${trip._id}`} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Bạn chưa có chuyến đi nào."
            description="Tạo lịch trình đầu tiên để bắt đầu sắp xếp điểm đến."
            actionLabel="Tạo lịch trình đầu tiên"
            onAction={() => setShowCreateModal(true)}
          />
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
