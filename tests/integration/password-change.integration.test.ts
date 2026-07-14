import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { hash } from 'bcryptjs';
import { decodeJwt } from 'jose';

import { getDb, disconnectMongo, getRedis } from '@/lib/db';
import { POST as passwordPOST } from '@/app/api/profile/password/route';
import { GET as profileMeGET } from '@/app/api/profile/me/route';
import { authCookieName, invalidateUserCache, signAuthToken, verifyAuthToken } from '@/lib/auth';

let userId = '';
let userEmail = '';
const blacklistKeys: string[] = [];
const rlKey = () => `rl:change-password:${userId}`;

beforeAll(async () => {
  const db = await getDb();
  const email = `pwd-change-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  userEmail = email;
  const user = await db.users.insertOne({
    email,
    passwordHash: await hash('correct-horse-battery', 10),
    fullName: 'Pwd Tester',
    role: 'USER',
    isLocked: false,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  });
  userId = String(user._id);
});

beforeEach(async () => {
  const db = await getDb();
  await db.users.updateOne(userId, {
    $set: {
      passwordHash: await hash('correct-horse-battery', 10),
      tokenVersion: 0,
      updatedAt: new Date(),
    },
  });
  await invalidateUserCache(userId);
  await getRedis().del(rlKey()).catch(() => {});
});

afterAll(async () => {
  const db = await getDb();
  await db.users.deleteMany({ _id: userId });
  await getRedis().del(rlKey(), ...blacklistKeys).catch(() => {});
  await disconnectMongo?.().catch(() => {});
});

function wrongPasswordReq() {
  return new Request('http://localhost/api/profile/password', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-user-id': userId },
    body: JSON.stringify({
      currentPassword: 'definitely-wrong',
      newPassword: 'brand-new-password-123',
      confirmPassword: 'brand-new-password-123',
    }),
  });
}

describe('Integration: đổi mật khẩu có rate limit', () => {
  it('cấp phiên mới dùng được ngay và vô hiệu hóa token cũ', async () => {
    const sessionUser = {
      id: userId,
      email: userEmail,
      fullName: 'Pwd Tester',
      role: 'USER' as const,
      tokenVersion: 0,
    };
    const oldToken = await signAuthToken(sessionUser, 3600);
    const otherOldToken = await signAuthToken(sessionUser, 3600);
    const oldJti = decodeJwt(oldToken).jti;
    if (typeof oldJti === 'string') blacklistKeys.push(`blacklist:${oldJti}`);
    const changeRequest = new Request('http://localhost/api/profile/password', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `${authCookieName}=${oldToken}`,
      },
      body: JSON.stringify({
        currentPassword: 'correct-horse-battery',
        newPassword: 'brand-new-password-123',
        confirmPassword: 'brand-new-password-123',
      }),
    });

    const changeResponse = await passwordPOST(changeRequest as never);
    expect(changeResponse.status).toBe(200);

    const setCookie = changeResponse.headers.get('set-cookie') ?? '';
    const newToken = setCookie.match(new RegExp(`${authCookieName}=([^;]+)`))?.[1];
    expect(newToken).toBeTruthy();
    expect(newToken).not.toBe(oldToken);
    expect((await verifyAuthToken(newToken!))?.tokenVersion).toBe(1);

    const currentSessionResponse = await profileMeGET(new Request('http://localhost/api/profile/me', {
      headers: { cookie: `${authCookieName}=${newToken}` },
    }) as never);
    expect(currentSessionResponse.status).toBe(200);

    const previousSessionResponse = await profileMeGET(new Request('http://localhost/api/profile/me', {
      headers: { cookie: `${authCookieName}=${oldToken}` },
    }) as never);
    expect(previousSessionResponse.status).toBe(401);

    const otherPreviousSessionResponse = await profileMeGET(new Request('http://localhost/api/profile/me', {
      headers: { cookie: `${authCookieName}=${otherOldToken}` },
    }) as never);
    expect(otherPreviousSessionResponse.status).toBe(401);
  });

  it('chặn brute-force currentPassword sau khi vượt ngưỡng', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 12; i++) {
      const res = await passwordPOST(wrongPasswordReq() as never);
      statuses.push(res.status);
    }

    expect(statuses.filter((s) => s === 401).length).toBeGreaterThan(0);
    expect(statuses).toContain(429);
  }, 30000);
});
