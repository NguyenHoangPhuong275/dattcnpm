// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import TripAccommodationSection from '@/components/trips/TripAccommodationSection';
import { apiRequest } from '@/lib/api-client';

vi.mock('@/lib/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api-client')>();
  return { ...actual, apiRequest: vi.fn() };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ actions: { showToast: vi.fn() } }),
}));

vi.mock('@/hooks/useFeedback', () => ({
  useFeedback: () => ({
    actions: {
      confirmAction: async ({ action }: { action: () => Promise<unknown> }) => action(),
    },
  }),
}));

const mockedApiRequest = vi.mocked(apiRequest);

interface PendingCall {
  url: string;
  options?: unknown;
  resolve: (value: unknown) => void;
}

let calls: PendingCall[] = [];

function makeHotelsResponse(hotels: unknown[]) {
  return {
    response: { ok: true } as Response,
    data: {
      success: true,
      data: { data: hotels, total: hotels.length, page: 1, totalPages: 1, matchedBy: 'province' },
    },
  };
}

function makeAccommodationResponse(data: unknown) {
  return {
    response: { ok: true } as Response,
    data: { success: true, data },
  };
}

afterEach(cleanup);
beforeEach(() => {
  calls = [];
  mockedApiRequest.mockReset();
  mockedApiRequest.mockImplementation(
    (url: unknown, options?: unknown) =>
      new Promise((resolve) => {
        calls.push({ url: String(url), options, resolve: resolve as (value: unknown) => void });
      }) as ReturnType<typeof apiRequest>
  );
});

const daNangHotelId = '507f1f77bcf86cd799439101';
const daNang = [{ id: daNangHotelId, name: 'Mường Thanh Đà Nẵng', province: 'Đà Nẵng', district: 'Hải Châu', address: null, rating: 4, priceLevel: 'luxury' }];
const selectedAccommodation = {
  id: 'accommodation-1',
  hotelId: daNangHotelId,
  name: 'Mường Thanh Đà Nẵng',
  address: 'Đà Nẵng',
  checkIn: '2026-07-11T00:00:00.000Z',
  checkOut: '2026-07-12T00:00:00.000Z',
  bookingCode: null,
  note: null,
  currency: 'VND',
};

describe('Chức năng quản lý chỗ ở chuyến đi (TripAccommodationSection)', () => {
  it('thu gọn gợi ý sau khi lưu và cho phép chủ động chọn thêm', async () => {
    render(<TripAccommodationSection tripId="trip-1" userId="user-1" destination="Đà Nẵng" />);

    await act(async () => calls[0].resolve(makeAccommodationResponse([])));
    await waitFor(() => expect(calls).toHaveLength(2));
    await act(async () => calls[1].resolve(makeHotelsResponse(daNang)));

    fireEvent.click(await screen.findByRole('button', { name: 'Lưu vào chuyến đi' }));
    await waitFor(() => expect(calls).toHaveLength(3));
    const createBody = JSON.parse(String((calls[2].options as { body?: unknown })?.body ?? '{}')) as Record<string, unknown>;
    expect(createBody.hotelId).toBe(daNangHotelId);
    await act(async () => calls[2].resolve(makeAccommodationResponse([])));
    await waitFor(() => expect(calls).toHaveLength(4));
    await act(async () => calls[3].resolve(makeAccommodationResponse([selectedAccommodation])));

    expect(await screen.findByText('Mường Thanh Đà Nẵng')).toBeTruthy();
    expect(screen.queryByText('Gợi ý khách sạn tại Đà Nẵng')).toBeNull();
    expect(screen.getByRole('link', { name: 'Xem chi tiết' }).getAttribute('href')).toBe(`/hotels/${daNangHotelId}`);

    fireEvent.click(screen.getByRole('button', { name: 'Thêm khách sạn khác' }));
    expect(screen.getByText('Gợi ý khách sạn tại Đà Nẵng')).toBeTruthy();
  });

  it('hiện lại gợi ý khi đã xóa khách sạn cuối cùng', async () => {
    render(<TripAccommodationSection tripId="trip-1" userId="user-1" destination="Đà Nẵng" />);

    await act(async () => calls[0].resolve(makeAccommodationResponse([selectedAccommodation])));
    fireEvent.click(await screen.findByRole('button', { name: 'Xóa' }));
    await waitFor(() => expect(calls).toHaveLength(2));
    await act(async () => calls[1].resolve(makeAccommodationResponse({ message: 'Đã xóa' })));
    await waitFor(() => expect(calls).toHaveLength(3));
    await act(async () => calls[2].resolve(makeAccommodationResponse([])));

    expect(await screen.findByText('Gợi ý khách sạn tại Đà Nẵng')).toBeTruthy();
  });

  it('giữ bản ghi cũ không có hotelId ở trạng thái chỉ đọc an toàn', async () => {
    render(<TripAccommodationSection tripId="trip-1" userId="user-1" destination="Đà Nẵng" />);

    await act(async () => calls[0].resolve(makeAccommodationResponse([{ ...selectedAccommodation, hotelId: null }])));

    expect(await screen.findByText('Mường Thanh Đà Nẵng')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Xem chi tiết' })).toBeNull();
  });

  it('quyền chỉ xem vẫn đọc khách sạn nhưng không thấy thao tác thay đổi', async () => {
    render(<TripAccommodationSection tripId="trip-1" userId="user-1" canEdit={false} destination="Đà Nẵng" />);

    await act(async () => calls[0].resolve(makeAccommodationResponse([selectedAccommodation])));

    expect(await screen.findByText('Mường Thanh Đà Nẵng')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Xem chi tiết' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Xóa' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Thêm khách sạn khác' })).toBeNull();
    expect(calls).toHaveLength(1);
  });
});
