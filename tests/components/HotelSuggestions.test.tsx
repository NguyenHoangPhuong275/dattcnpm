// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';

import HotelSuggestions from '@/components/hotels/HotelSuggestions';
import { apiRequest } from '@/lib/api-client';

vi.mock('@/lib/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api-client')>();
  return { ...actual, apiRequest: vi.fn() };
});

const mockedApiRequest = vi.mocked(apiRequest);

interface PendingCall {
  url: string;
  options?: unknown;
  resolve: (value: unknown) => void;
}

let calls: PendingCall[] = [];

function makeResponse(hotels: unknown[]) {
  return {
    response: { ok: true } as Response,
    data: {
      success: true,
      data: { data: hotels, total: hotels.length, page: 1, totalPages: 1, matchedBy: 'province' },
    },
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

const daNang = [{ id: '507f1f77bcf86cd799439101', name: 'Mường Thanh Đà Nẵng', province: 'Đà Nẵng', district: 'Hải Châu', address: null, rating: 4, priceLevel: 'luxury' }];
const haLong = [{ id: '507f1f77bcf86cd799439102', name: 'Vinpearl Hạ Long', province: 'Quảng Ninh', district: 'Hạ Long', address: null, rating: 4, priceLevel: 'luxury' }];

describe('Chức năng gợi ý khách sạn (HotelSuggestions) — chống race condition', () => {
  it('response cũ trả về muộn không ghi đè response mới', async () => {
    const { rerender } = render(<HotelSuggestions destination="Đà Nẵng" />);
    expect(calls.length).toBe(1);

    rerender(<HotelSuggestions destination="Hạ Long" />);
    expect(calls.length).toBe(2);

    await act(async () => {
      calls[1].resolve(makeResponse(haLong));
    });
    expect(await screen.findByText('Vinpearl Hạ Long')).toBeTruthy();

    await act(async () => {
      calls[0].resolve(makeResponse(daNang));
    });

    expect(screen.queryByText('Mường Thanh Đà Nẵng')).toBeNull();
    expect(screen.getByText('Vinpearl Hạ Long')).toBeTruthy();
  });

  it('hiển thị kết quả bình thường khi không có race', async () => {
    render(<HotelSuggestions destination="Đà Nẵng" />);
    expect(calls.length).toBe(1);
    await act(async () => {
      calls[0].resolve(makeResponse(daNang));
    });
    expect(await screen.findByText('Mường Thanh Đà Nẵng')).toBeTruthy();
  });

  it('không gọi API khi thiếu tiêu chí tìm kiếm', () => {
    render(<HotelSuggestions />);
    expect(mockedApiRequest).not.toHaveBeenCalled();
    expect(screen.getByText(/Nhập điểm đến/)).toBeTruthy();
  });

  it('gọi API chế độ nổi bật khi không có tiêu chí nhưng bật featuredWhenEmpty', () => {
    render(<HotelSuggestions featuredWhenEmpty />);
    expect(calls.length).toBe(1);
    expect(calls[0].url).toContain('featured=1');
  });
});
