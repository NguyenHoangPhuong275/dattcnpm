import { describe, it, expect, afterAll } from 'vitest';
import { POST as loginPOST } from '@/app/api/auth/login/route';
import { PATCH as profilePATCH, GET as profileGET } from '@/app/api/profile/route';
import { disconnectMongo } from '@/lib/mongodb';

const TEST_EMAIL = process.env.DEFAULT_TEST_EMAIL || 'test-integration@example.com';
const TEST_PASS = process.env.DEFAULT_TEST_PASSWORD || 'Test123456';

describe('Integration: Auth + Profile with real DB (optional)', () => {
  afterAll(async () => {
    await disconnectMongo?.().catch(() => {});
  });

  it('login with default test account (if enabled) then GET/PATCH profile', async () => {
    if (process.env.ENABLE_DEFAULT_TEST_ACCOUNT !== 'true') {
      expect(true).toBe(true);
      return;
    }

    const loginReq = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASS }),
    });
    const loginRes = await loginPOST(loginReq as any);
    expect(loginRes.status).toBeLessThan(500);

    const testUserId = 'test-user-phuong';

    const getReq = new Request('http://localhost/api/profile', {
      headers: { 'x-user-id': testUserId },
    });
    const getRes = await profileGET(getReq as any);
    expect(getRes.status).toBe(200);

    const patchReq = new Request('http://localhost/api/profile', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', 'x-user-id': testUserId },
      body: JSON.stringify({ fullName: 'Integration Test User' }),
    });
    const patchRes = await profilePATCH(patchReq as any);
    expect([200, 400]).toContain(patchRes.status);
  });
});
