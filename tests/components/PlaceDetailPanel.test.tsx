// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PlaceDetailPanel from '@/components/home/PlaceDetailPanel';
import { apiRequest } from '@/lib/api-client';
import type { UsePlaceDetailsReturn } from '@/hooks/usePlaceDetails';
import type { SearchResult } from '@/hooks/usePlaceSearch';

vi.mock('@/lib/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api-client')>();
  return { ...actual, apiRequest: vi.fn() };
});

const selectedPlace: SearchResult = {
  _id: 'selected-place',
  name: 'Đà Nẵng',
  lat: 16.0544,
  lng: 108.2022,
};

const details: UsePlaceDetailsReturn = {
  weather: null,
  pois: [{ id: 'poi-1', name: 'Cầu Rồng', type: 'attraction', address: 'Đà Nẵng' }],
  weatherStatus: 'success',
  poisStatus: 'success',
  weatherError: null,
  poisError: null,
  isWeatherLoading: false,
  isPoisLoading: false,
};

const mockedApiRequest = vi.mocked(apiRequest);

function renderPanel(onCreateTripFromPlace = vi.fn()) {
  return render(
    <PlaceDetailPanel
      selectedPlace={selectedPlace}
      details={details}
      myTrips={[]}
      isLoggedIn
      isTripActionLoading={false}
      onCreateTripFromPlace={onCreateTripFromPlace}
      onLogin={vi.fn()}
      onOpenAddToTripModal={vi.fn()}
    />,
  );
}

beforeEach(() => {
  mockedApiRequest.mockReset();
});

afterEach(cleanup);

describe('PlaceDetailPanel place lookup feedback', () => {
  it('shows a Vietnamese message when the lookup succeeds without a result', async () => {
    mockedApiRequest.mockResolvedValue({
      response: { ok: true } as Response,
      data: { success: true, data: { results: [] } },
    });
    renderPanel();

    await userEvent.setup().click(screen.getByRole('button', { name: 'Tạo chuyến đi mới' }));

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Chưa tìm thấy thông tin chi tiết cho địa điểm này. Vui lòng chọn địa điểm khác.',
    );
  });

  it('shows a Vietnamese retry message when the lookup request fails', async () => {
    mockedApiRequest.mockRejectedValue(new Error('network failure'));
    renderPanel();

    await userEvent.setup().click(screen.getByRole('button', { name: 'Tạo chuyến đi mới' }));

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Không thể tải thông tin địa điểm này. Vui lòng thử lại sau.',
    );
  });

  it('keeps the existing create-trip action when a place is found', async () => {
    const onCreateTripFromPlace = vi.fn();
    const resolvedPlace = { ...selectedPlace, _id: 'resolved-place', name: 'Cầu Rồng' };
    mockedApiRequest.mockResolvedValue({
      response: { ok: true } as Response,
      data: { success: true, data: { results: [resolvedPlace] } },
    });
    renderPanel(onCreateTripFromPlace);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Tạo chuyến đi mới' }));

    await waitFor(() => expect(onCreateTripFromPlace).toHaveBeenCalledWith(resolvedPlace));
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
