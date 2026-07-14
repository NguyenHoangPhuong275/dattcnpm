// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import TripDetailModal from '@/components/profile/TripDetailModal';
import { apiRequest } from '@/lib/api-client';
import type { TripSummary } from '@/types/profile';

const placeSearchMocks = vi.hoisted(() => ({
  clearSelectedPlace: vi.fn(),
  handleSelectPlace: vi.fn(),
  setSearchQuery: vi.fn(),
}));

vi.mock('@/lib/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api-client')>();
  return { ...actual, apiRequest: vi.fn() };
});

vi.mock('@/hooks/useFeedback', () => ({
  useFeedback: () => ({ actions: { confirmAction: vi.fn() } }),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ actions: { showToast: vi.fn() } }),
}));

vi.mock('@/hooks/usePlaceSearch', () => ({
  usePlaceSearch: () => ({
    searchQuery: '',
    setSearchQuery: placeSearchMocks.setSearchQuery,
    searchResults: [],
    isSearching: false,
    isDropdownOpen: false,
    searchContainerRef: { current: null },
    handleSelectPlace: placeSearchMocks.handleSelectPlace,
    clearSelectedPlace: placeSearchMocks.clearSelectedPlace,
  }),
}));

vi.mock('@/components/profile/trip-detail/TripDetailHeader', () => ({
  TripDetailHeader: ({ trip }: { trip: TripSummary }) => <h2>{trip.title}</h2>,
}));

vi.mock('@/components/profile/trip-detail/TripOverviewSection', () => ({
  TripOverviewSection: () => null,
}));

vi.mock('@/components/profile/trip-detail/TripPrivateSections', () => ({
  TripPrivateSections: () => null,
}));

vi.mock('@/components/profile/trip-detail/ItinerarySection', () => ({
  ItinerarySection: ({ groups, loading }: {
    groups: Array<{ items: Array<{ _id: string; place?: { name?: string } | null }> }>;
    loading: boolean;
  }) => (
    <div>
      {loading && <span>Đang tải lịch trình</span>}
      {groups.flatMap((group) => group.items).map((item) => (
        <span key={item._id}>{item.place?.name}</span>
      ))}
    </div>
  ),
}));

interface PendingCall {
  url: string;
  resolve: (value: Awaited<ReturnType<typeof apiRequest>>) => void;
}

const mockedApiRequest = vi.mocked(apiRequest);
let calls: PendingCall[] = [];

function makeTrip(id: string, title: string): TripSummary {
  return {
    _id: id,
    title,
    destination: 'Đà Nẵng',
    startDate: '2026-08-01',
    endDate: '2026-08-03',
    isPublic: true,
    access: 'PUBLIC',
  };
}

function itineraryResponse(id: string, name: string): Awaited<ReturnType<typeof apiRequest>> {
  return {
    response: { ok: true } as Response,
    data: {
      success: true,
      data: [{
        _id: id,
        day: 1,
        orderIndex: 0,
        note: '',
        placeId: `place-${id}`,
        place: { _id: `place-${id}`, name },
      }],
    },
  };
}

beforeEach(() => {
  calls = [];
  vi.clearAllMocks();
  mockedApiRequest.mockImplementation((url: string | URL | Request) => (
    new Promise((resolve) => {
      calls.push({ url: String(url), resolve });
    })
  ));
});

afterEach(cleanup);

describe('TripDetailModal itinerary request sequencing', () => {
  it('không cho phản hồi cũ ghi đè lịch trình của chuyến đi mới', async () => {
    const view = render(
      <TripDetailModal trip={makeTrip('trip-a', 'Chuyến A')} userId="user-1" onClose={vi.fn()} />,
    );
    await waitFor(() => expect(calls).toHaveLength(1));

    view.rerender(
      <TripDetailModal trip={makeTrip('trip-b', 'Chuyến B')} userId="user-1" onClose={vi.fn()} />,
    );
    await waitFor(() => expect(calls).toHaveLength(2));
    expect(calls[1].url).toContain('/api/trips/trip-b/itinerary');

    await act(async () => {
      calls[1].resolve(itineraryResponse('item-b', 'Điểm mới'));
    });
    expect(await screen.findByText('Điểm mới')).toBeTruthy();

    await act(async () => {
      calls[0].resolve(itineraryResponse('item-a', 'Điểm cũ'));
    });

    expect(screen.queryByText('Điểm cũ')).toBeNull();
    expect(screen.getByText('Điểm mới')).toBeTruthy();
  });

  it('xóa lịch trình đang hiển thị ngay khi chuyển chuyến đi', async () => {
    const view = render(
      <TripDetailModal trip={makeTrip('trip-a', 'Chuyến A')} userId="user-1" onClose={vi.fn()} />,
    );
    await waitFor(() => expect(calls).toHaveLength(1));
    await act(async () => {
      calls[0].resolve(itineraryResponse('item-a', 'Điểm chuyến A'));
    });
    expect(await screen.findByText('Điểm chuyến A')).toBeTruthy();

    view.rerender(
      <TripDetailModal trip={makeTrip('trip-b', 'Chuyến B')} userId="user-1" onClose={vi.fn()} />,
    );
    await waitFor(() => expect(calls).toHaveLength(2));

    expect(screen.queryByText('Điểm chuyến A')).toBeNull();
    expect(screen.getByText('Đang tải lịch trình')).toBeTruthy();

    await act(async () => {
      calls[1].resolve(itineraryResponse('item-b', 'Điểm chuyến B'));
    });
    expect(await screen.findByText('Điểm chuyến B')).toBeTruthy();
  });
});
