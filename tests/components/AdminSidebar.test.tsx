// @vitest-environment jsdom
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import AdminSidebar from '@/components/admin/AdminSidebar';

const mocks = vi.hoisted(() => ({
  pathname: '/admin/reports',
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => mocks.pathname,
}));

afterEach(cleanup);

describe('AdminSidebar', () => {
  it('hiển thị đầy đủ các trang quản trị và đánh dấu đúng trang báo cáo', () => {
    render(<AdminSidebar />);

    const links = screen.getAllByRole('link');
    const hrefs = links.map((link) => link.getAttribute('href'));

    expect(hrefs).toEqual([
      '/',
      '/admin',
      '/admin/users',
      '/admin/logs',
      '/admin/reports',
      '/admin/bookings',
      '/admin/notifications',
      '/admin/database',
    ]);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(screen.getByRole('link', { name: /Báo cáo đánh giá/ }).getAttribute('aria-current')).toBe('page');
  });
});
