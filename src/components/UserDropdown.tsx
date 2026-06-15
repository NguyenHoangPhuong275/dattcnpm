'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clearStoredUser } from '@/lib/user';
import { apiRequest } from '@/lib/api-client';
import { ROUTES } from '@/lib/constants';

interface User {
  fullName?: string;
  email?: string;
}

interface UserDropdownProps {
  user: User;
}

export default function UserDropdown({ user }: UserDropdownProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const displayName = user.fullName?.split(' ').pop() || user.email?.split('@')[0] || 'Bạn';
  const initials = (user.fullName || user.email || 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async (): Promise<void> => {
    setOpen(false);
    clearStoredUser();
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignored
    }
    router.replace(ROUTES.home);
    router.refresh();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full px-2 py-1.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Mở menu người dùng ${displayName}`}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-xs font-bold text-[var(--color-primary-darker)]">
          {initials}
        </span>
        <svg
          className={`h-4 w-4 text-[var(--color-text-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-48 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg">
          <Link
            href={ROUTES.profile}
            onClick={() => setOpen(false)}
            className="block cursor-pointer px-4 py-2.5 text-sm text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg)]"
          >
            Thông tin của bạn
          </Link>
          <Link
            href={`${ROUTES.profile}?tab=trips`}
            onClick={() => setOpen(false)}
            className="block cursor-pointer px-4 py-2.5 text-sm text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg)]"
          >
            Chuyến đi của tôi
          </Link>
          <div className="my-1 border-t border-[var(--color-border)]" />
          <button
            type="button"
            onClick={handleLogout}
            className="w-full cursor-pointer px-4 py-2.5 text-left text-sm text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger)]/5"
          >
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
