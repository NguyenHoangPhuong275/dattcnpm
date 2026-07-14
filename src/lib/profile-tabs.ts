import type { ProfileTab } from '@/types/profile';

const PROFILE_TABS = new Set<ProfileTab>([
  'personal',
  'trips',
  'bookings',
  'favorites',
  'security',
]);

function isProfileTab(value: string): value is ProfileTab {
  return PROFILE_TABS.has(value as ProfileTab);
}

export function normalizeProfileTab(value: string | null | undefined): ProfileTab {
  return value && isProfileTab(value) ? value : 'personal';
}
