// @vitest-environment jsdom
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import UserDropdown from '@/components/UserDropdown';

vi.mock('next/image', () => ({
  default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('@/lib/api-client', () => ({
  apiRequest: vi.fn(),
}));

vi.mock('@/lib/user', () => ({
  clearStoredUser: vi.fn(),
}));

afterEach(cleanup);

describe('UserDropdown', () => {
  it('giữ chevron trong trigger, mở đủ hành động và đóng bằng Escape', async () => {
    const user = userEvent.setup();
    render(<UserDropdown user={{ fullName: 'Nguyễn Văn Tên Rất Dài', email: 'user@example.com' }} />);

    const trigger = screen.getByRole('button', { name: /Mở menu người dùng/ });
    const chevron = trigger.querySelector('svg.app-dropdown-chevron');
    expect(chevron?.getAttribute('class')).toContain('app-dropdown-chevron');

    await user.click(trigger);

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(document.getElementById('header-user-profile-link')?.getAttribute('href')).toBe('/profile');
    expect(document.getElementById('header-user-trips-link')?.getAttribute('href')).toBe('/profile?tab=trips');
    expect(document.getElementById('header-user-logout-button')).not.toBeNull();

    await user.keyboard('{Escape}');

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
  });
});
