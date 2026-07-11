import { createRequire } from 'node:module';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { useTripList } from '@/hooks/useTripList';
import { apiRequest } from '@/lib/api-client';
import { setStoredUser } from '@/lib/user';
import type { TripsListResponse } from '@/lib/trip-formatters';
import type { BasicUser, TripSummary } from '@/types/profile';

vi.mock('@/lib/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api-client')>();
  return { ...actual, apiRequest: vi.fn() };
});

type ApiResult = Awaited<ReturnType<typeof apiRequest<TripsListResponse>>>;
type TestDom = {
  window: {
    close: () => void;
    document: Document;
    navigator: Navigator;
    sessionStorage: Storage;
  };
};
type TestDomConstructor = new (html: string, options: { url: string }) => TestDom;

const mockedApiRequest = vi.mocked(apiRequest);
const requireModule = createRequire(import.meta.url);
const { JSDOM } = requireModule('jsdom') as unknown as { JSDOM: TestDomConstructor };
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' });

function createUser(id: string): BasicUser {
  return {
    id,
    email: `${id}@example.com`,
    fullName: id,
  };
}

function createTrip(id: string): TripSummary {
  return {
    _id: id,
    title: `Chuyến đi ${id}`,
    destination: `Điểm đến ${id}`,
    startDate: '2026-08-01T00:00:00.000Z',
    endDate: '2026-08-03T00:00:00.000Z',
    isPublic: false,
  };
}

function createApiResult(trip: TripSummary): ApiResult {
  return {
    response: { ok: true } as Response,
    data: { success: true, data: [trip] },
  };
}

function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
} {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

beforeAll(() => {
  vi.stubGlobal('window', dom.window);
  vi.stubGlobal('document', dom.window.document);
  vi.stubGlobal('navigator', dom.window.navigator);
  vi.stubGlobal('sessionStorage', dom.window.sessionStorage);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
});

beforeEach(() => {
  mockedApiRequest.mockReset();
  setStoredUser(null);
});

afterEach(() => {
  cleanup();
  setStoredUser(null);
});

afterAll(() => {
  dom.window.close();
  vi.unstubAllGlobals();
});

describe('useTripList identity isolation', () => {
  it('không dùng cache của tài khoản A cho tài khoản B', async () => {
    const endpoint = '/api/trips?case=cache-isolation';
    const tripA = createTrip('trip-a-cache');
    const tripB = createTrip('trip-b-cache');

    mockedApiRequest.mockImplementation((_input, options) => Promise.resolve(
      createApiResult(options?.userId === 'user-a-cache' ? tripA : tripB),
    ));

    setStoredUser(createUser('user-a-cache'));
    const firstHook = renderHook(() => useTripList({ endpoint }));

    await act(async () => {
      await firstHook.result.current.loadTrips();
    });

    expect(firstHook.result.current.trips).toEqual([tripA]);
    firstHook.unmount();

    setStoredUser(createUser('user-b-cache'));
    const secondHook = renderHook(() => useTripList({ endpoint }));

    expect(secondHook.result.current.trips).toEqual([]);
    expect(secondHook.result.current.status).toBe('idle');

    await act(async () => {
      await secondHook.result.current.loadTrips();
    });

    expect(secondHook.result.current.trips).toEqual([tripB]);
    expect(mockedApiRequest).toHaveBeenNthCalledWith(1, endpoint, { userId: 'user-a-cache' });
    expect(mockedApiRequest).toHaveBeenNthCalledWith(2, endpoint, { userId: 'user-b-cache' });
  });

  it('xóa danh sách đang hiển thị ngay khi chuyển từ A sang B chưa có cache', async () => {
    const endpoint = '/api/trips?case=identity-switch';
    const tripA = createTrip('trip-a-switch');
    mockedApiRequest.mockResolvedValue(createApiResult(tripA));
    setStoredUser(createUser('user-a-switch'));

    const { result } = renderHook(() => useTripList({ endpoint }));

    await act(async () => {
      await result.current.loadTrips();
    });

    expect(result.current.trips).toEqual([tripA]);

    act(() => {
      setStoredUser(createUser('user-b-switch'));
    });

    expect(result.current.trips).toEqual([]);
    expect(result.current.pagination).toBeNull();
    expect(result.current.status).toBe('idle');
  });

  it('không cho phản hồi cũ của A ghi đè dữ liệu B', async () => {
    const endpoint = '/api/trips?case=stale-response';
    const tripA = createTrip('trip-a-race');
    const tripB = createTrip('trip-b-race');
    const requestA = createDeferred<ApiResult>();
    const requestB = createDeferred<ApiResult>();

    mockedApiRequest.mockImplementation((_input, options) => {
      return options?.userId === 'user-a-race' ? requestA.promise : requestB.promise;
    });

    setStoredUser(createUser('user-a-race'));
    const { result } = renderHook(() => useTripList({ endpoint }));
    let loadA!: Promise<void>;
    let loadB!: Promise<void>;

    act(() => {
      loadA = result.current.loadTrips();
    });

    act(() => {
      setStoredUser(createUser('user-b-race'));
    });

    act(() => {
      loadB = result.current.loadTrips();
    });

    await act(async () => {
      requestB.resolve(createApiResult(tripB));
      await loadB;
    });

    expect(result.current.trips).toEqual([tripB]);

    await act(async () => {
      requestA.resolve(createApiResult(tripA));
      await loadA;
    });

    expect(result.current.trips).toEqual([tripB]);
    expect(result.current.status).toBe('success');
  });
});
