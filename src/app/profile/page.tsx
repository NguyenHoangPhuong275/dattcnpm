'use client';

import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import ProfileMenu from '@/components/profile/ProfileMenu';
import PersonalInfoForm from '@/components/profile/PersonalInfoForm';
import MyTripsSection from '@/components/profile/MyTripsSection';
import FavoritesSection from '@/components/profile/FavoritesSection';
import SecuritySection from '@/components/profile/SecuritySection';
import CreateTripModal from '@/components/profile/CreateTripModal';
import PasswordChangeModal from '@/components/profile/PasswordChangeModal';
import TripDetailModal from '@/components/profile/TripDetailModal';
import ProfileLoading from '@/components/profile/ProfileLoading';
import MyBookingsSection from '@/components/profile/MyBookingsSection';
import MyFlightBookingsSection from '@/components/profile/MyFlightBookingsSection';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useFeedback } from '@/hooks/useFeedback';
import { useToast } from '@/hooks/useToast';
import { useProfile } from '@/hooks/useProfile';
import { useMyTrips } from '@/hooks/useMyTrips';
import { useFavorites } from '@/hooks/useFavorites';
import { TripSummary, ProfileTab } from '@/types/profile';
import { apiRequest, getApiErrorMessage } from '@/lib/api-client';
import { formatDate, getDefaultTripDates } from '@/lib/date';
import { normalizeProfileTab } from '@/lib/profile-tabs';

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfilePageContent />
    </Suspense>
  );
}

