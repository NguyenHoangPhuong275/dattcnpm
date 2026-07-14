import { describe, expect, it } from 'vitest';
import {
  buildPlaceSearchCacheKey,
  getLocalFallbackResults,
  getPriorityLocalityResults,
  normalizePlaceSearchQuery,
  normalizeVietnameseSearch,
  parseCachedSearchPayload,
} from '@/lib/place-search/query';
import { placesSearchSchema } from '@/lib/validations/place';

describe('place search query helpers', () => {
  it('accepts only search terms from 2 through 100 characters', () => {
    expect(placesSearchSchema.safeParse({ q: 'a' }).success).toBe(false);
    expect(placesSearchSchema.safeParse({ q: 'Hà' }).success).toBe(true);
    expect(placesSearchSchema.safeParse({ q: 'a'.repeat(100) }).success).toBe(true);
    expect(placesSearchSchema.safeParse({ q: 'a'.repeat(101) }).success).toBe(false);
  });

  it('normalizes surrounding whitespace, casing, and Vietnamese accents', () => {
    expect(normalizePlaceSearchQuery('  HÀ NỘI  ')).toBe('hà nội');
    expect(normalizeVietnameseSearch('  Hồ Chí Minh  ')).toBe('ho chi minh');
  });

  it('builds a stable cache key from the normalized query', () => {
    expect(buildPlaceSearchCacheKey('  Hà Nội  ')).toBe('geo:search:h%C3%A0%20n%E1%BB%99i');
  });

  it('matches priority localities with accented Vietnamese input', () => {
    const results = getPriorityLocalityResults('Hà Nội');

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      osmId: 'local:ha-noi',
      name: 'Hà Nội',
      address: 'Hà Nội, Việt Nam',
    });
    expect(results[0]).not.toHaveProperty('aliases');
  });

  it('returns unique local fallback matches', () => {
    const results = getLocalFallbackResults('Sa Pa');

    expect(results[0]).toMatchObject({
      osmId: 'local:sa-pa',
      name: 'Sa Pa',
    });
    expect(new Set(results.map((result) => result.name)).size).toBe(results.length);
    expect(results.length).toBeLessThanOrEqual(8);
  });

  it('preserves Vietnamese fallback labels as UTF-8 text', () => {
    const results = getLocalFallbackResults('Đà Lạt');

    expect(results[0]).toMatchObject({
      osmId: 'local:da-lat',
      name: 'Đà Lạt',
      address: 'Lâm Đồng, Việt Nam',
    });
  });

  it('distinguishes cache hits, empty payloads, and malformed payloads', () => {
    const hit = parseCachedSearchPayload(JSON.stringify([{ _id: 'place-1', name: 'Hà Nội', lat: 21, lng: 105 }]));
    const empty = parseCachedSearchPayload('[]');
    const malformed = parseCachedSearchPayload('{invalid');

    expect(hit).toMatchObject({ status: 'hit', results: [{ _id: 'place-1' }] });
    expect(empty).toEqual({ status: 'empty', results: [] });
    expect(malformed).toEqual({ status: 'malformed', results: [] });
  });
});
