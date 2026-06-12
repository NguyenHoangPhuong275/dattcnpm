'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import UserDropdown from '@/components/UserDropdown';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { AuthMode } from '@/hooks/useAuthModal';

interface AppHeaderProps {
  active?: 'local' | 'destinations' | 'news' | 'profile';
  searchValue?: string;
  searchPlaceholder?: string;
  showSearch?: boolean;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: () => void;
  onAuthClick?: (mode: Exclude<AuthMode, null>) => void;
}

const NAV_ITEMS = [
  { key: 'local', label: 'Địa phương', href: '/local' },
  { key: 'destinations', label: 'Điểm đến', href: '/#planner' },
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
}: AppHeaderProps): React.JSX.Element {
  const { user } = useCurrentUser({ redirectIfNone: false });
  const pathname = usePathname();
  const [localSearch, setLocalSearch] = useState('');
  const currentSearch = searchValue ?? localSearch;
  const isLocalDetailPage = pathname.startsWith('/local/');

  const setSearch = (value: string): void => {
    if (onSearchChange) {
      onSearchChange(value);
      return;
    }
    setLocalSearch(value);
  };

  const submitSearch = (): void => {
    if (onSearchSubmit) {
      onSearchSubmit();
      return;
    }
    const query = currentSearch.trim();
    if (query) {
      window.location.href = `/?q=${encodeURIComponent(query)}`;
    }
  };

  const openAuth = (mode: Exclude<AuthMode, null>): void => {
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
                href={isLocalDetailPage && item.key === 'news' ? '#travel-news' : item.href}
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
              id="header-search-form"
              className="app-header-search"
              onSubmit={(event) => {
                event.preventDefault();
                submitSearch();
              }}
            >
              <input
                id="header-search-input"
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
              <button id="header-auth-login-button" type="button" onClick={() => openAuth('login')} className="app-auth-link">
                Đăng nhập
              </button>
              <button id="header-auth-register-button" type="button" onClick={() => openAuth('register')} className="app-auth-primary">
                Đăng ký
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
