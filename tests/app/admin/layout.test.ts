import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
  redirect: vi.fn(),
  getAuthUserFromToken: vi.fn(),
  verifyAdminSession: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: mocks.cookies,
}));

vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
}));

vi.mock('@/lib/auth', () => ({
  authCookieName: 'auth_token',
  getAuthUserFromToken: mocks.getAuthUserFromToken,
}));

vi.mock('@/lib/admin-auth', () => ({
  adminCookieName: 'admin_token',
  verifyAdminSession: mocks.verifyAdminSession,
}));

import AdminLayout from '@/app/admin/(panel)/layout';

describe('AdminLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cookies.mockResolvedValue({
      get: vi.fn((name: string) => name === 'auth_token' ? { value: 'token' } : undefined),
    });
    mocks.verifyAdminSession.mockResolvedValue(false);
    mocks.redirect.mockImplementation((url: string) => {
      throw new Error(`redirect:${url}`);
    });
  });

  it('chuyển người chưa đăng nhập đến màn hình đăng nhập', async () => {
    mocks.getAuthUserFromToken.mockResolvedValue(null);

    await expect(AdminLayout({ children: 'Nội dung' })).rejects.toThrow('redirect:/admin/login');
  });

  it('không cho tài khoản thường truy cập trang quản trị', async () => {
    mocks.getAuthUserFromToken.mockResolvedValue({ role: 'USER' });

    await expect(AdminLayout({ children: 'Nội dung' })).rejects.toThrow('redirect:/');
  });

  it('cho quản trị viên truy cập (bọc trong shell sidebar)', async () => {
    mocks.getAuthUserFromToken.mockResolvedValue({ role: 'ADMIN' });

    const result = await AdminLayout({ children: 'Nội dung' });
    expect(JSON.stringify(result)).toContain('Nội dung');
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it('cho phiên quản trị từ môi trường truy cập (bọc trong shell sidebar)', async () => {
    mocks.getAuthUserFromToken.mockResolvedValue(null);
    mocks.verifyAdminSession.mockResolvedValue(true);

    const result = await AdminLayout({ children: 'Nội dung' });
    expect(JSON.stringify(result)).toContain('Nội dung');
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
