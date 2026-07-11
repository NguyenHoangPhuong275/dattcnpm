import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { getDb, disconnectMongo, getRedis } from '@/lib/db';

// DB test trên Atlas có độ trễ dao động — timeout 5s mặc định gây flaky.
vi.setConfig({ testTimeout: 30_000 });
import { POST as reportPOST } from '@/app/api/reviews/[id]/report/route';
import { GET as adminReportsGET } from '@/app/api/admin/reviews/reports/route';
import { PATCH as adminReportPATCH } from '@/app/api/admin/reviews/reports/[id]/route';

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

describe('Chức năng báo cáo đánh giá vi phạm', () => {
  beforeEach(async () => {
    const db = await getDb();
    await db.reviewReports.deleteMany({ reportedBy: REPORTER });
    await db.reviews.deleteMany({ userId: AUTHOR });
    // Xóa rate limit tích lũy giữa các lần chạy test (Redis dùng chung)
    await getRedis().del(
      `rl:report-review:${REPORTER}`,
      `rl:report-review:${AUTHOR}`,
      `rl:resolve-review-report:${ADMIN}`,
    ).catch(() => {});
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

  function patchReq(userId: string | null, reportId: string, body?: unknown) {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (userId) headers['x-user-id'] = userId;
    return new Request(`http://localhost/api/admin/reviews/reports/${reportId}`, {
      method: 'PATCH',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async function createPendingReport(): Promise<string> {
    const reviewId = await createReview(AUTHOR);
    await reportPOST(req(REPORTER, { reason: 'spam' }) as never, ctx(reviewId) as never);
    const db = await getDb();
    const report = await db.reviewReports.findOne({ reportedBy: REPORTER, status: 'pending' });
    return String(report!._id);
  }

  it('admin đánh dấu report đã xử lý → 200, trạng thái resolved', async () => {
    const reportId = await createPendingReport();
    const res = await adminReportPATCH(patchReq(ADMIN, reportId, { status: 'resolved' }) as never, ctx(reportId) as never);
    expect(res.status).toBe(200);

    const db = await getDb();
    const updated = await db.reviewReports.findById(reportId);
    expect(updated?.status).toBe('resolved');
  }, 30_000);

  it('admin bỏ qua report → 200, trạng thái dismissed; xử lý lại → 409', async () => {
    const reportId = await createPendingReport();
    const first = await adminReportPATCH(patchReq(ADMIN, reportId, { status: 'dismissed' }) as never, ctx(reportId) as never);
    expect(first.status).toBe(200);

    const second = await adminReportPATCH(patchReq(ADMIN, reportId, { status: 'resolved' }) as never, ctx(reportId) as never);
    expect(second.status).toBe(409);
  }, 30_000);

  it('non-admin PATCH report → 403; status không hợp lệ → 400; report không tồn tại → 404', async () => {
    // 403 và 400 bị chặn trước khi chạm DB nên dùng id hợp lệ bất kỳ, không cần tạo report thật.
    const anyId = '507f1f77bcf86cd7994390aa';

    const forbidden = await adminReportPATCH(patchReq(REPORTER, anyId, { status: 'resolved' }) as never, ctx(anyId) as never);
    expect(forbidden.status).toBe(403);

    const invalid = await adminReportPATCH(patchReq(ADMIN, anyId, { status: 'pending' }) as never, ctx(anyId) as never);
    expect(invalid.status).toBe(400);

    const missingId = '507f1f77bcf86cd7994390fe';
    const missing = await adminReportPATCH(patchReq(ADMIN, missingId, { status: 'resolved' }) as never, ctx(missingId) as never);
    expect(missing.status).toBe(404);
  }, 30_000);
});
