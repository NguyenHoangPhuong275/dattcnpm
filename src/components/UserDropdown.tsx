'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

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
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('user');
    setOpen(false);
    window.location.href = '/';
  };

  const handleProfile = () => {
    setOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-slate-100 hover:text-[var(--color-text)] transition-colors cursor-pointer"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <div className="h-7 w-7 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center text-[10px] font-bold text-[var(--color-primary-darker)]">
          {initials}
        </div>
        <span className="hidden sm:inline">Xin chào, {displayName}</span>
        <svg
          className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-[var(--color-border)] rounded-2xl shadow-lg py-1 z-50">
          <Link
            href="/profile"
            onClick={handleProfile}
            className="block px-4 py-2.5 text-sm text-[var(--color-text)] hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Quản lý profile
          </Link>
          <div className="border-t border-[var(--color-border)] my-1" />
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
