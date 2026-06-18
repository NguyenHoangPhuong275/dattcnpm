import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { getDb, disconnectMongo, getRedis } from '@/lib/db';
import { evaluateWeatherAlert } from '@/lib/weather-alerts';
import { GET as tripWeatherGET } from '@/app/api/trips/[id]/weather/route';
import { POST as cronPOST } from '@/app/api/cron/weather-alerts/route';

const OWNER = '507f1f77bcf86cd799439081';
const CRON_SECRET = 'test-cron-secret';

vi.mock('@/lib/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/db')>();
  return {
    ...actual,
    getUserById: vi.fn().mockImplementation(async (uid: string) => {
      if (uid === OWNER) return { _id: OWNER, id: OWNER, email: 'o@e.com', fullName: 'U', role: 'USER', isLocked: false, emailVerified: true, createdAt: new Date(), updatedAt: new Date() } as never;
      return actual.getUserById(uid);
    }),
  };
});

function startKey(offsetH: number) {
  return new Date(Date.now() + offsetH * 3600 * 1000).toISOString().slice(0, 10);
}

function mockFetchWith(dateKey: string, prob: number) {
  const payload = {
    daily: {
      time: [dateKey],
      weathercode: [80],
      precipitation_sum: [20],
      precipitation_probability_max: [prob],
      temperature_2m_max: [33],
      temperature_2m_min: [26],
    },
  };
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => payload }) as never));
}

function mockFetchOkFalse() {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({}) }) as never));
}

function mockFetchThrow() {
  vi.stubGlobal('fetch', vi.fn(async () => {
    throw new Error('weather service down');
  }));
}

let lat = 0;
let lng = 0;
async function createTripWithPlace(startOffsetH: number) {
  const db = await getDb();
  lat = 10 + Math.random();
  lng = 100 + Math.random();
  const place = await db.places.insertOne({ name: 'WP', type: 'custom', lat, lng, ratingAvg: 0, ratingCount: 0 });
  const start = new Date(Date.now() + startOffsetH * 3600 * 1000);
  const end = new Date(start.getTime() + 3 * 24 * 3600 * 1000);
  const trip = await db.trips.insertOne({ userId: OWNER, title: 'Weather Trip', destination: 'D', startDate: start, endDate: end, isPublic: false, collaborators: [] });
  const tripId = String(trip._id);
  await db.itineraryItems.insertOne({ tripId, placeId: String(place._id), day: 1, orderIndex: 0 });
  return tripId;
}

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const weatherCacheKey = () => `weather:fc:${lat.toFixed(4)}:${lng.toFixed(4)}`;

beforeAll(() => { process.env.CRON_SECRET = CRON_SECRET; });
beforeEach(async () => {
  const db = await getDb();
  const trips = await db.trips.find({ userId: OWNER });
  for (const t of trips) {
    await db.itineraryItems.deleteMany({ tripId: String(t._id) });
    await db.notifications.deleteMany({ userId: OWNER });
  }
  await db.trips.deleteMany({ userId: OWNER });
});

afterAll(async () => {
  vi.unstubAllGlobals();
  const db = await getDb();
  await db.trips.deleteMany({ userId: OWNER });
  await db.notifications.deleteMany({ userId: OWNER });
  await disconnectMongo?.().catch(() => {});
});

describe('PROMPT 10 — Weather Alert Notification', () => {
  it('unit: evaluateWeatherAlert', () => {
    expect(evaluateWeatherAlert({ date: 'x', weathercode: 3, precipitationMm: 0, precipitationProbability: 80, tempMax: 30, tempMin: 25 }).alert).toBe(true);
    expect(evaluateWeatherAlert({ date: 'x', weathercode: 95, precipitationMm: 0, precipitationProbability: 10, tempMax: 30, tempMin: 25 }).alert).toBe(true);
    expect(evaluateWeatherAlert({ date: 'x', weathercode: 1, precipitationMm: 0, precipitationProbability: 10, tempMax: 30, tempMin: 25 }).alert).toBe(false);
  });

  it('GET trip weather → forecast kèm cờ alert', async () => {
    const tripId = await createTripWithPlace(2);
    mockFetchWith(startKey(2), 90);
    const req = new Request('http://localhost/x', { headers: { 'x-user-id': OWNER } });
    const res = await tripWeatherGET(req as never, ctx(tripId) as never);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(body.data.forecast)).toBe(true);
    expect(body.data.forecast.some((d: { alert: boolean }) => d.alert)).toBe(true);

    const ttl = await getRedis().ttl(weatherCacheKey());
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(30 * 60);
  }, 20000);

  it('GET trip weather fetch ok:false fallback an toan', async () => {
    const tripId = await createTripWithPlace(2);
    mockFetchOkFalse();
    const req = new Request('http://localhost/x', { headers: { 'x-user-id': OWNER } });
    const res = await tripWeatherGET(req as never, ctx(tripId) as never);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.warning).toBe('weather unavailable');
    expect(body.data.forecast).toEqual([]);
  }, 20000);

  it('GET trip weather fetch throw fallback an toan', async () => {
    const tripId = await createTripWithPlace(2);
    mockFetchThrow();
    const req = new Request('http://localhost/x', { headers: { 'x-user-id': OWNER } });
    const res = await tripWeatherGET(req as never, ctx(tripId) as never);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.warning).toBe('weather unavailable');
    expect(body.data.forecast).toEqual([]);
  }, 20000);

  it('GET trip weather unauthenticated → 401', async () => {
    const tripId = await createTripWithPlace(2);
    const res = await tripWeatherGET(new Request('http://localhost/x') as never, ctx(tripId) as never);
    expect(res.status).toBe(401);
  });

  it('GET trip không tồn tại → 404', async () => {
    const req = new Request('http://localhost/x', { headers: { 'x-user-id': OWNER } });
    const res = await tripWeatherGET(req as never, ctx('507f1f77bcf86cd7994390cc') as never);
    expect(res.status).toBe(404);
  });

  it('cron: gửi alert một lần, dedup không gửi lại trong 24h', async () => {
    const tripId = await createTripWithPlace(2);
    const dateKey = startKey(2);
    mockFetchWith(dateKey, 90);
    await getRedis().del(`weather_alert_sent:${tripId}:${dateKey}`);

    const mkReq = () => new Request('http://localhost/api/cron/weather-alerts', { method: 'POST', headers: { 'x-cron-secret': CRON_SECRET } });
    const first = await cronPOST(mkReq() as never);
    const firstBody = await first.json();
    expect(first.status).toBe(200);
    expect(firstBody.data.alertsSent).toBeGreaterThanOrEqual(1);

    const db = await getDb();
    const notifs = await db.notifications.find({ userId: OWNER });
    expect(notifs.length).toBeGreaterThanOrEqual(1);

    const dedupTtl = await getRedis().ttl(`weather_alert_sent:${tripId}:${dateKey}`);
    expect(dedupTtl).toBeGreaterThan(0);
    expect(dedupTtl).toBeLessThanOrEqual(24 * 60 * 60);

    const second = await cronPOST(mkReq() as never);
    const secondBody = await second.json();
    expect(secondBody.data.alertsSent).toBe(0);

    await getRedis().del(`weather_alert_sent:${tripId}:${dateKey}`);
  }, 20000);

  it('cron: sai secret → 401', async () => {
    const res = await cronPOST(new Request('http://localhost/api/cron/weather-alerts', { method: 'POST', headers: { 'x-cron-secret': 'wrong' } }) as never);
    expect(res.status).toBe(401);
  });
});
