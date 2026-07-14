// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { usePaginatedBookingList } from '@/hooks/usePaginatedBookingList';
import { apiRequest } from '@/lib/api-client';

vi.mock('@/lib/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api-client')>();
  return { ...actual, apiRequest: vi.fn() };
});

interface TestBooking {
  id: string;
  version: number;
}

const mockedApiRequest = vi.mocked(apiRequest);

function getPage(input: string | URL | Request): number {
  const url = new URL(String(input), 'http://localhost');
  return Number(url.searchParams.get('page'));
}

function apiResult(items: TestBooking[], page: number) {
  return {
    response: { ok: true } as Response,
    data: {
      success: true,
      data: {
        items,
        pagination: { page, limit: 20, total: 21, totalPages: 2 },
      },
    },
  };
}

beforeEach(() => {
  mockedApiRequest.mockReset();
});

afterEach(() => {
  cleanup();
});

describe('usePaginatedBookingList', () => {
  it('gộp các request cùng trang đang chạy đồng thời', async () => {
    mockedApiRequest.mockResolvedValue(apiResult([{ id: 'booking-1', version: 1 }], 1));
    const options = {
      endpoint: '/api/flight-bookings/my',
      fallbackMessage: 'Không thể tải danh sách vé',
      userId: 'booking-user',
    };
    const first = renderHook(() => usePaginatedBookingList<TestBooking>(options));
    const second = renderHook(() => usePaginatedBookingList<TestBooking>(options));

    await act(async () => {
      await Promise.all([
        first.result.current.actions.loadFirstPage(),
        second.result.current.actions.loadFirstPage(),
      ]);
    });

    expect(mockedApiRequest).toHaveBeenCalledTimes(1);
    expect(first.result.current.data).toHaveLength(1);
    expect(second.result.current.data).toHaveLength(1);
  });

  it('giữ các bản ghi đã tải, lấy được bản ghi thứ 21 và làm mới toàn bộ các trang đang hiển thị', async () => {
    let version = 1;
    mockedApiRequest.mockImplementation((input) => {
      const page = getPage(input);
      const items = page === 1
        ? Array.from({ length: 20 }, (_, index) => ({ id: `booking-${index + 1}`, version }))
        : [{ id: 'booking-21', version }];
      return Promise.resolve(apiResult(items, page)) as ReturnType<typeof apiRequest>;
    });

    const { result } = renderHook(() => usePaginatedBookingList<TestBooking>({
      endpoint: '/api/bookings/my',
      fallbackMessage: 'Không thể tải danh sách đặt chỗ',
      userId: 'booking-user',
    }));

    await act(async () => {
      await result.current.actions.loadFirstPage();
    });
    expect(result.current.data).toHaveLength(20);
    expect(result.current.hasMore).toBe(true);

    await act(async () => {
      await result.current.actions.loadMore();
    });
    expect(result.current.data).toHaveLength(21);
    expect(result.current.data.some((item) => item.id === 'booking-21')).toBe(true);
    expect(result.current.hasMore).toBe(false);

    version = 2;
    await act(async () => {
      await result.current.actions.refreshLoadedPages();
    });
    expect(result.current.data).toHaveLength(21);
    expect(result.current.data.every((item) => item.version === 2)).toBe(true);
    expect(mockedApiRequest).toHaveBeenCalledTimes(4);
  });

  it('cô lập request và dữ liệu đặt chỗ giữa các tài khoản', async () => {
    mockedApiRequest.mockImplementation((_input, options) => {
      const userId = options?.userId ?? 'unknown';
      return Promise.resolve(apiResult([{ id: userId, version: 1 }], 1)) as ReturnType<typeof apiRequest>;
    });

    const first = renderHook(() => usePaginatedBookingList<TestBooking>({
      endpoint: '/api/bookings/my',
      fallbackMessage: 'Không thể tải danh sách đặt chỗ',
      userId: 'user-a',
    }));
    const second = renderHook(() => usePaginatedBookingList<TestBooking>({
      endpoint: '/api/bookings/my',
      fallbackMessage: 'Không thể tải danh sách đặt chỗ',
      userId: 'user-b',
    }));

    await act(async () => {
      await Promise.all([
        first.result.current.actions.loadFirstPage(),
        second.result.current.actions.loadFirstPage(),
      ]);
    });

    expect(mockedApiRequest).toHaveBeenCalledTimes(2);
    expect(first.result.current.data[0]?.id).toBe('user-a');
    expect(second.result.current.data[0]?.id).toBe('user-b');
  });

  it('ẩn dữ liệu của tài khoản cũ ngay khi phạm vi người dùng thay đổi', async () => {
    mockedApiRequest.mockResolvedValue(apiResult([{ id: 'user-a-booking', version: 1 }], 1));
    const { result, rerender } = renderHook(
      ({ userId }) => usePaginatedBookingList<TestBooking>({
        endpoint: '/api/bookings/my',
        fallbackMessage: 'Không thể tải danh sách đặt chỗ',
        userId,
      }),
      { initialProps: { userId: 'user-a' } },
    );

    await act(async () => {
      await result.current.actions.loadFirstPage();
    });
    expect(result.current.data).toHaveLength(1);
    const oldRefresh = result.current.actions.refreshLoadedPages;

    rerender({ userId: 'user-b' });

    expect(result.current.data).toEqual([]);
    expect(result.current.status).toBe('loading');

    await act(async () => {
      await oldRefresh();
    });
    expect(mockedApiRequest).toHaveBeenCalledTimes(1);
  });
});
