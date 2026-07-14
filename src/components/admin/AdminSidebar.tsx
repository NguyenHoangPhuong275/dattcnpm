'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ROUTES } from '@/lib/constants';

interface MenuItem {
  href: string;
  label: string;
  icon: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    href: ROUTES.admin,
    label: 'Tổng quan',
    icon: 'M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    href: `${ROUTES.admin}/users`,
    label: 'Người dùng',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z',
  },
  {
    href: `${ROUTES.admin}/logs`,
    label: 'Nhật ký hoạt động',
    icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    href: `${ROUTES.admin}/reports`,
    label: 'Báo cáo đánh giá',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    href: `${ROUTES.admin}/bookings`,
    label: 'Đặt chỗ',
    icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
  },
  {
    href: `${ROUTES.admin}/notifications`,
    label: 'Thông báo',
    icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  },
  {
    href: `${ROUTES.admin}/database`,
    label: 'Bảo trì hệ thống',
    icon: 'M4 7v10c0 2 3.582 3 8 3s8-1 8-3V7M4 7c0 2 3.582 3 8 3s8-1 8-3M4 7c0-2 3.582-3 8-3s8 1 8 3m0 5c0 2-3.582 3-8 3s-8-1-8-3',
  },
];

export default function AdminSidebar(): React.JSX.Element {
  const pathname = usePathname();

  return (
    <aside className="shrink-0 border-b border-white/10 bg-[var(--admin-brand-deep)] text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-72 lg:flex-col lg:border-b-0 lg:border-r-0">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5 lg:px-6 lg:py-7">
        <Link id="admin-back-home" href="/" className="rounded-xl border border-white/10 bg-white/5 p-2 transition hover:bg-white/10" aria-label="Về trang chủ">
          <svg className="h-4 w-4 text-white/75" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div className="min-w-0">
          <div className="font-display text-lg font-extrabold tracking-tight text-white">Lotus Travel</div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">Trung tâm quản trị</div>
        </div>
      </div>

      <nav aria-label="Menu quản trị" className="flex gap-1.5 overflow-x-auto px-3 py-3 lg:flex-col lg:overflow-visible lg:px-4 lg:py-2">
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              id={`admin-menu-${item.href.split('/').pop() || 'overview'}`}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`group flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-white text-[var(--admin-brand-plum)] shadow-[0_8px_24px_rgba(35,10,45,0.24)]'
                  : 'text-white/65 hover:bg-white/8 hover:text-white'
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
