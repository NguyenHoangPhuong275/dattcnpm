import { describe, it, expect, afterAll, vi } from 'vitest';
import { PATCH as profilePATCH, GET as profileGET } from '@/app/api/profile/route';
import { disconnectMongo } from '@/lib/mongodb';


vi.mock('@/lib/mongodb', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/mongodb')>();
  return {
    ...actual,
    getUserById: vi.fn().mockImplementation(async (userId: string) => {
      if (userId === 'test-user-phuong') {
        return {
          _id: 'test-user-phuong',
          id: 'test-user-phuong',
          email: 'test@example.com',
          fullName: 'Nguyễn Hoàng Phương (Test)',
          role: 'USER',
          avatarUrl: null,
          isLocked: false,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any;
      }
      return actual.getUserById(userId);
    }),
    updateUserProfile: vi.fn().mockImplementation(async (userId: string, updates: any) => {
      if (userId === 'test-user-phuong') {
        return {
          _id: 'test-user-phuong',
          id: 'test-user-phuong',
          email: 'test@example.com',
          fullName: 'Nguyễn Hoàng Phương (Test)',
          role: 'USER',
          avatarUrl: null,
          isLocked: false,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...updates,
        } as any;
      }
      return actual.updateUserProfile(userId, updates);
    }),
  };
});

describe('Integration: Profile with mocked DB helpers', () => {
  afterAll(async () => {
    await disconnectMongo?.().catch(() => {});
  });

  it('GET/PATCH profile using mocked test user', async () => {
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
