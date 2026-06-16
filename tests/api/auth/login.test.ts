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

function loginRequest() {
  return new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }) as never;
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
});
