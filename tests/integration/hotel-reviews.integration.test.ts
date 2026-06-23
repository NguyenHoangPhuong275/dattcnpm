import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb, disconnectMongo, disconnectRedis } from '@/lib/db';
import { GET as reviewsGET, POST as reviewsPOST } from '@/app/api/hotels/[id]/reviews/route';
import { DELETE as reviewsDELETE } from '@/app/api/hotels/[id]/reviews/[reviewId]/route';

const SOURCE = 'test-hotel-review';

let hotelId = '';
let userA = '';
let userB = '';

function ctx(id: string, reviewId?: string) {
  return { params: Promise.resolve(reviewId ? { id, reviewId } : { id }) } as never;
}

function postReq(id: string, userId: string, body: unknown) {
  return new Request(`http://localhost/api/hotels/${id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    body: JSON.stringify(body),
  }) as never;
}

function getReq(id: string, userId?: string) {
  const headers: Record<string, string> = {};
  if (userId) headers['x-user-id'] = userId;
  return new Request(`http://localhost/api/hotels/${id}/reviews`, { headers }) as never;
}

function delReq(id: string, reviewId: string, userId: string) {
  return new Request(`http://localhost/api/hotels/${id}/reviews/${reviewId}`, {
    method: 'DELETE',
    headers: { 'x-user-id': userId },
  }) as never;
}

beforeAll(async () => {
  const db = await getDb();
  await db.hotels.deleteMany({ source: SOURCE });
  const hotel = await db.hotels.insertOne({ name: 'KS Test Review', province: 'Đà Nẵng', provinceKey: 'da nang', source: SOURCE });
  hotelId = String(hotel._id);

  const a = await db.users.insertOne({ email: `rev-a-${Date.now()}@test.local`, passwordHash: 'x', fullName: 'Người Dùng A' });
  const b = await db.users.insertOne({ email: `rev-b-${Date.now()}@test.local`, passwordHash: 'x', fullName: 'Người Dùng B' });
  userA = String(a._id);
  userB = String(b._id);
});

afterAll(async () => {
  const db = await getDb();
  await db.hotels.deleteMany({ source: SOURCE });
  await db.hotelReviews.deleteMany({ hotelId });
  await db.users.deleteOne(userA);
  await db.users.deleteOne(userB);
  await disconnectMongo?.().catch(() => {});
  await disconnectRedis().catch(() => {});
});

describe('Hotel reviews API', () => {
  it('POST tạo đánh giá thật và GET tổng hợp + phân bố sao', async () => {
    const r1 = await reviewsPOST(postReq(hotelId, userA, { rating: 5, comment: 'Rất tốt' }), ctx(hotelId));
    expect(r1.status).toBe(201);

    const r2 = await reviewsPOST(postReq(hotelId, userB, { rating: 3, comment: 'Ổn' }), ctx(hotelId));
    expect(r2.status).toBe(201);

    const res = await reviewsGET(getReq(hotelId, userA), ctx(hotelId));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.count).toBe(2);
    expect(body.data.average).toBe(4);
    expect(body.data.distribution['5']).toBe(1);
    expect(body.data.distribution['3']).toBe(1);
    expect(body.data.mine.rating).toBe(5);
    expect(body.data.items.some((i: { author: string }) => i.author === 'Người Dùng A')).toBe(true);
  });

  it('khách vãng lai (không đăng nhập) vẫn GET được review, mine=null', async () => {
    const res = await reviewsGET(getReq(hotelId), ctx(hotelId));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.count).toBeGreaterThanOrEqual(1);
    expect(body.data.mine).toBe(null);
    expect(body.data.items.every((i: { isMine: boolean }) => i.isMine === false)).toBe(true);
  });

  it('POST lần nữa cùng user thì cập nhật, không tạo trùng', async () => {
    const res0 = await reviewsPOST(postReq(hotelId, userA, { rating: 2, comment: 'Đổi ý' }), ctx(hotelId));
    expect(res0.status).toBe(200);

    const res = await reviewsGET(getReq(hotelId, userA), ctx(hotelId));
    const body = await res.json();
    expect(body.data.count).toBe(2);
    expect(body.data.mine.rating).toBe(2);
  });

  it('DELETE chỉ xoá được đánh giá của mình', async () => {
    const list = await (await reviewsGET(getReq(hotelId, userA), ctx(hotelId))).json();
    const mine = list.data.mine;

    const forbidden = await reviewsDELETE(delReq(hotelId, mine.id, userB), ctx(hotelId, mine.id));
    expect(forbidden.status).toBe(403);

    const ok = await reviewsDELETE(delReq(hotelId, mine.id, userA), ctx(hotelId, mine.id));
    expect(ok.status).toBe(200);

    const after = await (await reviewsGET(getReq(hotelId, userA), ctx(hotelId))).json();
    expect(after.data.count).toBe(1);
    expect(after.data.mine).toBe(null);
  });
});
