import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import TripDetailModal from '@/components/profile/TripDetailModal';
import type { TripSummary } from '@/types/profile';
import type { TripAccess } from '@/types/trip';

vi.mock('@/hooks/useFeedback', () => ({
  useFeedback: () => ({ actions: { confirmAction: vi.fn() } }),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ actions: { showToast: vi.fn() } }),
}));

vi.mock('@/hooks/usePlaceSearch', () => ({
  usePlaceSearch: () => ({
    searchQuery: '',
    setSearchQuery: vi.fn(),
    searchResults: [],
    isSearching: false,
    isDropdownOpen: false,
    searchContainerRef: { current: null },
    handleSelectPlace: vi.fn(),
    clearSelectedPlace: vi.fn(),
  }),
}));

vi.mock('@/components/trips/TripBudgetSummary', () => ({
  default: ({ canEdit }: { canEdit?: boolean }) => (
    <div data-section="budget" data-can-edit={String(canEdit)} />
  ),
}));

vi.mock('@/components/trips/TripChecklistSection', () => ({
  default: ({ canEdit }: { canEdit?: boolean }) => (
    <div data-section="checklist" data-can-edit={String(canEdit)} />
  ),
}));

vi.mock('@/components/trips/TripAccommodationSection', () => ({
  default: ({ canEdit }: { canEdit?: boolean }) => (
    <div data-section="accommodation" data-can-edit={String(canEdit)} />
  ),
}));

vi.mock('@/components/trips/TripCollaboratorsSection', () => ({
  default: () => <div data-section="collaborators" />,
}));

function makeTrip(access: TripAccess): TripSummary {
  return {
    _id: 'trip-1',
    title: 'Chuyến đi phân quyền',
    destination: 'Đà Nẵng',
    startDate: '2026-08-01',
    endDate: '2026-08-03',
    isPublic: access === 'PUBLIC',
    access,
  };
}

function renderAccess(access: TripAccess): string {
  return renderToStaticMarkup(
    <TripDetailModal
      trip={makeTrip(access)}
      userId="user-1"
      onClose={vi.fn()}
    />,
  );
}

describe('TripDetailModal permissions', () => {
  it('PUBLIC chỉ hiển thị thông tin và lịch trình', () => {
    const markup = renderAccess('PUBLIC');

    expect(markup).toContain('Xem lịch trình');
    expect(markup).not.toContain('Sửa thông tin');
    expect(markup).not.toContain('Thêm điểm dừng');
    expect(markup).not.toContain('data-section="budget"');
    expect(markup).not.toContain('data-section="checklist"');
    expect(markup).not.toContain('data-section="accommodation"');
    expect(markup).not.toContain('data-section="collaborators"');
  });

  it('READ xem dữ liệu riêng nhưng không có thao tác ghi', () => {
    const markup = renderAccess('READ');

    expect(markup).not.toContain('Sửa thông tin');
    expect(markup).not.toContain('Thêm điểm dừng');
    expect(markup).toContain('data-section="budget" data-can-edit="false"');
    expect(markup).toContain('data-section="checklist" data-can-edit="false"');
    expect(markup).toContain('data-section="accommodation" data-can-edit="false"');
    expect(markup).not.toContain('data-section="collaborators"');
  });

  it('EDIT được chỉnh sửa nhưng không quản trị cộng tác viên', () => {
    const markup = renderAccess('EDIT');

    expect(markup).toContain('Sửa thông tin');
    expect(markup).toContain('Thêm điểm dừng');
    expect(markup).toContain('data-section="budget" data-can-edit="true"');
    expect(markup).toContain('data-section="checklist" data-can-edit="true"');
    expect(markup).toContain('data-section="accommodation" data-can-edit="true"');
    expect(markup).not.toContain('data-section="collaborators"');
  });

  it('OWNER giữ toàn bộ quyền quản trị', () => {
    const markup = renderAccess('OWNER');

    expect(markup).toContain('Sửa thông tin');
    expect(markup).toContain('Thêm điểm dừng');
    expect(markup).toContain('data-section="budget" data-can-edit="true"');
    expect(markup).toContain('data-section="checklist" data-can-edit="true"');
    expect(markup).toContain('data-section="accommodation" data-can-edit="true"');
    expect(markup).toContain('data-section="collaborators"');
  });
});
