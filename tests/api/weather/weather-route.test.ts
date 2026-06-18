import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const cacheGet = vi.fn();
const cacheSet = vi.fn();

vi.mock('@/lib/db', () => ({
  cacheGet: (...args: unknown[]) => cacheGet(...args),
  cacheSet: (...args: unknown[]) => cacheSet(...args),
}));

import { GET } from '@/app/api/weather/route';

function req(query: string) {
  return new Request(`http://localhost/api/weather${query}`) as never;
}

const upstreamPayload = {
  current_weather: { temperature: 25, windspeed: 5, winddirection: 180, weathercode: 0, time: '2026-06-18T10:00' },
  daily: { time: ['2026-06-18'], weathercode: [0], precipitation_sum: [0] },
};

beforeEach(() => {
  cacheGet.mockReset();
  cacheSet.mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('GET /api/weather', () => {
  it('cache hit: trả dữ liệu cache, không gọi Open-Meteo', async () => {
    cacheGet.mockResolvedValue(JSON.stringify({ temperature: 30, description: 'Trời quang' }));
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const res = await GET(req('?lat=21.02&lng=105.85'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.cached).toBe(true);
    expect(json.data.available).toBe(true);
    expect(json.data.weather.temperature).toBe(30);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('cache miss: gọi Open-Meteo, trả dữ liệu và ghi cache với TTL 1800', async () => {
    cacheGet.mockResolvedValue(null);
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => upstreamPayload });
    vi.stubGlobal('fetch', fetchMock);

    const res = await GET(req('?lat=21.02&lng=105.85'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.cached).toBe(false);
    expect(json.data.available).toBe(true);
    expect(json.data.weather.temperature).toBe(25);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(cacheSet).toHaveBeenCalledTimes(1);
    expect(cacheSet.mock.calls[0][2]).toBe(1800);
  });

  it('fallback: upstream 5xx → trả mặc định an toàn, không ghi cache', async () => {
    cacheGet.mockResolvedValue(null);
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) });
    vi.stubGlobal('fetch', fetchMock);

    const res = await GET(req('?lat=21.02&lng=105.85'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.weather).toBeNull();
    expect(json.data.available).toBe(false);
    expect(cacheSet).not.toHaveBeenCalled();
  });

  it('fallback: timeout/network error → trả mặc định an toàn, không throw', async () => {
    cacheGet.mockResolvedValue(null);
    const fetchMock = vi.fn().mockRejectedValue(Object.assign(new Error('timeout'), { name: 'TimeoutError' }));
    vi.stubGlobal('fetch', fetchMock);

    const res = await GET(req('?lat=21.02&lng=105.85'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.weather).toBeNull();
    expect(json.data.available).toBe(false);
    expect(cacheSet).not.toHaveBeenCalled();
  });

  it('tham số lat/lng sai → 400', async () => {
    cacheGet.mockResolvedValue(null);
    vi.stubGlobal('fetch', vi.fn());

    const res = await GET(req('?lat=999&lng=105.85'));
    expect(res.status).toBe(400);
  });
});
