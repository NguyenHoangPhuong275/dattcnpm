'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { clearStoredUser } from '@/lib/user';
import { apiRequest } from '@/lib/api-client';

interface User {
  fullName?: string;
  email?: string;
}

interface UserDropdownProps {
  user: User;
}

export default function UserDropdown({ user }: UserDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleLogout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch {}

    clearStoredUser();
    setOpen(false);
    window.location.href = '/';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-offset)] hover:text-[var(--color-text)]"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[10px] font-bold text-[var(--color-primary-darker)]">
          {initials}
        </span>
        <span className="hidden sm:inline">Xin chào, {displayName}</span>
        <span className="text-xs text-[var(--color-text-muted)]" aria-hidden="true">
          {open ? 'Ẩn' : 'Mở'}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-48 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg">
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="block cursor-pointer px-4 py-2.5 text-sm text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-offset)]"
          >
            Thông tin của bạn
          </Link>
          <Link
            href="/profile?tab=trips"
            onClick={() => setOpen(false)}
            className="block cursor-pointer px-4 py-2.5 text-sm text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-offset)]"
          >
            Chuyến đi của tôi
          </Link>
          <div className="my-1 border-t border-[var(--color-border)]" />
          <button
            type="button"
            onClick={handleLogout}
            className="w-full cursor-pointer px-4 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
          >
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
