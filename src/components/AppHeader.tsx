'use client';

import { useState } from 'react';
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';
import UserDropdown from '@/components/UserDropdown';
import { useCurrentUser } from '@/hooks/useCurrentUser';

type AuthMode = 'login' | 'register';

interface AppHeaderProps {
  active?: 'local' | 'destinations' | 'hotels' | 'flights' | 'news' | 'profile';
  searchValue?: string;
  searchPlaceholder?: string;
  showSearch?: boolean;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: () => void;
  onAuthClick?: (mode: AuthMode) => void;
}

const NAV_ITEMS = [
  { key: 'local', label: 'Địa phương', href: '/local' },
  { key: 'destinations', label: 'Điểm đến', href: '/#planner' },
  { key: 'hotels', label: 'Khách sạn', href: '/#hotels' },
  { key: 'flights', label: 'Vé máy bay', href: '/#flights' },
  { key: 'news', label: 'Tin tức du lịch', href: '/#travel-news' },
] as const;

export default function AppHeader({
  active,
  searchValue,
  searchPlaceholder = 'Tìm địa điểm...',
  showSearch = true,
  onSearchChange,
  onSearchSubmit,
  onAuthClick,
}: AppHeaderProps) {
  const { user } = useCurrentUser({ redirectIfNone: false });
  const [localSearch, setLocalSearch] = useState('');
  const currentSearch = searchValue ?? localSearch;

  const setSearch = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setLocalSearch(value);
    }
  };

  const openAuth = (mode: AuthMode) => {
    if (onAuthClick) {
      onAuthClick(mode);
      return;
    }

    window.location.href = `/?auth=${mode}`;
  };

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="app-header-left">
          <BrandLogo />

          <nav className="app-nav" aria-label="Điều hướng chính">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`app-nav-link ${active === item.key ? 'app-nav-link-active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex-1" />

        <div className="app-header-actions">
          {showSearch && (
            <form
              className="app-header-search"
              onSubmit={(event) => {
                event.preventDefault();
                onSearchSubmit?.();
              }}
            >
              <input
                type="search"
                value={currentSearch}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={searchPlaceholder}
                className="app-header-search-input"
              />
            </form>
          )}

          {user ? (
            <UserDropdown user={user} />
          ) : (
            <>
              <button type="button" onClick={() => openAuth('login')} className="app-auth-link">
                Đăng nhập
              </button>
              <button type="button" onClick={() => openAuth('register')} className="app-auth-primary">
                Đăng ký
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
