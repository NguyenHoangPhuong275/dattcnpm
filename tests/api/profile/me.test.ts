import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getAuthUserFull: vi.fn(),
  getAvatar: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  getAuthUserFull: mocks.getAuthUserFull,
}));

vi.mock('@/lib/db', () => ({
  getAvatar: mocks.getAvatar,
}));

import { GET } from '@/app/api/profile/me/route';

const userId = '507f1f77bcf86cd799439011';

function request(): Request {
  return new Request('http://localhost/api/profile/me');
}

describe('GET /api/profile/me', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAuthUserFull.mockResolvedValue({
      _id: userId,
      id: userId,
      email: 'user@example.com',
      fullName: 'Người dùng',
      role: 'USER',
      tokenVersion: 0,
      avatarUrl: `redis:avatar:${userId}`,
    });
  });

  it('trả dữ liệu avatar thật thay vì marker Redis', async () => {
    const avatarUrl = 'data:image/png;base64,aGVsbG8=';
    mocks.getAvatar.mockResolvedValue(avatarUrl);

    const response = await GET(request() as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.avatarUrl).toBe(avatarUrl);
    expect(mocks.getAvatar).toHaveBeenCalledWith(userId);
  });

  it('không trả marker Redis khi cache avatar không khả dụng', async () => {
    mocks.getAvatar.mockRejectedValue(new Error('Redis unavailable'));

    const response = await GET(request() as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.avatarUrl).toBeNull();
  });
});
