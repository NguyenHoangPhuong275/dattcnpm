import { BasicUser } from '@/types/profile';

const LOGOUT_TS_KEY = 'lotus_logout_at';
const AUTH_COOKIE_NAME = 'auth_token';

let _currentUser: BasicUser | null = null;
let _currentUserFetchedAt = 0;
let _localLogoutAt = 0;
const listeners = new Set<(user: BasicUser | null) => void>();

// Khôi phục logout timestamp từ sessionStorage khi module load (tránh mất khi reload page)
try {
  const stored = typeof window !== 'undefined'
    ? sessionStorage.getItem(LOGOUT_TS_KEY)
    : null;
  if (stored) {
    _localLogoutAt = Number(stored) || 0;
  }
} catch {
  // SSR hoặc sessionStorage bị chặn
}

function notifyUserChange(): void {
  listeners.forEach((listener) => listener(_currentUser));
}

export function getStoredUser(): BasicUser | null {
  return _currentUser;
}

export function isStoredUserFresh(ttlMs: number): boolean {
  return !!_currentUser && _currentUserFetchedAt > 0 && Date.now() - _currentUserFetchedAt < ttlMs;
}

export function isLocalLogoutRecent(ttlMs: number): boolean {
  return !_currentUser && _localLogoutAt > 0 && Date.now() - _localLogoutAt < ttlMs;
}

/**
 * Kiểm tra cookie auth_token có tồn tại ở client-side hay không.
 * Nếu không có cookie → chắc chắn chưa đăng nhập → không cần gọi API verify.
 */
export function hasAuthCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((c) => c.trim().startsWith(`${AUTH_COOKIE_NAME}=`));
}

export function setStoredUser(user: BasicUser | null, fetchedAt: number = Date.now()): void {
  _currentUser = user;
  _currentUserFetchedAt = user ? fetchedAt : 0;
  if (user) {
    _localLogoutAt = 0;
    try { sessionStorage.removeItem(LOGOUT_TS_KEY); } catch { /* noop */ }
  }
  notifyUserChange();
}

export function clearStoredUser(): void {
  _localLogoutAt = Date.now();
  try { sessionStorage.setItem(LOGOUT_TS_KEY, String(_localLogoutAt)); } catch { /* noop */ }
  setStoredUser(null);
}

export function updateStoredUser(updater: (user: BasicUser) => BasicUser): void {
  if (_currentUser) {
    _currentUser = updater(_currentUser);
    _currentUserFetchedAt = Date.now();
    notifyUserChange();
  }
}

export function subscribeStoredUser(listener: (user: BasicUser | null) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

