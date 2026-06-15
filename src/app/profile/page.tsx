'use client';

import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import ProfileMenu from '@/components/profile/ProfileMenu';
import PersonalInfoForm from '@/components/profile/PersonalInfoForm';
import TravelPreferencesForm from '@/components/profile/TravelPreferencesForm';
import MyTripsSection from '@/components/profile/MyTripsSection';
import FavoritesSection from '@/components/profile/FavoritesSection';
import ReviewsSection from '@/components/profile/ReviewsSection';
import SearchHistorySection from '@/components/profile/SearchHistorySection';
import SecuritySection from '@/components/profile/SecuritySection';
import CreateTripModal from '@/components/profile/CreateTripModal';
import PasswordChangeModal from '@/components/profile/PasswordChangeModal';
import TripDetailModal from '@/components/profile/TripDetailModal';
import ProfileLoading from '@/components/profile/ProfileLoading';
import AppToast from '@/components/ui/AppToast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import { useProfile } from '@/hooks/useProfile';
import { useMyTrips } from '@/hooks/useMyTrips';
import { useFavorites } from '@/hooks/useFavorites';
import { useMyReviews } from '@/hooks/useMyReviews';
import { TripSummary, ProfileTab } from '@/types/profile';
import { apiRequest, getApiErrorMessage } from '@/lib/api-client';
import { getDefaultTripDates } from '@/lib/date';

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

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userHook = useCurrentUser({ redirectIfNone: true });
  const user = userHook.data;
  const userStatus = userHook.status;
  const userLoading = userStatus === 'loading';
  const toastHook = useToast();
  const toastMessage = toastHook.data.message;
  const toastStatus = toastHook.status;
  const showToastVisible = toastStatus !== 'idle';
  const { showToast } = toastHook.actions;

  const initialTab = (searchParams.get('tab') as ProfileTab) || 'personal';
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);
  const shouldLoadProfile = activeTab === 'personal' || activeTab === 'preferences' || activeTab === 'security';
  const shouldLoadTrips = activeTab === 'trips' || activeTab === 'search-history';
  const shouldLoadFavorites = activeTab === 'favorites';
  const shouldLoadReviews = activeTab === 'reviews';

  const profile = useProfile({ userId: shouldLoadProfile ? user?.id ?? null : null });
  const myTripsHook = useMyTrips({ userId: shouldLoadTrips ? user?.id ?? null : null });
  const favoritesHook = useFavorites({ userId: shouldLoadFavorites ? user?.id ?? null : null });
  const reviewsHook = useMyReviews({ userId: shouldLoadReviews ? user?.id ?? null : null });

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
  const preferences = profileData.preferences;
  const memberSince = profileData.memberSince;
  const is2FAEnabled = profileData.is2FAEnabled;
  const savingPersonal = profileData.savingPersonal;
  const savingPreferences = profileData.savingPreferences;
  const {
    setPersonal,
    setPreferences,
    savePersonal,
    savePreferences,
    toggle2FA,
    updateAvatar,
  } = profile.actions;
  const profileLoading = !!user?.id && shouldLoadProfile && (profileStatus === 'idle' || profileStatus === 'loading');

  const myTrips = myTripsHook.data;
  const tripsStatus = myTripsHook.status;
  const creatingTrip = myTripsHook.creating;
  const { createTrip, deleteTrip, loadTrips } = myTripsHook.actions;
  const loadingTrips = !!user?.id && shouldLoadTrips && (tripsStatus === 'idle' || tripsStatus === 'loading');

  const favorites = favoritesHook.data;
  const favsStatus = favoritesHook.status;
  const { removeFavorite, loadFavorites } = favoritesHook.actions;
  const loadingFavorites = !!user?.id && shouldLoadFavorites && (favsStatus === 'idle' || favsStatus === 'loading');
  const removingIds = favoritesHook.removingIds;

  const myReviews = reviewsHook.data;
  const reviewsStatus = reviewsHook.status;
  const { loadReviews } = reviewsHook.actions;
  const loadingReviews = !!user?.id && shouldLoadReviews && (reviewsStatus === 'idle' || reviewsStatus === 'loading');

  const handleTabChange = useCallback((tab: ProfileTab) => {
    router.push(`/profile?tab=${tab}`);
  }, [router]);

  useEffect(() => {
    const tabParam = (searchParams.get('tab') as ProfileTab | null) || 'personal';
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

  const handlePreferenceChange = useCallback(<K extends keyof typeof preferences,>(field: K, value: (typeof preferences)[K]) => {
    setPreferences((prev) => ({ ...prev, [field]: value }));
  }, [setPreferences]);

  const toggleInterest = useCallback((tag: string) => {
    setPreferences((prev) => {
      const hasTag = prev.interests.includes(tag);
      return {
        ...prev,
        interests: hasTag ? prev.interests.filter((item) => item !== tag) : [...prev.interests, tag],
      };
    });
  }, [setPreferences]);

  const handleDeleteTrip = useCallback(async (id: string) => {
    try {
      await deleteTrip(id);
      showToast('Đã xóa chuyến đi', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể xóa chuyến đi. Vui lòng thử lại sau.';
      showToast(msg, 'error');
    }
  }, [deleteTrip, showToast]);

  const handleViewTrip = useCallback((trip: TripSummary) => {
    setViewingTrip(trip);
  }, []);

  const handleRemoveFavorite = useCallback(async (id: string) => {
    try {
      await removeFavorite(id);
      showToast('Đã xóa khỏi yêu thích', 'success');
    } catch {
      showToast('Xóa thất bại, vui lòng thử lại', 'error');
    }
  }, [removeFavorite, showToast]);

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
    } else {
      showToast(result.message || 'Tạo chuyến đi thất bại', 'error');
    }
  }, [newTripTitle, newTripDest, newTripStartDate, newTripEndDate, newTripDescription, newTripIsPublic, createTrip, showToast, creatingTrip, loadTrips, resetCreateTripForm]);

  const handleChangePassword = useCallback(async () => {
    if (!user?.id) return;

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
  }, [oldPass, newPass, confirmPass, user?.id, showToast]);

  const handleToggle2FA = useCallback(async () => {
    const result = await toggle2FA();
    if (!result.success) {
      showToast(result.error ?? 'Cập nhật bảo mật thất bại', 'error');
    }
  }, [toggle2FA, showToast]);

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

  const handleSavePreferences = useCallback(async (event: React.FormEvent): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await savePreferences(event);
      if (result.success) {
        showToast('Đã cập nhật sở thích du lịch', 'success');
      } else {
        showToast(result.error || 'Lưu sở thích thất bại, vui lòng thử lại', 'error');
      }
      return result;
    } catch (error: unknown) {
      const errorMsg = getApiErrorMessage(error, 'Lưu sở thích thất bại, vui lòng thử lại');
      showToast(errorMsg, 'error');
      return { success: false, error: errorMsg };
    }
  }, [savePreferences, showToast]);

  useEffect(() => {
    if (!user?.id) return;

    if (shouldLoadTrips && tripsStatus === 'idle') {
      loadTrips();
    } else if (shouldLoadFavorites && favsStatus === 'idle') {
      loadFavorites();
    } else if (shouldLoadReviews && reviewsStatus === 'idle') {
      loadReviews();
    }
  }, [
    user?.id,
    shouldLoadTrips,
    shouldLoadFavorites,
    shouldLoadReviews,
    tripsStatus,
    favsStatus,
    reviewsStatus,
    loadTrips,
    loadFavorites,
    loadReviews,
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
        <AppToast
          message={toastMessage}
          type={toastHook.data.type}
          visible={showToastVisible}
          leaving={toastStatus === 'hiding'}
          onClose={toastHook.actions.hideToast}
        />
        <AppHeader active="profile" />

        <main className="w-full flex-1 py-8">
          <div className="flex w-full flex-col gap-6 px-4 lg:flex-row lg:gap-8 lg:px-8">
            <ProfileMenu activeTab={activeTab} onTabChange={handleTabChange} />

            <div className="min-w-0 flex-1">
              <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="font-display text-2xl font-extrabold text-slate-800">
                  {activeTab === 'personal' && 'Thông tin của bạn'}
                  {activeTab === 'preferences' && 'Sở thích du lịch'}
                  {activeTab === 'trips' && 'Danh sách chuyến đi'}
                  {activeTab === 'favorites' && 'Địa điểm yêu thích'}
                  {activeTab === 'search-history' && 'Lịch sử tìm kiếm'}
                  {activeTab === 'reviews' && 'Đánh giá của tôi'}
                  {activeTab === 'security' && 'Bảo mật tài khoản'}
                </h2>
                {activeTab === 'personal' && memberSince && (
                  <div className="text-xs text-slate-500">Thành viên từ {memberSince}</div>
                )}
              </div>

              {activeTab === 'personal' && (
                profileLoading ? (
                  <ProfileSectionSkeleton />
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

              {activeTab === 'preferences' && (
                profileLoading ? (
                  <ProfileSectionSkeleton />
                ) : (
                  <TravelPreferencesForm
                    preferences={preferences}
                    onPreferenceChange={handlePreferenceChange}
                    onToggleInterest={toggleInterest}
                    onSave={handleSavePreferences}
                    saving={savingPreferences}
                  />
                )
              )}

              {activeTab === 'trips' && (
                <MyTripsSection
                  trips={myTrips}
                  onCreateNew={() => setShowCreateTripModal(true)}
                  onViewDetail={handleViewTrip}
                  onDelete={handleDeleteTrip}
                  loading={loadingTrips}
                />
              )}

              {activeTab === 'favorites' && (
                <FavoritesSection places={favorites} onRemove={handleRemoveFavorite} loading={loadingFavorites} removingIds={removingIds} />
              )}

              {activeTab === 'reviews' && (
                <ReviewsSection reviews={myReviews} loading={loadingReviews} />
              )}

              {activeTab === 'search-history' && (
                <SearchHistorySection userId={user.id} trips={myTrips} />
              )}

              {activeTab === 'security' && (
                profileLoading ? (
                  <ProfileSectionSkeleton />
                ) : (
                  <SecuritySection
                    is2FAEnabled={is2FAEnabled}
                    onToggle2FA={handleToggle2FA}
                    onChangePassword={() => setShowPasswordModal(true)}
                    saving={savingPersonal || savingPreferences}
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
