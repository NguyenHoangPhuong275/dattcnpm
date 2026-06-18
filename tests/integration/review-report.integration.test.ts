import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { getDb, disconnectMongo } from '@/lib/db';
import { POST as reportPOST } from '@/app/api/reviews/[id]/report/route';
import { GET as adminReportsGET } from '@/app/api/admin/reviews/reports/route';

const AUTHOR = '507f1f77bcf86cd799439071';
const REPORTER = '507f1f77bcf86cd799439072';
const ADMIN = '507f1f77bcf86cd799439073';

vi.mock('@/lib/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/db')>();
  const mk = (id: string, role: string) => ({ _id: id, id, email: `${id}@e.com`, fullName: 'U', role, isLocked: false, emailVerified: true, createdAt: new Date(), updatedAt: new Date() });
  return {
    ...actual,
    getUserById: vi.fn().mockImplementation(async (uid: string) => {
      if (uid === ADMIN) return mk(uid, 'ADMIN') as never;
      if (uid === AUTHOR || uid === REPORTER) return mk(uid, 'USER') as never;
      return actual.getUserById(uid);
    }),
  };
});

async function createReview(authorId: string) {
  const db = await getDb();
  const place = await db.places.insertOne({ name: 'P', type: 'custom', lat: 0, lng: 0, ratingAvg: 0, ratingCount: 0 });
  const review = await db.reviews.insertOne({ userId: authorId, placeId: String(place._id), rating: 1, comment: 'bad', deletedAt: null });
  return String(review._id);
}

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
function req(userId: string | null, body?: unknown, url = 'http://localhost/api/reviews/x/report') {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (userId) headers['x-user-id'] = userId;
  return new Request(url, { method: 'POST', headers, body: body ? JSON.stringify(body) : undefined });
}

describe('PROMPT 6 — Review Reporting', () => {
  beforeEach(async () => {
    const db = await getDb();
    await db.reviewReports.deleteMany({ reportedBy: REPORTER });
    await db.reviews.deleteMany({ userId: AUTHOR });
  });

  afterAll(async () => {
    const db = await getDb();
    await db.reviewReports.deleteMany({ reportedBy: REPORTER });
    await db.reviews.deleteMany({ userId: AUTHOR });
    await disconnectMongo?.().catch(() => {});
  });

  it('report thành công → 201', async () => {
    const reviewId = await createReview(AUTHOR);
    const res = await reportPOST(req(REPORTER, { reason: 'spam' }) as never, ctx(reviewId) as never);
    expect(res.status).toBe(201);
  });

  it('report trùng → 409', async () => {
    const reviewId = await createReview(AUTHOR);
    await reportPOST(req(REPORTER, { reason: 'spam' }) as never, ctx(reviewId) as never);
    const res = await reportPOST(req(REPORTER, { reason: 'fake' }) as never, ctx(reviewId) as never);
    expect(res.status).toBe(409);
  });

  it('report review của chính mình → 403', async () => {
    const reviewId = await createReview(AUTHOR);
    const res = await reportPOST(req(AUTHOR, { reason: 'spam' }) as never, ctx(reviewId) as never);
    expect(res.status).toBe(403);
  });

  it('reviewId không tồn tại → 404', async () => {
    const res = await reportPOST(req(REPORTER, { reason: 'spam' }) as never, ctx('507f1f77bcf86cd7994390ff') as never);
    expect(res.status).toBe(404);
  });

  it('reason không hợp lệ → 400', async () => {
    const reviewId = await createReview(AUTHOR);
    const res = await reportPOST(req(REPORTER, { reason: 'nonsense' }) as never, ctx(reviewId) as never);
    expect(res.status).toBe(400);
  });

  it('unauthenticated → 401', async () => {
    const reviewId = await createReview(AUTHOR);
    const res = await reportPOST(req(null, { reason: 'spam' }) as never, ctx(reviewId) as never);
    expect(res.status).toBe(401);
  });

  it('admin list reports → 200; non-admin → 403', async () => {
    const reviewId = await createReview(AUTHOR);
    await reportPOST(req(REPORTER, { reason: 'spam' }) as never, ctx(reviewId) as never);

    const adminReq = new Request('http://localhost/api/admin/reviews/reports', { headers: { 'x-user-id': ADMIN } });
    const adminRes = await adminReportsGET(adminReq as never);
    expect(adminRes.status).toBe(200);
    const body = await adminRes.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);

    const userReq = new Request('http://localhost/api/admin/reviews/reports', { headers: { 'x-user-id': REPORTER } });
    const userRes = await adminReportsGET(userReq as never);
    expect(userRes.status).toBe(403);
  });
});
