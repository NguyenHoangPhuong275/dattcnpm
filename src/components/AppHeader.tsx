'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import BrandLogo from '@/components/BrandLogo';
import DestinationsMenu from '@/components/DestinationsMenu';
import HeaderSearch from '@/components/HeaderSearch';
import HeaderWeather from '@/components/HeaderWeather';
import UserDropdown from '@/components/UserDropdown';
import { MenuIcon, XIcon } from '@/components/icons';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { AuthMode } from '@/hooks/useAuthModal';
import { ROUTES } from '@/lib/constants';

const NAV_ITEMS = [
  { key: 'local', label: 'Địa phương', href: ROUTES.local },
  { key: 'destinations', label: 'Điểm đến', href: `${ROUTES.home}#planner` },
  { key: 'hotels', label: 'Khách sạn', href: ROUTES.hotels },
  { key: 'flights', label: 'Vé máy bay', href: ROUTES.flights },
  { key: 'news', label: 'Cẩm nang du lịch', href: ROUTES.travelReferences },
] as const;

type NavKey = (typeof NAV_ITEMS)[number]['key'];

interface AppHeaderProps {
  active?: NavKey | 'profile';
  searchPlaceholder?: string;
  showSearch?: boolean;
  onSearchSubmit?: (query: string) => void;
  onAuthClick?: (mode: Exclude<AuthMode, null>) => void;
}

export default function AppHeader({
  active,
  searchPlaceholder = 'Tìm địa điểm...',
  showSearch = false,
  onSearchSubmit,
  onAuthClick,
}: AppHeaderProps): React.JSX.Element {
  const { data: user, status: userStatus } = useCurrentUser({ redirectIfNone: false });
  const userLoading = userStatus === 'loading';
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const firstMobileLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!mobileNavOpen) return;

    firstMobileLinkRef.current?.focus();

    const handleOutsideClick = (event: MouseEvent): void => {
      if (!mobileMenuRef.current?.contains(event.target as Node)) {
        setMobileNavOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;
      setMobileNavOpen(false);
      mobileToggleRef.current?.focus();
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [mobileNavOpen]);

  const submitSearch = (query: string): void => {
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
        <div className="app-header-side">
          <BrandLogo />
          <HeaderWeather />
        </div>

        <div className="app-nav-center">
          <nav className="app-nav" aria-label="Điều hướng chính">
            {NAV_ITEMS.map((item) =>
              item.key === 'destinations' ? (
                <DestinationsMenu
                  key={item.key}
                  triggerId="desktop-nav-destinations"
                  href={item.href}
                  label={item.label}
                  isActive={active === item.key}
                />
              ) : (
                <Link
                  id={`desktop-nav-${item.key}`}
                  key={item.key}
                  href={item.href}
                  aria-current={active === item.key ? 'page' : undefined}
                  className={`app-nav-link ${active === item.key ? 'app-nav-link-active' : ''}`}
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>
        </div>

        <div className="app-header-actions">
          <HeaderSearch visible={showSearch} placeholder={searchPlaceholder} onSubmit={submitSearch} />

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

          <div ref={mobileMenuRef} className="relative lg:hidden">
            <button
              id="header-mobile-menu-button"
              ref={mobileToggleRef}
              type="button"
              aria-controls="header-mobile-navigation"
              aria-expanded={mobileNavOpen}
              aria-label={mobileNavOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
              onClick={() => setMobileNavOpen((open) => !open)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] shadow-sm transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-primary-lightest)] hover:text-[var(--color-primary-darker)]"
            >
              {mobileNavOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>

            {mobileNavOpen && (
              <nav
                id="header-mobile-navigation"
                aria-label="Điều hướng chính trên thiết bị di động"
                className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-[var(--shadow-float)]"
              >
                {NAV_ITEMS.map((item, index) => (
                  <Link
                    id={`mobile-nav-${item.key}`}
                    ref={index === 0 ? firstMobileLinkRef : undefined}
                    key={item.key}
                    href={item.href}
                    aria-current={active === item.key ? 'page' : undefined}
                    onClick={() => setMobileNavOpen(false)}
                    className={`flex min-h-11 items-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-[var(--color-primary-lightest)] hover:text-[var(--color-primary-darker)] ${
                      active === item.key
                        ? 'bg-[var(--color-primary-lightest)] text-[var(--color-primary-darker)]'
                        : 'text-[var(--color-text-secondary)]'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
