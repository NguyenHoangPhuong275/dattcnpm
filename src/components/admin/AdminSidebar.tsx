'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MenuItem {
  href: string;
  label: string;
  icon: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    href: '/admin',
    label: 'Tổng quan',
    icon: 'M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    href: '/admin/users',
    label: 'Người dùng',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z',
  },
  {
    href: '/admin/logs',
    label: 'Nhật ký hoạt động',
    icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    href: '/admin/reports',
    label: 'Report đánh giá',
    icon: 'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z',
  },
  {
    href: '/admin/notifications',
    label: 'Thông báo',
    icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  },
  {
    href: '/admin/database',
    label: 'Cơ sở dữ liệu',
    icon: 'M4 7v10c0 2 3.582 3 8 3s8-1 8-3V7M4 7c0 2 3.582 3 8 3s8-1 8-3M4 7c0-2 3.582-3 8-3s8 1 8 3m0 5c0 2-3.582 3-8 3s-8-1-8-3',
  },
];

export default function AdminSidebar(): React.JSX.Element {
  const pathname = usePathname();

  return (
    <aside className="shrink-0 border-b border-[var(--color-border)] bg-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:border-b-0 lg:border-r">
      <div className="flex items-center gap-2 px-5 py-5">
        <Link href="/" className="rounded-xl p-1.5 transition-all hover:bg-[var(--color-primary-lightest)]" aria-label="Về trang chủ">
          <svg className="h-5 w-5 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <div className="font-display text-base font-extrabold text-[var(--color-text)]">Lotus Travel</div>
          <div className="text-xs font-semibold text-[var(--color-text-muted)]">Quản trị hệ thống</div>
        </div>
      </div>

      <nav aria-label="Menu quản trị" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:pb-0">
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              id={`admin-menu-${item.href.split('/').pop() || 'overview'}`}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-[var(--color-primary-lightest)] text-[var(--color-primary-darker)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]'
              }`}
            >
              <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
              </svg>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
