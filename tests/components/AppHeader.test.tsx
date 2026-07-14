// @vitest-environment jsdom
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AppHeader from '@/components/AppHeader';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('@/components/BrandLogo', () => ({
  default: () => <a id="test-brand-logo" href="/">LOTUS TRAVEL</a>,
}));

vi.mock('@/components/DestinationsMenu', () => ({
  default: ({ triggerId, href, label }: { triggerId: string; href: string; label: string }) => (
    <a id={triggerId} href={href}>{label}</a>
  ),
}));

vi.mock('@/components/HeaderSearch', () => ({
  default: () => null,
}));

vi.mock('@/components/HeaderWeather', () => ({
  default: () => null,
}));

vi.mock('@/components/UserDropdown', () => ({
  default: () => null,
}));

vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ data: null, status: 'success', actions: { setUser: vi.fn() } }),
}));

afterEach(cleanup);

describe('AppHeader mobile navigation', () => {
  it('opens all production navigation links with unique identifiers and moves focus into the menu', async () => {
    const user = userEvent.setup();
    render(<AppHeader active="flights" />);

    const toggle = screen.getByRole('button', { name: 'Mở menu điều hướng' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('navigation', { name: 'Điều hướng chính trên thiết bị di động' })).toBeNull();

    await user.click(toggle);

    const navigation = screen.getByRole('navigation', { name: 'Điều hướng chính trên thiết bị di động' });
    const links = Array.from(navigation.querySelectorAll<HTMLAnchorElement>('a'));
    expect(links.map((link) => link.id)).toEqual([
      'mobile-nav-local',
      'mobile-nav-destinations',
      'mobile-nav-hotels',
      'mobile-nav-flights',
      'mobile-nav-news',
    ]);
    expect(new Set(links.map((link) => link.id)).size).toBe(links.length);
    expect(links.map((link) => link.textContent)).toEqual([
      'Địa phương',
      'Điểm đến',
      'Khách sạn',
      'Vé máy bay',
      'Cẩm nang du lịch',
    ]);
    expect(document.activeElement).toBe(links[0]);
    expect(document.getElementById('mobile-nav-flights')?.getAttribute('aria-current')).toBe('page');
  });

  it('closes with Escape, restores focus, and closes on an outside click', async () => {
    const user = userEvent.setup();
    render(<AppHeader />);

    const toggle = screen.getByRole('button', { name: 'Mở menu điều hướng' });
    await user.click(toggle);
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('navigation', { name: 'Điều hướng chính trên thiết bị di động' })).toBeNull();
    expect(document.activeElement).toBe(toggle);

    await user.click(toggle);
    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByRole('navigation', { name: 'Điều hướng chính trên thiết bị di động' })).toBeNull();
    });
  });
});
