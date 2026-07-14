import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
}));

vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
}));

import LegacyAdminLoginPage from '@/app/login/admin/page';

describe('LegacyAdminLoginPage', () => {
  it('chuyển đường dẫn cũ sang trang đăng nhập quản trị chuẩn', () => {
    expect(() => LegacyAdminLoginPage()).toThrow('redirect:/admin/login');
    expect(mocks.redirect).toHaveBeenCalledOnce();
    expect(mocks.redirect).toHaveBeenCalledWith('/admin/login');
  });
});
