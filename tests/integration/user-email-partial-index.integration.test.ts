import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { getDb, disconnectMongo } from '@/lib/db';
import { User } from '@/lib/db/models/user.model';

const createdEmails = new Set<string>();

function newEmail(): string {
  const email = `softdelete-reuse-${randomUUID()}@example.com`;
  createdEmails.add(email);
  return email;
}

function mkUser(email: string, over: Record<string, unknown> = {}) {
  return { email, passwordHash: 'x', fullName: 'Người Dùng', deletedAt: null, ...over };
}

describe('User email partial unique index (đăng ký lại sau soft-delete)', () => {
  beforeAll(async () => {
    await getDb();
    await User.syncIndexes();
  });

  afterEach(async () => {
    if (createdEmails.size > 0) {
      await User.deleteMany({ email: { $in: [...createdEmails] } });
      createdEmails.clear();
    }
  });

  afterAll(async () => {
    await disconnectMongo?.().catch(() => {});
  });

  it('khai báo partial unique index trên email khi deletedAt = null', async () => {
    const indexes = await User.collection.indexes();
    const partial = indexes.find(
      (idx) => idx.unique && idx.key && (idx.key as Record<string, unknown>).email === 1 && idx.partialFilterExpression,
    );
    expect(partial).toBeTruthy();
    expect(partial!.partialFilterExpression).toMatchObject({ deletedAt: null });
  });

  it('chặn 2 tài khoản active trùng email (11000)', async () => {
    const email = newEmail();
    const db = await getDb();
    await db.users.insertOne(mkUser(email));
    await expect(db.users.insertOne(mkUser(email, { fullName: 'B' }))).rejects.toMatchObject({ code: 11000 });
  });

  it('không thể tạo 2 tài khoản active chỉ khác hoa/thường email', async () => {
    const email = newEmail();
    const db = await getDb();
    await db.users.insertOne(mkUser(email));
    await expect(db.users.insertOne(mkUser(email.toUpperCase(), { fullName: 'B' }))).rejects.toMatchObject({ code: 11000 });
  });

  it('cho phép đăng ký lại email sau khi tài khoản cũ bị soft-delete', async () => {
    const email = newEmail();
    const db = await getDb();
    const first = await db.users.insertOne(mkUser(email));
    await db.users.updateOne(String(first._id), { $set: { deletedAt: new Date() } });

    const second = await db.users.insertOne(mkUser(email, { fullName: 'B' }));
    expect(String(second._id)).not.toBe(String(first._id));

    await expect(db.users.insertOne(mkUser(email, { fullName: 'C' }))).rejects.toMatchObject({ code: 11000 });
  });
});
