import { describe, expect, it } from 'vitest';

import { normalizeProfileTab } from '@/lib/profile-tabs';

describe('normalizeProfileTab', () => {
  it.each(['personal', 'trips', 'bookings', 'favorites', 'security'])(
    'giữ nguyên tab hợp lệ %s',
    (tab) => {
      expect(normalizeProfileTab(tab)).toBe(tab);
    },
  );

  it.each([null, undefined, '', 'unknown', 'admin', 'TRIPS'])(
    'đưa giá trị không hợp lệ %s về thông tin cá nhân',
    (tab) => {
      expect(normalizeProfileTab(tab)).toBe('personal');
    },
  );
});
