'use client';

import React, { useState, useEffect, useCallback } from 'react';

import AppHeader from '@/components/AppHeader';

import ProfileMenu, { ProfileTab } from '@/components/profile/ProfileMenu';
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
import ProfileToast from '@/components/profile/ProfileToast';

import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import { useProfile } from '@/hooks/useProfile';
import { useMyTrips } from '@/hooks/useMyTrips';
import { useFavorites } from '@/hooks/useFavorites';
import { useMyReviews } from '@/hooks/useMyReviews';

import { TripSummary } from '@/types/profile';

import { apiRequest, getApiErrorMessage } from '@/lib/api-client';

export default function ProfilePage() {
  
  const { user, isLoading: userLoading } = useCurrentUser({ redirectIfNone: true });
  const { message: toastMessage, visible: showToastVisible, showToast } = useToast();

  const profile = useProfile({ userId: user?.id ?? null });
  const myTripsHook = useMyTrips({ userId: user?.id ?? null });
  const favoritesHook = useFavorites({ userId: user?.id ?? null });
  const reviewsHook = useMyReviews({ userId: user?.id ?? null });

  const [activeTab, setActiveTab] = useState<ProfileTab>('personal');

  
  const [showCreateTripModal, setShowCreateTripModal] = useState(false);
  const [newTripTitle, setNewTripTitle] = useState('');
  const [newTripDest, setNewTripDest] = useState('');
  const [selectedTripForDetail, setSelectedTripForDetail] = useState<TripSummary | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  
  const { personal, preferences, memberSince, is2FAEnabled, loading: profileLoading, savingPersonal, savingPreferences, setPersonal, setPreferences, savePersonal, savePreferences, toggle2FA, updateAvatar } = profile;
  const { trips: myTrips, loading: loadingTrips, creating: creatingTrip, createTrip, deleteTrip, loadTrips } = myTripsHook;
  const { favorites, loading: loadingFavorites, removeFavorite, loadFavorites } = favoritesHook;
  const { reviews: myReviews, loading: loadingReviews, loadReviews } = reviewsHook;

  
  const handlePersonalChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPersonal(prev => ({ ...prev, [name]: value }));
  }, [setPersonal]);

  const handlePreferenceChange = useCallback(<K extends keyof typeof preferences,>(field: K, value: (typeof preferences)[K]) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
  }, [setPreferences]);

  const toggleInterest = useCallback((tag: string) => {
    setPreferences(prev => {
      const has = prev.interests.includes(tag);
      return {
        ...prev,
        interests: has ? prev.interests.filter(t => t !== tag) : [...prev.interests, tag],
      };
    });
  }, [setPreferences]);

  const handleTabChange = useCallback((tab: ProfileTab) => {
    
    setActiveTab(tab);
  }, []);

  
  const handleDeleteTrip = useCallback(async (id: string) => {
    try {
      await deleteTrip(id);
      showToast('Đã xóa chuyến đi');
    } catch {
      showToast('Xóa thất bại, vui lòng thử lại');
    }
  }, [deleteTrip, showToast]);

  const handleRemoveFavorite = useCallback(async (id: string) => {
    try {
      await removeFavorite(id);
      showToast('Đã xóa khỏi yêu thích');
    } catch {
      showToast('Xóa thất bại, vui lòng thử lại');
    }
  }, [removeFavorite, showToast]);

  
  const handleCreateNewTrip = useCallback(async () => {
    if (creatingTrip) return; 
    if (!newTripTitle.trim() || !newTripDest.trim()) {
      showToast('Vui lòng nhập tiêu đề và điểm đến');
      return;
    }

    const result = await createTrip(newTripTitle.trim(), newTripDest.trim());
    if (result.success) {
      setShowCreateTripModal(false);
      setNewTripTitle('');
      setNewTripDest('');
      showToast('Chuyến đi mới đã được tạo!');
      
      loadTrips();
    } else {
      showToast(result.message || 'Tạo chuyến đi thất bại');
    }
  }, [newTripTitle, newTripDest, createTrip, showToast, creatingTrip, loadTrips]);

  
  const handleChangePassword = useCallback(async () => {
    if (!oldPass || !newPass || newPass !== confirmPass) {
      showToast('Vui lòng nhập đúng thông tin (mật khẩu mới phải khớp)');
      return;
    }
    if (!user?.id) return;

    try {
      const { data } = await apiRequest<{ success?: boolean; message?: string }>('/api/profile/password', {
        method: 'POST',
        userId: user.id,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: oldPass, newPassword: newPass }),
      });
      setShowPasswordModal(false);
      setOldPass('');
      setNewPass('');
      setConfirmPass('');
      showToast(data.success ? 'Đổi mật khẩu thành công!' : (data.message || 'Đổi mật khẩu thất bại'));
    } catch {
      setShowPasswordModal(false);
      setOldPass('');
      setNewPass('');
      setConfirmPass('');
      showToast('Không thể đổi mật khẩu lúc này');
    }
  }, [oldPass, newPass, confirmPass, user?.id, showToast]);

  const handleToggle2FA = useCallback(async () => {
    toggle2FA();
  }, [toggle2FA]);

  
  const handleAvatarChange = useCallback((url: string) => {
    updateAvatar(url);
  }, [updateAvatar]);

  
  const handleSavePersonal = useCallback(async (e: React.FormEvent) => {
    try {
      await savePersonal(e);
      showToast('Đã lưu thông tin cá nhân!');
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, 'Lưu thông tin cá nhân thất bại, vui lòng thử lại'));
    }
  }, [savePersonal, showToast]);

  const handleSavePreferences = useCallback(async (e: React.FormEvent) => {
    try {
      await savePreferences(e);
      showToast('Đã cập nhật sở thích du lịch!');
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, 'Lưu sở thích thất bại, vui lòng thử lại'));
    }
  }, [savePreferences, showToast]);

  
  useEffect(() => {
    if (user?.id) {
      loadTrips();
      loadFavorites();
      loadReviews();
    }
  }, [user?.id, loadTrips, loadFavorites, loadReviews]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showCreateTripModal) {
          setShowCreateTripModal(false);
          setNewTripTitle('');
          setNewTripDest('');
        }
        if (showPasswordModal) {
          setShowPasswordModal(false);
          setOldPass(''); setNewPass(''); setConfirmPass('');
        }
        if (selectedTripForDetail) {
          setSelectedTripForDetail(null);
        }
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showCreateTripModal, showPasswordModal, selectedTripForDetail]);

  const isLoading = userLoading || profileLoading;

  if (isLoading || !user) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-cover bg-center bg-no-repeat bg-fixed relative" style={{ backgroundImage: "url('/images/profile_hero.png')" }}>
        <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] pointer-events-none z-0" />
        <div className="relative z-10 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary-dark)] border-t-transparent" />
          <p className="mt-4 text-sm font-semibold text-slate-500">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-white text-slate-800 font-sans antialiased">
      <div className="min-h-dvh flex flex-col">
        <ProfileToast message={toastMessage} visible={showToastVisible} />
        <AppHeader active="profile" />

        <main className="w-full py-8 flex-1">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 px-4 lg:px-8 w-full">
            <ProfileMenu activeTab={activeTab} onTabChange={handleTabChange} />

            <div className="flex-1 min-w-0">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-display text-2xl font-extrabold text-slate-800">
                  {activeTab === 'personal' && 'Thông tin cá nhân'}
                  {activeTab === 'preferences' && 'Sở thích du lịch'}
                  {activeTab === 'trips' && 'Hành trình của tôi'}
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
                <PersonalInfoForm
                  personal={personal}
                  onChange={handlePersonalChange}
                  onSave={handleSavePersonal}
                  onAvatarChange={handleAvatarChange}
                  saving={savingPersonal}
                  onToast={showToast}
                />
              )}

              {activeTab === 'preferences' && (
                <TravelPreferencesForm
                  preferences={preferences}
                  onPreferenceChange={handlePreferenceChange}
                  onToggleInterest={toggleInterest}
                  onSave={handleSavePreferences}
                  saving={savingPreferences}
                />
              )}

              {activeTab === 'trips' && (
                <MyTripsSection
                  trips={myTrips}
                  onCreateNew={() => setShowCreateTripModal(true)}
                  onViewDetail={setSelectedTripForDetail}
                  onDelete={handleDeleteTrip}
                  loading={loadingTrips}
                />
              )}

              {activeTab === 'favorites' && (
                <FavoritesSection places={favorites} onRemove={handleRemoveFavorite} loading={loadingFavorites} />
              )}

              {activeTab === 'reviews' && (
                <ReviewsSection reviews={myReviews} loading={loadingReviews} />
              )}

              {activeTab === 'search-history' && (
                <SearchHistorySection />
              )}

              {activeTab === 'security' && (
                <SecuritySection
                  is2FAEnabled={is2FAEnabled}
                  onToggle2FA={handleToggle2FA}
                  onChangePassword={() => setShowPasswordModal(true)}
                  saving={savingPersonal || savingPreferences}
                />
              )}
            </div>
          </div>
        </main>

        
        <CreateTripModal
          open={showCreateTripModal}
          title={newTripTitle}
          destination={newTripDest}
          creating={creatingTrip}
          onClose={() => { setShowCreateTripModal(false); setNewTripTitle(''); setNewTripDest(''); }}
          onTitleChange={setNewTripTitle}
          onDestChange={setNewTripDest}
          onCreate={handleCreateNewTrip}
        />

        <PasswordChangeModal
          open={showPasswordModal}
          oldPass={oldPass}
          newPass={newPass}
          confirmPass={confirmPass}
          onClose={() => { setShowPasswordModal(false); setOldPass(''); setNewPass(''); setConfirmPass(''); }}
          onOldChange={setOldPass}
          onNewChange={setNewPass}
          onConfirmChange={setConfirmPass}
          onSubmit={handleChangePassword}
        />

        <TripDetailModal
          trip={selectedTripForDetail}
          onClose={() => setSelectedTripForDetail(null)}
          userId={user?.id ?? null}
        />
      </div>
    </div>
  );
}

