// @vitest-environment jsdom
import { createRef } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import TripPlannerForm from '@/components/home/TripPlannerForm';
import type { SearchResult, UsePlaceSearchReturn } from '@/hooks/usePlaceSearch';

const SELECTED_PLACE: SearchResult = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Vịnh Hạ Long',
  address: 'Hạ Long, Quảng Ninh',
  lat: 20.9101,
  lng: 107.1839,
};

function createSearchState(): UsePlaceSearchReturn {
  return {
    searchQuery: SELECTED_PLACE.address ?? SELECTED_PLACE.name,
    setSearchQuery: vi.fn(),
    searchResults: [],
    searchStatus: 'success',
    isSearching: false,
    selectedPlace: SELECTED_PLACE,
    searchError: null,
    isDropdownOpen: false,
    setIsDropdownOpen: vi.fn(),
    searchContainerRef: createRef<HTMLDivElement>(),
    handleSearch: vi.fn(),
    searchFor: vi.fn(),
    handleSelectPlace: vi.fn(),
    clearSelectedPlace: vi.fn(),
  };
}

afterEach(cleanup);

describe('TripPlannerForm', () => {
  it('gọi hành động tạo lịch trình mà không truyền MouseEvent', async () => {
    const onCreateTrip = vi.fn();
    const user = userEvent.setup();

    render(
      <TripPlannerForm
        search={createSearchState()}
        startDate="2026-08-01"
        endDate="2026-08-05"
        travelerCount={2}
        onStartDateChange={vi.fn()}
        onEndDateChange={vi.fn()}
        onTravelerCountChange={vi.fn()}
        onCreateTrip={onCreateTrip}
        isCreating={false}
        isUserLoading={false}
        onAddToTrip={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Tạo lịch trình' }));

    expect(onCreateTrip).toHaveBeenCalledOnce();
    expect(onCreateTrip.mock.calls[0]).toEqual([]);
  });
});
