import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { hash } from 'bcryptjs';
import { POST as loginPOST } from '@/app/api/auth/login/route';
import { getDb, disconnectMongo, disconnectRedis } from '@/lib/db';

const email = `softdel-${Date.now()}@example.com`;
const password = 'secret123';
let userId: string;

beforeAll(async () => {
  const db = await getDb();
  const passwordHash = await hash(password, 4);
  const created = await db.users.insertOne({
    email,
    passwordHash,
    fullName: 'Soft Del',
    avatarUrl: null,
    role: 'USER',
    isLocked: false,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: new Date(),
  });
  userId = String(created._id);
});

afterAll(async () => {
  try {
    const db = await getDb();
    await db.users.deleteOne(userId);
  } catch {
  }
  await disconnectMongo?.().catch(() => {});
  await disconnectRedis().catch(() => {});
});

function loginRequest(extra?: Record<string, unknown>) {
  return new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password, ...extra }),
  }) as never;
}

const SEVEN_DAYS = 60 * 60 * 24 * 7;
const THIRTY_DAYS = 60 * 60 * 24 * 30;

function getMaxAge(cookie: string | null): number | null {
  const match = cookie?.match(/Max-Age=(\d+)/i);
  return match ? Number(match[1]) : null;
}

describe('POST /api/auth/login — soft-delete & response shape', () => {
  it('từ chối đăng nhập với user đã soft-delete (401)', async () => {
    const res = await loginPOST(loginRequest());
    expect(res.status).toBe(401);
  });

  it('cho phép đăng nhập sau khi khôi phục và trả đúng contract sendSuccess', async () => {
    const db = await getDb();
    await db.users.updateOne(userId, { deletedAt: null });

    const res = await loginPOST(loginRequest());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.error).toBeNull();
    expect(body.data?.user?.email).toBe(email);
  });

  it('không có rememberMe → cookie dùng maxAge mặc định (7 ngày) và giữ cờ bảo mật', async () => {
    const db = await getDb();
    await db.users.updateOne(userId, { deletedAt: null });

    const res = await loginPOST(loginRequest());
    expect(res.status).toBe(200);

    const cookie = res.headers.get('set-cookie');
    expect(cookie).toContain('auth_token=');
    expect(getMaxAge(cookie)).toBe(SEVEN_DAYS);
    expect(cookie?.toLowerCase()).toContain('httponly');
    expect(cookie?.toLowerCase()).toContain('samesite=lax');
  });

  it('rememberMe=true → cookie dùng maxAge 30 ngày', async () => {
    const db = await getDb();
    await db.users.updateOne(userId, { deletedAt: null });

    const res = await loginPOST(loginRequest({ rememberMe: true }));
    expect(res.status).toBe(200);
    expect(getMaxAge(res.headers.get('set-cookie'))).toBe(THIRTY_DAYS);
  });

  it('payload cũ không có rememberMe vẫn hợp lệ (backward compatible)', async () => {
    const db = await getDb();
    await db.users.updateOne(userId, { deletedAt: null });

    const res = await loginPOST(loginRequest());
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });
});
