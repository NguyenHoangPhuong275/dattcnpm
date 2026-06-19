import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { getDb, disconnectMongo, disconnectRedis, type User } from '@/lib/db';
import { User as UserModel } from '@/lib/db/models/user.model';
import { POST as webhookPOST } from '@/app/api/webhook/route';

const SECRET = 'test-webhook-secret-value';

// Email unique theo từng test → không đụng dữ liệu khi chạy lại.
const createdEmails = new Set<string>();
function newEmail(): string {
  const email = `webhook-softdelete-${randomUUID()}@example.com`;
  createdEmails.add(email);
  return email;
}

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-webhook-secret': SECRET },
    body: JSON.stringify(body),
  });
}

async function insertUser(email: string, deletedAt: Date | null): Promise<User> {
  const db = await getDb();
  return (await db.users.insertOne({
    email,
    passwordHash: 'x',
    fullName: 'U',
    role: 'USER',
    isLocked: false,
    emailVerified: true,
    deletedAt,
  })) as User;
}

describe('Webhook user lookup với soft-delete', () => {
  beforeAll(async () => {
    process.env.WEBHOOK_SECRET = SECRET;
    await getDb();
    // Đảm bảo partial unique index email (deletedAt:null) để 1 email có thể tồn tại đồng thời
    // 1 bản soft-deleted + 1 bản active.
    await UserModel.syncIndexes();
  });

  afterEach(async () => {
    delete process.env.WEBHOOK_IP_ALLOWLIST;
    if (createdEmails.size > 0) {
      const db = await getDb();
      await db.users.deleteMany({ email: { $in: [...createdEmails] } });
      createdEmails.clear();
    }
  });

  afterAll(async () => {
    await disconnectRedis().catch(() => {});
    await disconnectMongo?.().catch(() => {});
  });

  it('user.lock nhắm đúng user active, không đụng user đã soft-delete cùng email', async () => {
    const email = newEmail();
    const deleted = await insertUser(email, new Date('2025-01-01'));
    const active = await insertUser(email, null);

    const res = await webhookPOST(makeRequest({ event: 'user.lock', data: { email } }) as never);
    expect(res.status).toBe(200);

    const db = await getDb();
    const activeAfter = await db.users.findById(String(active._id));
    const deletedAfter = await db.users.findById(String(deleted._id));
    expect(activeAfter!.isLocked).toBe(true);   // user active bị khóa
    expect(deletedAfter!.isLocked).toBe(false); // user soft-deleted KHÔNG bị đụng
  });

  it('user.delete (soft) nhắm đúng user active', async () => {
    const email = newEmail();
    const deleted = await insertUser(email, new Date('2025-01-01'));
    const active = await insertUser(email, null);

    const res = await webhookPOST(makeRequest({ event: 'user.delete', data: { email } }) as never);
    expect(res.status).toBe(200);

    const db = await getDb();
    const activeAfter = await db.users.findById(String(active._id));
    const deletedAfter = await db.users.findById(String(deleted._id));
    expect(activeAfter!.deletedAt).toBeTruthy(); // user active vừa bị soft-delete
    // user soft-deleted cũ giữ nguyên mốc thời gian xóa ban đầu (không bị ghi đè).
    expect(new Date(deletedAfter!.deletedAt as Date).getTime()).toBe(new Date('2025-01-01').getTime());
  });

  it('chỉ còn user soft-deleted → webhook không tìm thấy (404)', async () => {
    const email = newEmail();
    await insertUser(email, new Date('2025-01-01'));

    const res = await webhookPOST(makeRequest({ event: 'user.lock', data: { email } }) as never);
    expect(res.status).toBe(404);
  });

  it('normalize email (hoa/thường, khoảng trắng) vẫn nhắm đúng user active', async () => {
    const email = newEmail();
    const active = await insertUser(email, null);

    const res = await webhookPOST(makeRequest({ event: 'user.lock', data: { email: `  ${email.toUpperCase()}  ` } }) as never);
    expect(res.status).toBe(200);

    const db = await getDb();
    const activeAfter = await db.users.findById(String(active._id));
    expect(activeAfter!.isLocked).toBe(true);
  });
});
