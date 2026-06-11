import { BasicUser } from '@/types/profile';

const USER_STORAGE_KEY = 'user';

export function getStoredUser(): BasicUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
}

export function setStoredUser(user: BasicUser | null): void {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

export function clearStoredUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USER_STORAGE_KEY);
}

export function syncUserToStorage(user: BasicUser | null): void {
  setStoredUser(user);
}

export function updateStoredUser(updater: (user: BasicUser) => BasicUser): void {
  const current = getStoredUser();
  if (!current) return;
  setStoredUser(updater(current));
}
