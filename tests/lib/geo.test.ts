import { describe, expect, it } from 'vitest';

import { haversineKm } from '@/lib/geo';

describe('haversineKm', () => {
  it('returns zero for identical coordinates', () => {
    expect(haversineKm(21.0278, 105.8342, 21.0278, 105.8342)).toBe(0);
  });

  it('supports a caller-specific earth radius without changing the default', () => {
    const defaultDistance = haversineKm(0, 0, 0, 1);
    const customDistance = haversineKm(0, 0, 0, 1, 6378.1);

    expect(defaultDistance).toBeCloseTo(111.1949, 3);
    expect(customDistance).toBeCloseTo(111.3188, 3);
  });
});
