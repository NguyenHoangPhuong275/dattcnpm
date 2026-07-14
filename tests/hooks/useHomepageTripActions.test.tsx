// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useHomepageTripActions } from '@/hooks/useHomepageTripActions';
import { apiRequest } from '@/lib/api-client';
import type { TripSummary } from '@/types/profile';

const routerPush = vi.fn();
const loadTrips = vi.fn();
const setTrips = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerPush }),
}));

vi.mock('@/hooks/useTripList', () => ({
  useTripList: () => ({
    trips: [],
    status: 'success',
    loadTrips,
    setTrips,
  }),
}));

vi.mock('@/lib/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api-client')>();
  return { ...actual, apiRequest: vi.fn() };
});

const mockedApiRequest = vi.mocked(apiRequest);

const SELECTED_PLACE = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Vịnh Hạ Long',
  address: 'Hạ Long, Quảng Ninh',
};

const POI_PLACE = {
  _id: '507f191e810c19729de860ea',
  name: 'Bãi Cháy',
  address: 'Bãi Cháy, Hạ Long, Quảng Ninh',
};

function createTrip(id = '507f1f77bcf86cd799439012'): TripSummary {
  return {
    _id: id,
    title: 'Chuyến đi Vịnh Hạ Long',
    destination: SELECTED_PLACE.address,
    startDate: '2026-08-01',
    endDate: '2026-08-05',
    isPublic: false,
  };
}

function mockSuccessfulTripCreation(trip = createTrip()): void {
  mockedApiRequest.mockResolvedValueOnce({
    response: { ok: true } as Response,
    data: { success: true, data: trip },
  });
}

function readRequestBody(callIndex: number): Record<string, unknown> {
  const options = mockedApiRequest.mock.calls[callIndex]?.[1];
  expect(typeof options?.body).toBe('string');
  return JSON.parse(options?.body as string) as Record<string, unknown>;
}

beforeEach(() => {
  mockedApiRequest.mockReset();
  routerPush.mockReset();
  loadTrips.mockReset();
  setTrips.mockReset();
});

describe('useHomepageTripActions', () => {
  it('tạo lịch trình từ địa điểm đang chọn với payload đầy đủ', async () => {
    mockSuccessfulTripCreation();
    const { result } = renderHook(() => useHomepageTripActions({
      userId: 'user-1',
      selectedPlace: SELECTED_PLACE,
    }));

    act(() => {
      result.current.setStartDate('2026-08-01');
      result.current.setEndDate('2026-08-05');
      result.current.setTravelerCount(3);
    });

    await act(async () => {
      await result.current.createTripFromSelectedPlace();
    });

    expect(mockedApiRequest).toHaveBeenNthCalledWith(1, '/api/trips', expect.objectContaining({
      method: 'POST',
      userId: 'user-1',
    }));
    expect(readRequestBody(0)).toEqual({
      title: 'Chuyến đi Vịnh Hạ Long',
      destination: 'Hạ Long, Quảng Ninh',
      startDate: '2026-08-01',
      endDate: '2026-08-05',
      description: '3 người',
      initialPlaceId: SELECTED_PLACE._id,
    });
    expect(mockedApiRequest).toHaveBeenCalledOnce();
    expect(routerPush).toHaveBeenCalledWith('/trips/507f1f77bcf86cd799439012/book-wizard');
  });

  it('tạo lịch trình từ POI được chỉ định thay vì địa điểm đang chọn', async () => {
    const poiTrip = createTrip('507f1f77bcf86cd799439013');
    mockSuccessfulTripCreation(poiTrip);
    const { result } = renderHook(() => useHomepageTripActions({
      userId: 'user-1',
      selectedPlace: SELECTED_PLACE,
    }));

    act(() => {
      result.current.setStartDate('2026-09-10');
      result.current.setEndDate('2026-09-12');
    });

    await act(async () => {
      await result.current.createTripFromPlace(POI_PLACE);
    });

    expect(readRequestBody(0)).toEqual({
      title: 'Chuyến đi Bãi Cháy',
      destination: 'Bãi Cháy, Hạ Long, Quảng Ninh',
      startDate: '2026-09-10',
      endDate: '2026-09-12',
      description: '2 người',
      initialPlaceId: POI_PLACE._id,
    });
    expect(mockedApiRequest).toHaveBeenCalledOnce();
  });

  it('chỉ gửi một yêu cầu khi hành động tạo bị gọi liên tiếp', async () => {
    let resolveRequest!: (value: {
      response: Response;
      data: { success: true; data: TripSummary };
    }) => void;
    mockedApiRequest.mockImplementationOnce(() => new Promise((resolve) => {
      resolveRequest = resolve;
    }));
    const { result } = renderHook(() => useHomepageTripActions({
      userId: 'user-1',
      selectedPlace: SELECTED_PLACE,
    }));

    let firstRequest!: Promise<void>;
    let secondRequest!: Promise<void>;
    act(() => {
      firstRequest = result.current.createTripFromSelectedPlace();
      secondRequest = result.current.createTripFromSelectedPlace();
    });

    expect(mockedApiRequest).toHaveBeenCalledOnce();

    resolveRequest({
      response: { ok: true } as Response,
      data: { success: true, data: createTrip() },
    });
    await act(async () => {
      await Promise.all([firstRequest, secondRequest]);
    });
  });

  it.each([
    ['', '2026-08-05', 'Vui lòng chọn ngày đi và ngày về hợp lệ'],
    ['2026-08-05', '', 'Vui lòng chọn ngày đi và ngày về hợp lệ'],
    ['2026-08-05', '2026-08-01', 'Ngày kết thúc phải sau ngày bắt đầu'],
  ])('không gửi yêu cầu khi khoảng ngày không hợp lệ (%s, %s)', async (startDate, endDate, message) => {
    const { result } = renderHook(() => useHomepageTripActions({
      userId: 'user-1',
      selectedPlace: SELECTED_PLACE,
    }));

    act(() => {
      result.current.setStartDate(startDate);
      result.current.setEndDate(endDate);
    });

    await act(async () => {
      await result.current.createTripFromSelectedPlace();
    });

    expect(mockedApiRequest).not.toHaveBeenCalled();
    expect(result.current.tripActionStatus).toBe('error');
    expect(result.current.tripActionMessage).toBe(message);
  });

  it.each([0, 101])('không gửi yêu cầu khi số người là %s', async (travelerCount) => {
    const { result } = renderHook(() => useHomepageTripActions({
      userId: 'user-1',
      selectedPlace: SELECTED_PLACE,
    }));

    act(() => {
      result.current.setTravelerCount(travelerCount);
    });

    await act(async () => {
      await result.current.createTripFromSelectedPlace();
    });

    expect(mockedApiRequest).not.toHaveBeenCalled();
    expect(result.current.tripActionStatus).toBe('error');
    expect(result.current.tripActionMessage).toBe('Số người phải từ 1 đến 100');
  });
});
