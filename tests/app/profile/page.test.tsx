// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ProfilePage from '@/app/profile/page';

const mocks = vi.hoisted(() => ({
  state: {
    tab: 'personal',
    profileStatus: 'success',
    profileError: null as string | null,
    tripsStatus: 'success',
    tripsError: null as string | null,
    favoritesStatus: 'success',
    favoritesError: null as string | null,
  },
  push: vi.fn(),
  reloadProfile: vi.fn(),
  loadTrips: vi.fn(() => Promise.resolve()),
  loadFavorites: vi.fn(() => Promise.resolve()),
  setPersonal: vi.fn(),
  savePersonal: vi.fn(() => Promise.resolve({ success: true })),
  updateAvatar: vi.fn(),
  confirmAction: vi.fn(),
  runAction: vi.fn(),
  showToast: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams({ tab: mocks.state.tab }),
}));

vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    data: { id: 'profile-page-user', email: 'user@example.com', fullName: 'Nguyễn Văn An' },
    status: 'success',
    error: null,
    actions: { setUser: vi.fn() },
  }),
}));

vi.mock('@/hooks/useFeedback', () => ({
  useFeedback: () => ({ actions: { confirmAction: mocks.confirmAction, runAction: mocks.runAction } }),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ actions: { showToast: mocks.showToast } }),
}));

vi.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({
    data: {
      personal: { firstName: 'Nguyễn', lastName: 'Văn An', email: 'user@example.com', phone: '' },
      memberSince: '2024-01-03',
      savingPersonal: false,
    },
    status: mocks.state.profileStatus,
    error: mocks.state.profileError,
    actions: {
      setPersonal: mocks.setPersonal,
      savePersonal: mocks.savePersonal,
      updateAvatar: mocks.updateAvatar,
      reloadProfile: mocks.reloadProfile,
    },
  }),
}));

vi.mock('@/hooks/useMyTrips', () => ({
  useMyTrips: () => ({
    data: [],
    status: mocks.state.tripsStatus,
    error: mocks.state.tripsError,
    creating: false,
    actions: {
      createTrip: vi.fn(),
      deleteTrip: vi.fn(),
      loadTrips: mocks.loadTrips,
    },
  }),
}));

vi.mock('@/hooks/useFavorites', () => ({
  useFavorites: () => ({
    data: [],
    status: mocks.state.favoritesStatus,
    error: mocks.state.favoritesError,
    removingIds: new Set<string>(),
    actions: { removeFavorite: vi.fn(), loadFavorites: mocks.loadFavorites },
  }),
}));

vi.mock('@/components/AppHeader', () => ({ default: () => <div data-testid="app-header" /> }));
vi.mock('@/components/profile/ProfileMenu', () => ({ default: () => <nav data-testid="profile-menu" /> }));
vi.mock('@/components/profile/PersonalInfoForm', () => ({ default: () => <div data-testid="personal-form" /> }));
vi.mock('@/components/profile/MyTripsSection', () => ({ default: () => <div data-testid="trips-section" /> }));
vi.mock('@/components/profile/FavoritesSection', () => ({ default: () => <div data-testid="favorites-section" /> }));
vi.mock('@/components/profile/SecuritySection', () => ({ default: () => <div data-testid="security-section" /> }));
vi.mock('@/components/profile/MyBookingsSection', () => ({ default: () => <div data-testid="hotel-bookings" /> }));
vi.mock('@/components/profile/MyFlightBookingsSection', () => ({ default: () => <div data-testid="flight-bookings" /> }));
vi.mock('@/components/profile/CreateTripModal', () => ({ default: () => null }));
vi.mock('@/components/profile/PasswordChangeModal', () => ({ default: () => null }));
vi.mock('@/components/profile/TripDetailModal', () => ({ default: () => null }));
vi.mock('@/components/profile/ProfileLoading', () => ({ default: () => <div data-testid="profile-loading" /> }));

beforeEach(() => {
  mocks.state.tab = 'personal';
  mocks.state.profileStatus = 'success';
  mocks.state.profileError = null;
  mocks.state.tripsStatus = 'success';
  mocks.state.tripsError = null;
  mocks.state.favoritesStatus = 'success';
  mocks.state.favoritesError = null;
  mocks.push.mockClear();
  mocks.reloadProfile.mockClear();
  mocks.loadTrips.mockClear();
  mocks.loadFavorites.mockClear();
});

afterEach(cleanup);

describe('ProfilePage', () => {
  it('đưa tab không hợp lệ về nội dung thông tin cá nhân', () => {
    mocks.state.tab = 'unknown';
    render(<ProfilePage />);

    expect(screen.getByTestId('personal-form')).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Thông tin của bạn' })).not.toBeNull();
  });

  it('hiển thị đồng thời đặt phòng khách sạn và vé máy bay', () => {
    mocks.state.tab = 'bookings';
    render(<ProfilePage />);

    expect(screen.getByTestId('hotel-bookings')).not.toBeNull();
    expect(screen.getByTestId('flight-bookings')).not.toBeNull();
  });

  it('không hiển thị form rỗng khi hồ sơ lỗi và cho phép tải lại', () => {
    mocks.state.profileStatus = 'error';
    mocks.state.profileError = 'Không thể đọc hồ sơ';
    render(<ProfilePage />);

    expect(screen.queryByTestId('personal-form')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(mocks.reloadProfile).toHaveBeenCalledOnce();
  });

  it('phân biệt lỗi chuyến đi và yêu thích, gọi đúng action tải lại', () => {
    mocks.state.tab = 'trips';
    mocks.state.tripsStatus = 'error';
    mocks.state.tripsError = 'Lỗi chuyến đi';
    const view = render(<ProfilePage />);

    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(mocks.loadTrips).toHaveBeenCalledOnce();

    view.unmount();
    mocks.state.tab = 'favorites';
    mocks.state.favoritesStatus = 'error';
    mocks.state.favoritesError = 'Lỗi yêu thích';
    render(<ProfilePage />);
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(mocks.loadFavorites).toHaveBeenCalledOnce();
  });
});
