import { describe, expect, it } from 'vitest';
import {
  buildNominatimParams,
  filterNominatimTourismResults,
  getSearchCenter,
  isBlockedRawPoi,
  isSearchResultAllowed,
  isValidTourismPoi,
  mapNominatimToPlace,
  mapOverpassElementToRawPoi,
  mergeNominatimCandidates,
  sortRawPoisByLocationName,
  sortTourismResults,
  toResultPayload,
} from '@/lib/place-search/transformers';
import type { NominatimResult, PlaceDraft, SavedPlace } from '@/lib/place-search/types';

function createNominatimResult(overrides: Partial<NominatimResult> = {}): NominatimResult {
  return {
    place_id: 1,
    osm_type: 'node',
    osm_id: 10,
    lat: '21.0278',
    lon: '105.8342',
    display_name: 'Văn Miếu, Hà Nội, Việt Nam',
    class: 'tourism',
    type: 'attraction',
    address: { city: 'Hà Nội' },
    ...overrides,
  };
}

function createPlace(overrides: Partial<PlaceDraft> = {}): PlaceDraft {
  return {
    osmId: 'node:1',
    name: 'Điểm đến',
    type: 'tourism',
    lat: 21,
    lng: 105,
    address: null,
    openingHours: null,
    images: null,
    osmTags: {},
    tags: ['tourism'],
    ...overrides,
  };
}

describe('place search source transformers', () => {
  it('builds the exact Nominatim request parameters', () => {
    const params = buildNominatimParams('Hà Nội');

    expect(Object.fromEntries(params.entries())).toEqual({
      q: 'Hà Nội',
      format: 'json',
      limit: '10',
      countrycodes: 'vn',
      addressdetails: '1',
      'accept-language': 'vi',
    });
  });

  it('merges two Nominatim queries while preserving first-source order', () => {
    const primary = [
      createNominatimResult({ place_id: 1, osm_id: 10 }),
      createNominatimResult({ place_id: 2, osm_id: 20 }),
    ];
    const normalized = [
      createNominatimResult({ place_id: 3, osm_id: 10 }),
      createNominatimResult({ place_id: 4, osm_id: 40 }),
    ];

    expect(mergeNominatimCandidates(primary, normalized).map((result) => result.place_id)).toEqual([1, 2, 4]);
  });

  it('keeps tourism sources and removes unsupported or lodging sources', () => {
    const results = [
      createNominatimResult({ place_id: 1, class: 'tourism', type: 'museum' }),
      createNominatimResult({ place_id: 2, class: 'historic', type: 'monument' }),
      createNominatimResult({ place_id: 3, class: 'amenity', type: 'place_of_worship' }),
      createNominatimResult({ place_id: 4, class: 'leisure', type: 'park' }),
      createNominatimResult({ place_id: 5, class: 'tourism', type: 'hotel' }),
      createNominatimResult({ place_id: 6, class: 'amenity', type: 'restaurant' }),
    ];

    expect(filterNominatimTourismResults(results).map((result) => result.place_id)).toEqual([1, 2, 3, 4]);
  });

  it('maps administrative and tourism Nominatim results without changing meaning', () => {
    const administrative = mapNominatimToPlace(createNominatimResult({
      class: 'boundary',
      type: 'administrative',
      display_name: 'Hà Nội, Việt Nam',
      address: { city: 'Hà Nội' },
    }));
    const tourism = mapNominatimToPlace(createNominatimResult());

    expect(administrative).toMatchObject({
      osmId: 'node:10',
      name: 'Hà Nội',
      type: 'province',
      address: null,
    });
    expect(tourism).toMatchObject({
      name: 'Hà Nội',
      type: 'tourism',
      address: 'Văn Miếu',
    });
  });

  it('uses raw coordinates first, then parsed coordinates, then an empty center', () => {
    const raw = createNominatimResult({ display_name: 'Hà Nội, Việt Nam', lat: '21.1', lon: '105.9' });
    const parsed = createPlace({ name: 'Đà Lạt', lat: 11.9, lng: 108.4 });

    expect(getSearchCenter('query', [raw], [parsed])).toEqual({
      mainLocationName: 'Hà Nội',
      centerLat: 21.1,
      centerLng: 105.9,
    });
    expect(getSearchCenter('query', [], [parsed])).toEqual({
      mainLocationName: 'Đà Lạt',
      centerLat: 11.9,
      centerLng: 108.4,
    });
    expect(getSearchCenter('query', [], [])).toEqual({
      mainLocationName: 'query',
      centerLat: null,
      centerLng: null,
    });
  });

  it('maps named Overpass elements with node or center coordinates', () => {
    expect(mapOverpassElementToRawPoi({
      id: 42,
      center: { lat: 0, lon: 105 },
      tags: { name: 'Temple', name_vi: 'Đền cổ', historic: 'temple' },
    })).toEqual({
      id: '42',
      name: 'Đền cổ',
      type: 'temple',
      amenity: undefined,
      shop: undefined,
      lat: 0,
      lng: 105,
    });
    expect(mapOverpassElementToRawPoi({ id: 43, lat: 21, lon: 105, tags: {} })).toBeNull();
  });

  it('filters blocked POIs and non-tourism result types', () => {
    expect(isBlockedRawPoi({ id: '1', name: 'Trạm A', type: 'service', amenity: 'fuel', lat: 1, lng: 1 })).toBe(true);
    expect(isBlockedRawPoi({ id: '2', name: 'Cây xăng trung tâm', type: 'service', lat: 1, lng: 1 })).toBe(true);
    expect(isValidTourismPoi('Dịch vụ xoa bóp', 'attraction')).toBe(false);
    expect(isValidTourismPoi('Khách sạn A', 'hotel')).toBe(false);
    expect(isValidTourismPoi('Bảo tàng Hà Nội', 'museum')).toBe(true);
    expect(isSearchResultAllowed(createPlace({ type: 'province' }))).toBe(false);
    expect(isSearchResultAllowed(createPlace({ type: 'museum' }))).toBe(true);
  });

  it('ranks nearby names and accent-aware query matches without mutating input', () => {
    const pois = [
      { id: '1', name: 'Bảo tàng', type: 'museum', lat: 1, lng: 1 },
      { id: '2', name: 'Công viên Hà Nội', type: 'park', lat: 1, lng: 1 },
    ];
    const places = [
      createPlace({ osmId: 'node:1', name: 'Điểm A', address: 'Đà Nẵng' }),
      createPlace({ osmId: 'node:2', name: 'Điểm B', address: 'Hà Nội' }),
    ];

    expect(sortRawPoisByLocationName(pois, 'Hà Nội').map((poi) => poi.id)).toEqual(['2', '1']);
    expect(sortTourismResults(places, 'Hà Nội', 'hà nội').map((place) => place.osmId)).toEqual(['node:2', 'node:1']);
    expect(pois.map((poi) => poi.id)).toEqual(['1', '2']);
    expect(places.map((place) => place.osmId)).toEqual(['node:1', 'node:2']);
  });

  it('creates the public search payload without persistence-only fields', () => {
    const savedPlace = {
      ...createPlace(),
      _id: 'place-1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    } as SavedPlace;

    expect(toResultPayload(savedPlace)).toEqual({
      _id: 'place-1',
      name: 'Điểm đến',
      type: 'tourism',
      lat: 21,
      lng: 105,
      address: null,
      osmId: 'node:1',
    });
  });
});
