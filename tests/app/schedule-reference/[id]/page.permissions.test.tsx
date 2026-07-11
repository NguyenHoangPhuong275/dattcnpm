import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import ItineraryDetailPage from '@/app/schedule-reference/[id]/page';
import type { TripAccess } from '@/types/trip';

const reactState = vi.hoisted(() => ({
  index: 0,
  values: [] as unknown[],
}));

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useState: <T,>(initial: T | (() => T)) => {
      const index = reactState.index;
      reactState.index += 1;
      const fallback = typeof initial === 'function' ? (initial as () => T)() : initial;
      const value = index < reactState.values.length ? reactState.values[index] as T : fallback;
      return [value, vi.fn()] as const;
    },
  };
});

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'trip-1' }),
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));

vi.mock('next/image', () => ({
  default: ({ alt }: { alt: string }) => <span data-image-alt={alt} />,
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/components/AppHeader', () => ({
  default: () => <div data-component="header" />,
}));

vi.mock('@/components/ui/EmptyState', () => ({
  default: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock('@/components/ui/LoadingSpinner', () => ({
  default: () => <div data-component="loading" />,
}));

vi.mock('@/components/trips/ChangePlaceModal', () => ({
  default: () => <div data-component="change-place-modal" />,
}));

vi.mock('@/components/trips/TripBudgetSummary', () => ({
  default: ({ canEdit }: { canEdit?: boolean }) => (
    <div data-section="budget" data-can-edit={String(canEdit)} />
  ),
}));

vi.mock('@/components/trips/TripAccommodationSection', () => ({
  default: ({ canEdit }: { canEdit?: boolean }) => (
    <div data-section="accommodation" data-can-edit={String(canEdit)} />
  ),
}));

vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ data: { id: 'user-1' }, status: 'success' }),
}));

vi.mock('@/hooks/useFeedback', () => ({
  useFeedback: () => ({ actions: { confirmAction: vi.fn() } }),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ actions: { showToast: vi.fn() } }),
}));

vi.mock('@/lib/api-client', () => ({
  apiRequest: vi.fn(),
  ensureApiSuccess: vi.fn(),
  getApiErrorMessage: vi.fn(),
  isAbortError: vi.fn(),
}));

function renderAccess(access: TripAccess, activeTab: 'itinerary' | 'budget' | 'hotel' = 'itinerary'): string {
  reactState.index = 0;
  reactState.values = [
    {
      _id: 'trip-1',
      title: 'Chuyến đi phân quyền',
      destination: 'Đà Nẵng',
      startDate: '2026-08-01',
      endDate: '2026-08-03',
      isPublic: access === 'PUBLIC',
      access,
    },
    [
      {
        _id: 'item-1',
        day: 1,
        orderIndex: 0,
        note: 'Tham quan',
        placeId: 'place-1',
        place: { _id: 'place-1', name: 'Cầu Rồng', address: 'Đà Nẵng' },
      },
    ],
    'item-1',
    null,
    activeTab,
    false,
    false,
    '',
  ];

  return renderToStaticMarkup(<ItineraryDetailPage />);
}

describe('ItineraryDetailPage permissions', () => {
  it('PUBLIC chỉ có lịch trình và xuất PDF', () => {
    const markup = renderAccess('PUBLIC', 'hotel');

    expect(markup).toContain('id="action-export-pdf-trip"');
    expect(markup).toContain('id="tab-button-itinerary"');
    expect(markup).not.toContain('id="tab-button-budget"');
    expect(markup).not.toContain('id="tab-button-hotel"');
    expect(markup).not.toContain('id="action-share-trip"');
    expect(markup).not.toContain('id="action-edit-trip"');
    expect(markup).not.toContain('id="action-delete-trip"');
    expect(markup).not.toContain('Đổi địa điểm');
    expect(markup).not.toContain('data-section="budget"');
    expect(markup).not.toContain('data-section="accommodation"');
  });

  it('READ xem ngân sách và khách sạn ở chế độ chỉ đọc', () => {
    const budgetMarkup = renderAccess('READ', 'budget');
    const hotelMarkup = renderAccess('READ', 'hotel');

    expect(budgetMarkup).toContain('id="tab-button-budget"');
    expect(budgetMarkup).toContain('id="tab-button-hotel"');
    expect(budgetMarkup).toContain('data-section="budget" data-can-edit="false"');
    expect(hotelMarkup).toContain('data-section="accommodation" data-can-edit="false"');
    expect(budgetMarkup).not.toContain('id="action-edit-trip"');
    expect(budgetMarkup).not.toContain('id="action-share-trip"');
    expect(budgetMarkup).not.toContain('id="action-delete-trip"');
    expect(budgetMarkup).not.toContain('Đổi địa điểm');
  });

  it('EDIT được chỉnh sửa nhưng không có thao tác của chủ sở hữu', () => {
    const itineraryMarkup = renderAccess('EDIT');
    const budgetMarkup = renderAccess('EDIT', 'budget');

    expect(itineraryMarkup).toContain('id="action-edit-trip"');
    expect(itineraryMarkup).toContain('Đổi địa điểm');
    expect(budgetMarkup).toContain('data-section="budget" data-can-edit="true"');
    expect(itineraryMarkup).not.toContain('id="action-share-trip"');
    expect(itineraryMarkup).not.toContain('id="action-delete-trip"');
  });

  it('OWNER có đầy đủ thao tác quản trị', () => {
    const markup = renderAccess('OWNER');

    expect(markup).toContain('id="action-share-trip"');
    expect(markup).toContain('id="action-edit-trip"');
    expect(markup).toContain('id="action-delete-trip"');
    expect(markup).toContain('Đổi địa điểm');
  });
});
