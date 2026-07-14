import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  compare: vi.fn(),
  hash: vi.fn(),
  findById: vi.fn(),
  findOneAndUpdate: vi.fn(),
  getAuthUserFull: vi.fn(),
  resolveAuthWithRefresh: vi.fn(),
  revokeAuthToken: vi.fn(),
  invalidateUserCache: vi.fn(),
  signAuthToken: vi.fn(),
  setAuthCookie: vi.fn(),
  checkRateLimit: vi.fn(),
}));

vi.mock('bcryptjs', () => ({
  compare: mocks.compare,
  hash: mocks.hash,
}));

vi.mock('@/lib/db', () => ({
  getDb: vi.fn().mockResolvedValue({
    users: {
      findById: mocks.findById,
      findOneAndUpdate: mocks.findOneAndUpdate,
    },
  }),
}));

vi.mock('@/lib/auth', () => ({
  getAuthMaxAge: vi.fn(() => 604800),
  getAuthUserFull: mocks.getAuthUserFull,
  invalidateUserCache: mocks.invalidateUserCache,
  resolveAuthWithRefresh: mocks.resolveAuthWithRefresh,
  revokeAuthToken: mocks.revokeAuthToken,
  setAuthCookie: mocks.setAuthCookie,
  signAuthToken: mocks.signAuthToken,
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: mocks.checkRateLimit,
}));

import { POST } from '@/app/api/profile/password/route';

const userId = '507f1f77bcf86cd799439011';
const currentUser = {
  _id: userId,
  email: 'user@example.com',
  fullName: 'Nguyễn An',
  role: 'USER',
  tokenVersion: 0,
  passwordHash: 'old-password-hash',
  deletedAt: null,
};

function request(): Request {
  return new Request('http://localhost/api/profile/password', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      currentPassword: 'current-password',
      newPassword: 'new-password-123',
      confirmPassword: 'new-password-123',
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getAuthUserFull.mockResolvedValue(currentUser);
  mocks.resolveAuthWithRefresh.mockResolvedValue({ expSeconds: Math.floor(Date.now() / 1000) + 3600 });
  mocks.checkRateLimit.mockResolvedValue({ limited: false });
  mocks.findById.mockResolvedValue(currentUser);
  mocks.compare.mockResolvedValue(true);
  mocks.hash.mockResolvedValue('new-password-hash');
  mocks.signAuthToken.mockResolvedValue('new-token');
  mocks.revokeAuthToken.mockResolvedValue(undefined);
  mocks.invalidateUserCache.mockResolvedValue(undefined);
});

describe('POST /api/profile/password', () => {
  it('chỉ cho một cập nhật thắng khi hai request dùng cùng mật khẩu cũ', async () => {
    mocks.findOneAndUpdate
      .mockResolvedValueOnce({ ...currentUser, passwordHash: 'new-password-hash', tokenVersion: 1 })
      .mockResolvedValueOnce(null);

    const responses = await Promise.all([
      POST(request() as never),
      POST(request() as never),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
    expect(mocks.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: userId, passwordHash: 'old-password-hash', deletedAt: null },
      {
        $set: { passwordHash: 'new-password-hash', updatedAt: expect.any(Date) },
        $inc: { tokenVersion: 1 },
      },
    );
    expect(mocks.signAuthToken).toHaveBeenCalledTimes(1);
  });
});
