import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { getDb, disconnectMongo, disconnectRedis } from '@/lib/db';
import { PATCH } from '@/app/api/users/me/preferences/route';

const EMAIL = 'weather-prefs-test@example.com';

async function createUser(): Promise<string> {
  const db = await getDb();
  await db.users.deleteMany({ email: EMAIL });
  const user = await db.users.insertOne({
    email: EMAIL,
    passwordHash: 'x',
    fullName: 'Prefs Tester',
    role: 'USER',
    isLocked: false,
    emailVerified: true,
  });
  return String(user._id);
}

function req(userId: string | null, body: unknown) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (userId) headers['x-user-id'] = userId;
  return new Request('http://localhost/api/users/me/preferences', {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
}

describe('Task 2.2 — Weather alert threshold preferences', () => {
  let userId: string;

  beforeEach(async () => {
    userId = await createUser();
  });

  afterAll(async () => {
    const db = await getDb();
    await db.users.deleteMany({ email: EMAIL });
    await disconnectRedis?.().catch(() => {});
    await disconnectMongo?.().catch(() => {});
  });

  it('lưu được ngưỡng thời tiết hợp lệ và trả về trong response + persist', async () => {
    const res = await PATCH(
      req(userId, { weatherAlerts: { maxTemp: 38, minTemp: 8, maxRainProbability: 80, maxWindKmh: 50 } }) as never,
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.weatherAlerts).toMatchObject({ maxTemp: 38, minTemp: 8, maxRainProbability: 80, maxWindKmh: 50 });

    const db = await getDb();
    const persisted = await db.users.findById(userId);
    expect(persisted?.weatherAlerts?.maxTemp).toBe(38);
  });

  it('thiếu field → mặc định null (tương thích ngược)', async () => {
    const res = await PATCH(req(userId, { weatherAlerts: { maxTemp: 42 } }) as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.weatherAlerts.maxTemp).toBe(42);
    expect(json.data.weatherAlerts.minTemp ?? null).toBeNull();
  });

  it('ngưỡng vô lý (maxTemp <= minTemp) → 400', async () => {
    const res = await PATCH(req(userId, { weatherAlerts: { maxTemp: 10, minTemp: 20 } }) as never);
    expect(res.status).toBe(400);
  });

  it('ngưỡng ngoài khoảng (maxRainProbability > 100) → 400', async () => {
    const res = await PATCH(req(userId, { weatherAlerts: { maxRainProbability: 150 } }) as never);
    expect(res.status).toBe(400);
  });
});
