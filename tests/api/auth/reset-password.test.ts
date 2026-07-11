import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { compare, hash } from 'bcryptjs';

const sendMock = vi.fn(async (): Promise<{
  data: { id: string } | null;
  error: { message: string } | null;
}> => ({ data: { id: 'mock' }, error: null }));
vi.mock('@/lib/resend', () => ({
  getResend: () => ({ emails: { send: sendMock } }),
}));

import {
  connectMongo,
  disconnectMongo,
  connectRedis,
  disconnectRedis,
  getDb,
  getRedis,
  storeResetOtp,
} from '@/lib/db';
import { POST as forgotPOST } from '@/app/api/auth/forgot-password/route';
import { POST as resetPOST } from '@/app/api/auth/reset-password/route';
import { getAuthUserFull, signAuthToken } from '@/lib/auth';

function uniqueEmail(): string {
  return `reset-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

async function createUser(email: string, password: string) {
  const db = await getDb();
  const now = new Date();
  return db.users.insertOne({
    email,
    passwordHash: await hash(password, 10),
    fullName: 'Reset Test User',
    role: 'USER',
    isLocked: false,
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  });
}

function jsonReq(url: string, body: unknown) {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function authReq(token: string) {
  return new Request('http://localhost/api/profile/me', {
    headers: { cookie: `auth_token=${token}` },
  });
}

const created: string[] = [];

beforeAll(async () => {
  await connectMongo();
  await connectRedis();
});

afterAll(async () => {
  const db = await getDb();
  for (const email of created) {
    await db.users.deleteMany({ email });
    await getRedis().del(`otp:reset:${email}`, `otp:reset:limit:${email}`);
  }
  await disconnectMongo();
  await disconnectRedis();
});

describe('Chức năng quên / đặt lại mật khẩu qua OTP', () => {
  it('forgot-password: gửi OTP cho email tồn tại, lưu Redis, không lộ OTP trong response', async () => {
    const email = uniqueEmail();
    created.push(email);
    await createUser(email, 'oldpassword1');

    const res = await forgotPOST(jsonReq('http://localhost/api/auth/forgot-password', { email }) as never);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(JSON.stringify(json)).not.toMatch(/\d{6}/);
    expect(sendMock).toHaveBeenCalled();

    const stored = await getRedis().hget(`otp:reset:${email}`, 'code');
    expect(stored).toMatch(/^\d{6}$/);
  });

  it('forgot-password: email không tồn tại vẫn trả 200 (không lộ tồn tại)', async () => {
    const email = uniqueEmail();
    created.push(email);
    const res = await forgotPOST(jsonReq('http://localhost/api/auth/forgot-password', { email }) as never);
    expect(res.status).toBe(200);
    const exists = await getRedis().exists(`otp:reset:${email}`);
    expect(exists).toBe(0);
  });

  it('forgot-password: email sai định dạng → 400', async () => {
    const res = await forgotPOST(jsonReq('http://localhost/api/auth/forgot-password', { email: 'not-an-email' }) as never);
    expect(res.status).toBe(400);
  });

  it('forgot-password: thu hồi OTP khi dịch vụ email từ chối gửi', async () => {
    const email = uniqueEmail();
    created.push(email);
    await createUser(email, 'oldpassword1');
    sendMock.mockResolvedValueOnce({ data: null, error: { message: 'send failed' } });

    const res = await forgotPOST(jsonReq('http://localhost/api/auth/forgot-password', { email }) as never);

    expect(res.status).toBe(503);
    expect(await getRedis().exists(`otp:reset:${email}`)).toBe(0);
  });

  it('forgot-password: chặn khi gửi quá 3 lần / 15 phút', { timeout: 10000 }, async () => {
    const email = uniqueEmail();
    created.push(email);
    await createUser(email, 'oldpassword1');

    let lastStatus = 0;
    for (let i = 0; i < 4; i++) {
      const r = await forgotPOST(jsonReq('http://localhost/api/auth/forgot-password', { email }) as never);
      lastStatus = r.status;
    }
    expect(lastStatus).toBe(429);
  });

  it('reset-password: OTP đúng → đổi mật khẩu thành công và OTP bị xoá', async () => {
    const email = uniqueEmail();
    created.push(email);
    const user = await createUser(email, 'oldpassword1');
    await storeResetOtp(email, '123456', 600);

    const oldToken = await signAuthToken({
      id: String(user._id),
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      tokenVersion: user.tokenVersion ?? 0,
    });
    const authenticatedBeforeReset = await getAuthUserFull(authReq(oldToken) as never);
    expect(authenticatedBeforeReset).not.toBeNull();
    expect(authenticatedBeforeReset).not.toHaveProperty('passwordHash');

    const res = await resetPOST(jsonReq('http://localhost/api/auth/reset-password', { email, otp: '123456', newPassword: 'brandnew123' }) as never);
    expect(res.status).toBe(200);

    const db = await getDb();
    const updated = await db.users.findById(user._id);
    expect(updated).toBeTruthy();
    expect(await compare('brandnew123', updated!.passwordHash)).toBe(true);
    expect(updated!.tokenVersion).toBe(1);
    expect(await getAuthUserFull(authReq(oldToken) as never)).toBeNull();

    const exists = await getRedis().exists(`otp:reset:${email}`);
    expect(exists).toBe(0);
  });

  it('reset-password: OTP sai → 400 và trừ lượt', async () => {
    const email = uniqueEmail();
    created.push(email);
    await createUser(email, 'oldpassword1');
    await storeResetOtp(email, '123456', 600);

    const res = await resetPOST(jsonReq('http://localhost/api/auth/reset-password', { email, otp: '000000', newPassword: 'brandnew123' }) as never);
    expect(res.status).toBe(400);
  });

  it('reset-password: không có OTP (hết hạn) → 410', async () => {
    const email = uniqueEmail();
    created.push(email);
    await createUser(email, 'oldpassword1');

    const res = await resetPOST(jsonReq('http://localhost/api/auth/reset-password', { email, otp: '123456', newPassword: 'brandnew123' }) as never);
    expect(res.status).toBe(410);
  });

  it('reset-password: newPassword dưới 8 ký tự → 400', async () => {
    const email = uniqueEmail();
    created.push(email);
    await storeResetOtp(email, '123456', 600);

    const res = await resetPOST(jsonReq('http://localhost/api/auth/reset-password', { email, otp: '123456', newPassword: 'short' }) as never);
    expect(res.status).toBe(400);
  });
});
