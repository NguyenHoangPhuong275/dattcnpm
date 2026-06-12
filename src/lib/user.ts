import { BasicUser } from '@/types/profile';

let _currentUser: BasicUser | null = null;

export function getStoredUser(): BasicUser | null {
  return _currentUser;
}

export function setStoredUser(user: BasicUser | null): void {
  _currentUser = user;
}

export function clearStoredUser(): void {
  _currentUser = null;
}

export function updateStoredUser(updater: (user: BasicUser) => BasicUser): void {
  if (_currentUser) {
    _currentUser = updater(_currentUser);
  }
}
