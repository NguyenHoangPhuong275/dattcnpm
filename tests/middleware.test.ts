import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  hasAdminSession: vi.fn(),
  resolveAuthWithRefresh: vi.fn(),
  setAuthCookie: vi.fn(),
}));

vi.mock('@/lib/admin-auth', () => ({
  hasAdminSession: mocks.hasAdminSession,
}));

vi.mock('@/lib/auth', () => ({
  resolveAuthWithRefresh: mocks.resolveAuthWithRefresh,
  setAuthCookie: mocks.setAuthCookie,
}));

import { middleware } from '../middleware';

describe('middleware admin routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hasAdminSession.mockResolvedValue(false);
    mocks.resolveAuthWithRefresh.mockResolvedValue(null);
  });

  it('cho phép mở trang đăng nhập quản trị khi chưa có phiên', async () => {
    const response = await middleware(new NextRequest('http://localhost/admin/login'));

    expect(response.status).toBe(200);
    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(mocks.resolveAuthWithRefresh).not.toHaveBeenCalled();
  });

  it('chuyển trang quản trị được bảo vệ đến đúng màn hình đăng nhập', async () => {
    const response = await middleware(new NextRequest('http://localhost/admin?from=legacy'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/admin/login');
  });

  it('cho phép phiên quản trị hợp lệ đi qua', async () => {
    mocks.hasAdminSession.mockResolvedValue(true);

    const response = await middleware(new NextRequest('http://localhost/admin/users'));

    expect(response.status).toBe(200);
    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(mocks.resolveAuthWithRefresh).not.toHaveBeenCalled();
  });
});
