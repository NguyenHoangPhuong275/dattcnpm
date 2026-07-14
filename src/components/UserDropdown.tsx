'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ChevronDownIcon } from '@/components/icons';
import { apiRequest } from '@/lib/api-client';
import { ROUTES } from '@/lib/constants';
import { clearStoredUser } from '@/lib/user';

interface User {
  fullName?: string;
  email?: string;
  avatarUrl?: string | null;
}

interface UserDropdownProps {
  user: User;
}

export default function UserDropdown({ user }: UserDropdownProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [imgBroken, setImgBroken] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  const displayName = user.fullName?.split(' ').pop() || user.email?.split('@')[0] || 'Bạn';
  const initials = (user.fullName || user.email || 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    setImgBroken(false);
  }, [user.avatarUrl]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent): void => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const handleLogout = async (): Promise<void> => {
    setOpen(false);
    clearStoredUser();
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch {
    }
    router.replace(ROUTES.home);
    router.refresh();
  };

  return (
    <div className="relative min-w-0" ref={dropdownRef}>
      <button
        id="header-user-menu-button"
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 max-w-full min-w-0 cursor-pointer items-center gap-2 rounded-full px-3 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="header-user-menu"
        aria-label={`Mở menu người dùng ${displayName}`}
      >
        {user.avatarUrl && !imgBroken ? (
          <Image
            src={user.avatarUrl}
            alt={displayName}
            width={28}
            height={28}
            unoptimized
            onError={() => setImgBroken(true)}
            className="h-7 w-7 rounded-full object-cover shrink-0"
          />
        ) : (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-xs font-bold text-[var(--color-primary-darker)]">
            {initials}
          </span>
        )}
        <span className="hidden min-w-0 max-w-32 truncate text-xs font-semibold text-slate-600 sm:inline-block" title={`Chào, ${displayName}`}>
          Chào, {displayName}
        </span>
        <ChevronDownIcon className={`text-[var(--color-text-muted)] ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div id="header-user-menu" className="absolute right-0 z-50 mt-2 w-48 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg">
          <Link
            id="header-user-profile-link"
            href={ROUTES.profile}
            onClick={() => setOpen(false)}
            className="block cursor-pointer px-4 py-2.5 text-sm text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg)]"
          >
            Thông tin của bạn
          </Link>
          <Link
            id="header-user-trips-link"
            href={`${ROUTES.profile}?tab=trips`}
            onClick={() => setOpen(false)}
            className="block cursor-pointer px-4 py-2.5 text-sm text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg)]"
          >
            Chuyến đi của tôi
          </Link>
          <div className="my-1 border-t border-[var(--color-border)]" />
          <button
            id="header-user-logout-button"
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
