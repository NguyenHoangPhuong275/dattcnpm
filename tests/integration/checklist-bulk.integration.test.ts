import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, vi } from 'vitest';
import { Types } from 'mongoose';
import * as db from '@/lib/db';
import { TripChecklist } from '@/lib/db/models/supporting.model';
import { POST as bulkPOST } from '@/app/api/trips/[id]/checklist/bulk/route';
import { getChecklistTemplate } from '@/data/checklist-templates';

const testUserIds = new Set<string>();

function newUserId(): string {
  const id = new Types.ObjectId().toString();
  testUserIds.add(id);
  return id;
}

async function createTrip(ownerId: string) {
  const database = await db.getDb();
  const trip = await database.trips.insertOne({
    userId: ownerId,
    title: 'Trip checklist bulk test',
    destination: 'Đà Lạt',
    startDate: new Date('2026-11-01'),
    endDate: new Date('2026-11-03'),
    isPublic: false,
  });
  return String(trip._id);
}

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

function req(userId: string | null, body?: unknown) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (userId) headers['x-user-id'] = userId;
  return new Request('http://localhost/api/trips/x/checklist/bulk', {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('Chức năng thêm checklist hàng loạt theo mẫu', () => {
  beforeAll(async () => {
    await db.getDb();
    await TripChecklist.syncIndexes();
  });

  beforeEach(() => {
    vi.spyOn(db, 'getUserById').mockImplementation(async (userId: string) => {
      if (testUserIds.has(userId)) {
        return {
          _id: userId, id: userId, email: `${userId}@example.com`, fullName: 'U', role: 'USER',
          isLocked: false, emailVerified: true, createdAt: new Date(), updatedAt: new Date(),
        } as never;
      }
      return null;
    });
  });

  afterEach(async () => {
    const database = await db.getDb();
    for (const owner of testUserIds) {
      const trips = await database.trips.find({ userId: owner });
      for (const t of trips) await database.tripChecklists.deleteMany({ tripId: String(t._id) });
      await database.trips.deleteMany({ userId: owner });
    }
    testUserIds.clear();
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await db.disconnectMongo?.().catch(() => {});
  });

  it('thêm hàng loạt từ template, đúng số lượng', async () => {
    const owner = newUserId();
    const tripId = await createTrip(owner);
    const template = getChecklistTemplate('beach')!;

    const res = await bulkPOST(req(owner, { templateId: 'beach' }) as never, ctx(tripId) as never);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.added).toBe(template.items.length);
    expect(json.data.skipped).toBe(0);

    const database = await db.getDb();
    const items = await database.tripChecklists.find({ tripId });
    expect(items.length).toBe(template.items.length);
  });

  it('khử trùng lặp: chạy lần 2 cùng template → bỏ qua tất cả', async () => {
    const owner = newUserId();
    const tripId = await createTrip(owner);
    await bulkPOST(req(owner, { templateId: 'beach' }) as never, ctx(tripId) as never);
    const res2 = await bulkPOST(req(owner, { templateId: 'beach' }) as never, ctx(tripId) as never);
    const json2 = await res2.json();
    expect(json2.data.added).toBe(0);
    expect(json2.data.skipped).toBeGreaterThan(0);
  });

  it('nhận danh sách items tùy ý và khử trùng trong batch', async () => {
    const owner = newUserId();
    const tripId = await createTrip(owner);
    const res = await bulkPOST(
      req(owner, { items: ['Hộ chiếu', 'hộ chiếu', '  Vé máy bay  ', 'Vé máy bay'] }) as never,
      ctx(tripId) as never,
    );
    const json = await res.json();
    expect(json.data.added).toBe(2);
  });

  it('template không hợp lệ → 400', async () => {
    const owner = newUserId();
    const tripId = await createTrip(owner);
    const res = await bulkPOST(req(owner, { templateId: 'khong-ton-tai' }) as never, ctx(tripId) as never);
    expect(res.status).toBe(400);
  });

  it('input rỗng (không templateId, không items) → 400', async () => {
    const owner = newUserId();
    const tripId = await createTrip(owner);
    const res = await bulkPOST(req(owner, {}) as never, ctx(tripId) as never);
    expect(res.status).toBe(400);
  });

  it('người không có quyền edit → 403/404', async () => {
    const owner = newUserId();
    const other = newUserId();
    const tripId = await createTrip(owner);
    const res = await bulkPOST(req(other, { templateId: 'beach' }) as never, ctx(tripId) as never);
    expect([403, 404]).toContain(res.status);
  });

  it('chưa đăng nhập → 401', async () => {
    const owner = newUserId();
    const tripId = await createTrip(owner);
    const res = await bulkPOST(req(null, { templateId: 'beach' }) as never, ctx(tripId) as never);
    expect(res.status).toBe(401);
  });

  it('có compound unique index { tripId, label } với collation case-insensitive', async () => {
    const indexes = await TripChecklist.collection.indexes();
    const found = indexes.find(
      (idx) =>
        idx.unique &&
        idx.key &&
        (idx.key as Record<string, unknown>).tripId === 1 &&
        (idx.key as Record<string, unknown>).label === 1,
    );
    expect(found).toBeTruthy();
    expect((found as { collation?: { strength?: number } }).collation?.strength).toBe(2);
  });

  it('lỗi duplicate key (11000) khi insert → 409 thay vì 500', async () => {
    const owner = newUserId();
    const tripId = await createTrip(owner);
    const database = await db.getDb();
    vi.spyOn(database.tripChecklists, 'insertMany').mockRejectedValueOnce(
      Object.assign(new Error('E11000 duplicate key'), { code: 11000 }),
    );
    const res = await bulkPOST(req(owner, { items: ['Vé tàu hỏa'] }) as never, ctx(tripId) as never);
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error.code).toBe('CONFLICT');
  });

  it('race condition: 2 bulk-add đồng thời không tạo item trùng nhãn trong DB', async () => {
    const owner = newUserId();
    const tripId = await createTrip(owner);
    const items = ['Sạc dự phòng', 'Ô dù', 'Kem chống nắng'];
    const [r1, r2] = await Promise.all([
      bulkPOST(req(owner, { items }) as never, ctx(tripId) as never),
      bulkPOST(req(owner, { items }) as never, ctx(tripId) as never),
    ]);
    expect([200, 201, 409]).toContain(r1.status);
    expect([200, 201, 409]).toContain(r2.status);

    const database = await db.getDb();
    const stored = await database.tripChecklists.find({ tripId });
    const labels = stored.map((i) => i.label);
    expect(new Set(labels).size).toBe(labels.length);
    expect(labels.length).toBe(items.length);
  });

  it('chặn duplicate khác hoa/thường — gửi tuần tự (dedup tầng app)', async () => {
    const owner = newUserId();
    const tripId = await createTrip(owner);
    await bulkPOST(req(owner, { items: ['Vé máy bay'] }) as never, ctx(tripId) as never);
    const res2 = await bulkPOST(req(owner, { items: ['vé máy bay'] }) as never, ctx(tripId) as never);
    const json2 = await res2.json();
    expect(json2.data.added).toBe(0);

    const database = await db.getDb();
    const stored = await database.tripChecklists.find({ tripId });
    expect(stored.length).toBe(1);
  });

  it('chặn duplicate khác hoa/thường — gửi đồng thời Promise.all (collation DB)', async () => {
    const owner = newUserId();
    const tripId = await createTrip(owner);
    const [r1, r2] = await Promise.all([
      bulkPOST(req(owner, { items: ['Vé máy bay'] }) as never, ctx(tripId) as never),
      bulkPOST(req(owner, { items: ['vé máy bay'] }) as never, ctx(tripId) as never),
    ]);
    expect([200, 201, 409]).toContain(r1.status);
    expect([200, 201, 409]).toContain(r2.status);

    const database = await db.getDb();
    const stored = await database.tripChecklists.find({ tripId });
    expect(stored.length).toBe(1);
  });

  it('chặn duplicate khác dạng Unicode NFC/NFD — gửi tuần tự (dedup tầng app NFC)', async () => {
    const owner = newUserId();
    const tripId = await createTrip(owner);
    const nfc = 'Vẽ tranh'.normalize('NFC');
    const nfd = 'Vẽ tranh'.normalize('NFD');
    expect(nfc).not.toBe(nfd);

    await bulkPOST(req(owner, { items: [nfc] }) as never, ctx(tripId) as never);
    const res2 = await bulkPOST(req(owner, { items: [nfd] }) as never, ctx(tripId) as never);
    const json2 = await res2.json();
    expect(json2.data.added).toBe(0);

    const database = await db.getDb();
    const stored = await database.tripChecklists.find({ tripId });
    expect(stored.length).toBe(1);
  });

  it('chặn duplicate khác dạng Unicode NFC/NFD — gửi đồng thời Promise.all (collation normalization)', async () => {
    const owner = newUserId();
    const tripId = await createTrip(owner);
    const nfc = 'Đặt phòng'.normalize('NFC');
    const nfd = 'Đặt phòng'.normalize('NFD');
    expect(nfc).not.toBe(nfd);

    const [r1, r2] = await Promise.all([
      bulkPOST(req(owner, { items: [nfc] }) as never, ctx(tripId) as never),
      bulkPOST(req(owner, { items: [nfd] }) as never, ctx(tripId) as never),
    ]);
    expect([200, 201, 409]).toContain(r1.status);
    expect([200, 201, 409]).toContain(r2.status);

    const database = await db.getDb();
    const stored = await database.tripChecklists.find({ tripId });
    expect(stored.length).toBe(1);
  });
});
