'use client';

import { useState } from 'react';
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';
import UserDropdown from '@/components/UserDropdown';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { AuthMode } from '@/hooks/useAuthModal';
import { ROUTES } from '@/lib/constants';

interface AppHeaderProps {
  active?: 'local' | 'destinations' | 'hotels' | 'news' | 'profile';
  searchPlaceholder?: string;
  showSearch?: boolean;
  onSearchSubmit?: (query: string) => void;
  onAuthClick?: (mode: Exclude<AuthMode, null>) => void;
}

const NAV_ITEMS = [
  { key: 'local', label: 'Địa phương', href: ROUTES.local },
  { key: 'destinations', label: 'Điểm đến', href: `${ROUTES.home}#planner` },
  { key: 'hotels', label: 'Khách sạn', href: ROUTES.hotels },
  { key: 'news', label: 'Tin tức du lịch', href: ROUTES.travelReferences },
] as const;

export default function AppHeader({
  active,
  searchPlaceholder = 'Tìm địa điểm...',
  showSearch = true,
  onSearchSubmit,
  onAuthClick,
}: AppHeaderProps): React.JSX.Element {
  const { data: user, status: userStatus } = useCurrentUser({ redirectIfNone: false });
  const [searchInput, setSearchInput] = useState('');
  const userLoading = userStatus === 'loading';

  const submitSearch = (): void => {
    const query = searchInput.trim();
    if (!query) return;
    if (onSearchSubmit) {
      onSearchSubmit(query);
      return;
    }
    window.location.href = `${ROUTES.home}?q=${encodeURIComponent(query)}`;
  };

  const openAuth = (mode: Exclude<AuthMode, null>): void => {
    if (onAuthClick) {
      onAuthClick(mode);
      return;
    }
    window.location.href = `${ROUTES.home}?auth=${mode}`;
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
              id="header-search-form"
              className="app-header-search"
              onSubmit={(event) => {
                event.preventDefault();
                submitSearch();
              }}
            >
              <input
                id="header-search-input"
                aria-label="Tìm kiếm địa điểm"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={searchPlaceholder}
                className="app-header-search-input"
              />
            </form>
          )}

          {userLoading ? (
            <div className="h-10 w-24 animate-pulse rounded-full bg-[var(--color-bg)]" aria-hidden="true" />
          ) : user ? (
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