function ProfileSectionSkeleton() {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-white p-6" role="status" aria-label="Đang tải nội dung">
      <div className="mb-6 h-5 w-44 animate-pulse rounded bg-slate-200" />
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="space-y-2">
            <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
            <div className="h-11 animate-pulse rounded-lg bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

interface ProfileLoadErrorProps {
  id: string;
  message: string | null;
  fallback: string;
  onRetry: () => void;
}

function ProfileLoadError({ id, message, fallback, onRetry }: ProfileLoadErrorProps) {
  return (
    <div role="alert" className="flex flex-col items-start justify-between gap-3 rounded-xl border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-4 text-sm sm:flex-row sm:items-center">
      <span className="text-[var(--color-danger)]">{message || fallback}</span>
      <button
        id={id}
        type="button"
        onClick={onRetry}
        className="shrink-0 font-bold text-[var(--color-primary-darker)] hover:underline"
      >
        Thử lại
      </button>
    </div>
  );
}

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userHook = useCurrentUser({ redirectIfNone: true });
  const user = userHook.data;
  const userStatus = userHook.status;
  const userLoading = userStatus === 'loading';
  const toastHook = useToast();
  const { showToast } = toastHook.actions;
  const { actions: feedback } = useFeedback();

  const initialTab = normalizeProfileTab(searchParams.get('tab'));
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);
  const shouldLoadProfile = activeTab === 'personal' || activeTab === 'security';
  const shouldLoadTrips = activeTab === 'trips';
  const shouldLoadFavorites = activeTab === 'favorites';

  const profile = useProfile({ userId: shouldLoadProfile ? user?.id ?? null : null });
  const myTripsHook = useMyTrips({ userId: shouldLoadTrips ? user?.id ?? null : null });
  const favoritesHook = useFavorites({ userId: shouldLoadFavorites ? user?.id ?? null : null });

  const [showCreateTripModal, setShowCreateTripModal] = useState(false);
  const [newTripTitle, setNewTripTitle] = useState('');
  const [newTripDest, setNewTripDest] = useState('');
  const { startDate: defaultStart, endDate: defaultEnd } = getDefaultTripDates(3);
  const [newTripStartDate, setNewTripStartDate] = useState(defaultStart);
  const [newTripEndDate, setNewTripEndDate] = useState(defaultEnd);
  const [newTripDescription, setNewTripDescription] = useState('');
  const [newTripIsPublic, setNewTripIsPublic] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [viewingTrip, setViewingTrip] = useState<TripSummary | null>(null);

  const profileData = profile.data;
  const profileStatus = profile.status;
  const personal = profileData.personal;
  const memberSince = profileData.memberSince;
  const savingPersonal = profileData.savingPersonal;
  const {
    setPersonal,
    savePersonal,
    updateAvatar,
    reloadProfile,
  } = profile.actions;
  const profileError = profile.error;
  const profileLoading = !!user?.id && shouldLoadProfile && (profileStatus === 'idle' || profileStatus === 'loading');

  const myTrips = myTripsHook.data;
  const tripsStatus = myTripsHook.status;
  const creatingTrip = myTripsHook.creating;
  const tripsError = myTripsHook.error;
  const { createTrip, deleteTrip, loadTrips } = myTripsHook.actions;
  const loadingTrips = !!user?.id && shouldLoadTrips && (tripsStatus === 'idle' || tripsStatus === 'loading');

  const favorites = favoritesHook.data;
  const favsStatus = favoritesHook.status;
  const favoritesError = favoritesHook.error;
  const { removeFavorite, loadFavorites } = favoritesHook.actions;
  const loadingFavorites = !!user?.id && shouldLoadFavorites && (favsStatus === 'idle' || favsStatus === 'loading');
  const removingIds = favoritesHook.removingIds;



  const handleTabChange = useCallback((tab: ProfileTab) => {
    router.push(`/profile?tab=${tab}`);
  }, [router]);

  useEffect(() => {
    const tabParam = normalizeProfileTab(searchParams.get('tab'));
    if (tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams, activeTab]);

  const handlePersonalChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setPersonal((prev) => ({ ...prev, [name]: value }));
  }, [setPersonal]);

  const handleFullNameChange = useCallback((value: string) => {
    const parts = value.trimStart().split(/\s+/).filter(Boolean);
    setPersonal((prev) => ({
      ...prev,
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' '),
    }));
  }, [setPersonal]);



  const handleDeleteTrip = useCallback(async (id: string) => {
    await feedback.confirmAction({
      confirm: {
        title: 'Xóa chuyến đi?',
        description: 'Chuyến đi và lịch trình liên quan sẽ bị xóa khỏi tài khoản của bạn.',
        confirmLabel: 'Xóa',
        tone: 'danger',
      },
      action: () => deleteTrip(id),
      success: 'Đã xóa chuyến đi',
      error: 'Không thể xóa chuyến đi. Vui lòng thử lại sau.',
    });
  }, [deleteTrip, feedback]);

  const handleViewTrip = useCallback((trip: TripSummary) => {
    setViewingTrip(trip);
  }, []);

  const handleRemoveFavorite = useCallback(async (id: string) => {
    await feedback.confirmAction({
      confirm: {
        title: 'Xóa địa điểm yêu thích?',
        description: 'Địa điểm này sẽ bị xóa khỏi danh sách yêu thích của bạn.',
        confirmLabel: 'Xóa',
        tone: 'danger',
      },
      action: () => removeFavorite(id),
      success: 'Đã xóa khỏi yêu thích',
      error: 'Xóa thất bại, vui lòng thử lại',
    });
  }, [feedback, removeFavorite]);



  const resetCreateTripForm = useCallback(() => {
    setShowCreateTripModal(false);
    setNewTripTitle('');
    setNewTripDest('');
    const { startDate: dStart, endDate: dEnd } = getDefaultTripDates(3);
    setNewTripStartDate(dStart);
    setNewTripEndDate(dEnd);
    setNewTripDescription('');
    setNewTripIsPublic(false);
  }, []);

  const handleCreateNewTrip = useCallback(async () => {
    if (creatingTrip) return;
    if (!newTripTitle.trim() || !newTripDest.trim()) {
      showToast('Vui lòng nhập tiêu đề và điểm đến', 'warning');
      return;
    }

    const result = await createTrip({
      title: newTripTitle.trim(),
      destination: newTripDest.trim(),
      startDate: newTripStartDate,
      endDate: newTripEndDate,
      description: newTripDescription.trim(),
      isPublic: newTripIsPublic,
    });
    if (result.success) {
      resetCreateTripForm();
      showToast('Chuyến đi mới đã được tạo', 'success');
      loadTrips();
      if (result.trip) router.push(`/trips/${result.trip._id}/book-wizard`);
    } else {
      showToast(result.message || 'Tạo chuyến đi thất bại', 'error');
    }
  }, [newTripTitle, newTripDest, newTripStartDate, newTripEndDate, newTripDescription, newTripIsPublic, createTrip, showToast, creatingTrip, loadTrips, resetCreateTripForm, router]);

  const handleChangePassword = useCallback(async () => {
    if (!user?.id) return;
    if (passwordSaving) return;

    setPasswordSaving(true);
    setPasswordError(null);

    try {
      const { data } = await apiRequest<{ success?: boolean; message?: string }>('/api/profile/password', {
        method: 'POST',
        userId: user.id,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: oldPass, newPassword: newPass, confirmPassword: confirmPass }),
      });

      if (data.success) {
        setShowPasswordModal(false);
        setOldPass('');
        setNewPass('');
        setConfirmPass('');
        showToast('Đổi mật khẩu thành công', 'success');
      } else {
        setPasswordError(data.message || 'Đổi mật khẩu thất bại');
      }
    } catch {
      setPasswordError('Không thể đổi mật khẩu lúc này');
    } finally {
      setPasswordSaving(false);
    }
  }, [oldPass, newPass, confirmPass, user?.id, showToast, passwordSaving]);

  const handleAvatarChange = useCallback((url: string) => {
    updateAvatar(url);
  }, [updateAvatar]);

  const handleSavePersonal = useCallback(async (event: React.FormEvent): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await savePersonal(event);
      if (result.success) {
        showToast('Đã lưu thông tin cá nhân', 'success');
      } else {
        showToast(result.error || 'Lưu thông tin cá nhân thất bại, vui lòng thử lại', 'error');
      }
      return result;
    } catch (error: unknown) {
      const errorMsg = getApiErrorMessage(error, 'Lưu thông tin cá nhân thất bại, vui lòng thử lại');
      showToast(errorMsg, 'error');
      return { success: false, error: errorMsg };
    }
  }, [savePersonal, showToast]);



  useEffect(() => {
    if (!user?.id) return;

    if (shouldLoadTrips && tripsStatus === 'idle') {
      loadTrips();
    } else if (shouldLoadFavorites && favsStatus === 'idle') {
      loadFavorites();
    }
  }, [
    user?.id,
    shouldLoadTrips,
    shouldLoadFavorites,
    tripsStatus,
    favsStatus,
    loadTrips,
    loadFavorites,
  ]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (viewingTrip) {
        setViewingTrip(null);
        return;
      }
      if (showCreateTripModal) {
        resetCreateTripForm();
        return;
      }
      if (showPasswordModal) {
        setShowPasswordModal(false);
        setOldPass('');
        setNewPass('');
        setConfirmPass('');
        setPasswordError(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showCreateTripModal, showPasswordModal, viewingTrip, resetCreateTripForm]);

  const isLoading = userLoading;

  if (isLoading || !user) {
    return <ProfileLoading />;
  }

  return (
    <div className="min-h-dvh bg-white font-sans text-slate-800 antialiased">
      <div className="flex min-h-dvh flex-col">
        <AppHeader active="profile" />

        <main className="w-full flex-1 py-8">
          <div className="flex w-full flex-col gap-6 px-4 lg:flex-row lg:gap-8 lg:px-8">
            <ProfileMenu activeTab={activeTab} onTabChange={handleTabChange} />

            <div className="min-w-0 flex-1">
              <div className="mb-6 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
                <h2 className="font-display text-2xl font-extrabold text-slate-800">
                  {activeTab === 'personal' && 'Thông tin của bạn'}
                  {activeTab === 'trips' && 'Danh sách chuyến đi'}
                  {activeTab === 'bookings' && 'Đặt chỗ của tôi'}
                  {activeTab === 'favorites' && 'Địa điểm yêu thích'}
                  {activeTab === 'security' && 'Bảo mật tài khoản'}
                </h2>
                {activeTab === 'personal' && memberSince && (
                  <div className="text-xs text-slate-500">Thành viên từ {formatDate(memberSince)}</div>
                )}
              </div>

              {activeTab === 'personal' && (
                profileLoading ? (
                  <ProfileSectionSkeleton />
                ) : profileStatus === 'error' ? (
                  <ProfileLoadError
                    id="profile-retry-personal"
                    message={profileError}
                    fallback="Không thể tải thông tin hồ sơ"
                    onRetry={reloadProfile}
                  />
                ) : (
                  <PersonalInfoForm
                    personal={personal}
                    onChange={handlePersonalChange}
                    onFullNameChange={handleFullNameChange}
                    onSave={handleSavePersonal}
                    onAvatarChange={handleAvatarChange}
                    saving={savingPersonal}
                    onToast={showToast}
                  />
                )
              )}

              {activeTab === 'trips' && (
                tripsStatus === 'error' ? (
                  <ProfileLoadError
                    id="profile-retry-trips"
                    message={tripsError}
                    fallback="Không thể tải danh sách chuyến đi"
                    onRetry={() => { void loadTrips(); }}
                  />
                ) : (
                  <MyTripsSection
                    trips={myTrips}
                    onCreateNew={() => setShowCreateTripModal(true)}
                    onViewDetail={handleViewTrip}
                    onDelete={handleDeleteTrip}
                    loading={loadingTrips}
                  />
                )
              )}

              {activeTab === 'favorites' && (
                favsStatus === 'error' ? (
                  <ProfileLoadError
                    id="profile-retry-favorites"
                    message={favoritesError}
                    fallback="Không thể tải danh sách địa điểm yêu thích"
                    onRetry={() => { void loadFavorites(); }}
                  />
                ) : (
                  <FavoritesSection places={favorites} onRemove={handleRemoveFavorite} loading={loadingFavorites} removingIds={removingIds} />
                )
              )}

              {activeTab === 'bookings' && (
                <div className="space-y-10">
                  <section aria-labelledby="my-hotel-bookings-title">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-primary-dark)]">Khách sạn</p>
                        <h3 id="my-hotel-bookings-title" className="mt-1 text-lg font-extrabold">Phòng đã đặt</h3>
                      </div>
                      <a id="profile-find-hotels" href="/hotels" className="text-sm font-bold text-[var(--color-primary-darker)] hover:underline">Tìm khách sạn</a>
                    </div>
                    <MyBookingsSection userId={user.id} />
                  </section>
                  <div className="border-t border-slate-100 my-8 pt-8">
                    <MyFlightBookingsSection userId={user.id} />
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                profileLoading ? (
                  <ProfileSectionSkeleton />
                ) : profileStatus === 'error' ? (
                  <ProfileLoadError
                    id="profile-retry-security"
                    message={profileError}
                    fallback="Không thể tải thông tin bảo mật"
                    onRetry={reloadProfile}
                  />
                ) : (
                  <SecuritySection
                    onChangePassword={() => setShowPasswordModal(true)}
                    saving={savingPersonal}
                  />
                )
              )}
            </div>
          </div>
        </main>

        <CreateTripModal
          open={showCreateTripModal}
          title={newTripTitle}
          destination={newTripDest}
          startDate={newTripStartDate}
          endDate={newTripEndDate}
          description={newTripDescription}
          isPublic={newTripIsPublic}
          creating={creatingTrip}
          onClose={resetCreateTripForm}
          onTitleChange={setNewTripTitle}
          onDestChange={setNewTripDest}
          onStartDateChange={setNewTripStartDate}
          onEndDateChange={setNewTripEndDate}
          onDescriptionChange={setNewTripDescription}
          onIsPublicChange={setNewTripIsPublic}
          onCreate={handleCreateNewTrip}
        />



        <PasswordChangeModal
          open={showPasswordModal}
          oldPass={oldPass}
          newPass={newPass}
          confirmPass={confirmPass}
          saving={passwordSaving}
          serverError={passwordError}
          onClose={() => {
            setShowPasswordModal(false);
            setOldPass('');
            setNewPass('');
            setConfirmPass('');
            setPasswordError(null);
          }}
          onOldChange={setOldPass}
          onNewChange={setNewPass}
          onConfirmChange={setConfirmPass}
          onSubmit={handleChangePassword}
        />

        <TripDetailModal
          trip={viewingTrip}
          onClose={() => setViewingTrip(null)}
          onTripUpdated={() => loadTrips()}
          userId={user.id}
        />
      </div>
    </div>
  );
}
