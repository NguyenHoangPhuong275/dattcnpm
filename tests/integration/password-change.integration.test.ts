import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { hash } from 'bcryptjs';
import { getDb, disconnectMongo, getRedis } from '@/lib/db';
import { POST as passwordPOST } from '@/app/api/profile/password/route';

let userId = '';
const rlKey = () => `rl:change-password:${userId}`;

beforeAll(async () => {
  const db = await getDb();
  const email = `pwd-change-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
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

afterAll(async () => {
  const db = await getDb();
  await db.users.deleteMany({ _id: userId });
  await getRedis().del(rlKey()).catch(() => {});
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
  it('chặn brute-force currentPassword sau khi vượt ngưỡng', async () => {
    await getRedis().del(rlKey()).catch(() => {});

    const statuses: number[] = [];
    for (let i = 0; i < 12; i++) {
      const res = await passwordPOST(wrongPasswordReq() as never);
      statuses.push(res.status);
    }

    expect(statuses.filter((s) => s === 401).length).toBeGreaterThan(0);
    expect(statuses).toContain(429);
  }, 30000);
});
