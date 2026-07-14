import { LOCALITIES } from '@/data/localities';
import { normalizeVietnameseText } from '@/lib/string';
import { provinceCenter } from '@/lib/vietnam-tourism';
import type { CachedSearchPayload, PlaceDraft } from '@/lib/place-search/types';

const LOCAL_SEARCH_FALLBACKS = [
  { slug: 'ha-noi', name: 'Hà Nội', type: 'province', lat: 21.0278, lng: 105.8342, address: 'Hà Nội, Việt Nam', tags: ['city', 'culture'] },
  { slug: 'da-lat', name: 'Đà Lạt', type: 'province', lat: 11.9404, lng: 108.4583, address: 'Lâm Đồng, Việt Nam', tags: ['nature', 'resort'] },
  { slug: 'hoi-an', name: 'Hội An', type: 'historic', lat: 15.8801, lng: 108.338, address: 'Quảng Nam, Việt Nam', tags: ['heritage', 'culture'] },
  { slug: 'da-nang', name: 'Đà Nẵng', type: 'province', lat: 16.0471, lng: 108.2068, address: 'Đà Nẵng, Việt Nam', tags: ['beach', 'city'] },
  { slug: 'ha-long', name: 'Hạ Long', type: 'tourism', lat: 20.9101, lng: 107.1839, address: 'Quảng Ninh, Việt Nam', tags: ['bay', 'nature'] },
  { slug: 'hue', name: 'Huế', type: 'historic', lat: 16.4637, lng: 107.5909, address: 'Thừa Thiên Huế, Việt Nam', tags: ['heritage', 'culture'] },
  { slug: 'nha-trang', name: 'Nha Trang', type: 'tourism', lat: 12.2388, lng: 109.1967, address: 'Khánh Hòa, Việt Nam', tags: ['beach', 'island'] },
  { slug: 'sa-pa', name: 'Sa Pa', type: 'tourism', lat: 22.3364, lng: 103.8438, address: 'Lào Cai, Việt Nam', tags: ['mountain', 'nature'] },
  { slug: 'phu-quoc', name: 'Phú Quốc', type: 'tourism', lat: 10.2899, lng: 103.984, address: 'Kiên Giang, Việt Nam', tags: ['island', 'beach'] },
  { slug: 'can-tho', name: 'Cần Thơ', type: 'province', lat: 10.0452, lng: 105.7469, address: 'Cần Thơ, Việt Nam', tags: ['river', 'food'] },
];

const PRIORITY_LOCALITY_RESULTS: Array<PlaceDraft & { aliases: string[] }> = [
  {
    osmId: 'local:ha-noi',
    name: 'H\u00e0 N\u1ed9i',
    type: 'province',
    lat: 21.0278,
    lng: 105.8342,
    address: 'H\u00e0 N\u1ed9i, Vi\u1ec7t Nam',
    openingHours: null,
    images: null,
    osmTags: {},
    tags: ['city', 'culture'],
    aliases: ['ha noi', 'hanoi', 'thu do ha noi'],
  },
  {
    osmId: 'local:tp-ho-chi-minh',
    name: 'H\u1ed3 Ch\u00ed Minh',
    type: 'province',
    lat: 10.7769,
    lng: 106.7009,
    address: 'TP. H\u1ed3 Ch\u00ed Minh, Vi\u1ec7t Nam',
    openingHours: null,
    images: null,
    osmTags: {},
    tags: ['city', 'culture', 'food'],
    aliases: ['ho chi minh', 'tp ho chi minh', 'thanh pho ho chi minh', 'hcm', 'tphcm', 'sai gon', 'saigon', 'sai thanh'],
  },
  {
    osmId: 'local:da-lat',
    name: '\u0110\u00e0 L\u1ea1t',
    type: 'province',
    lat: 11.9404,
    lng: 108.4583,
    address: 'L\u00e2m \u0110\u1ed3ng, Vi\u1ec7t Nam',
    openingHours: null,
    images: null,
    osmTags: {},
    tags: ['nature', 'resort'],
    aliases: ['da lat', 'dalat', 'lam dong'],
  },
  {
    osmId: 'local:da-nang',
    name: '\u0110\u00e0 N\u1eb5ng',
    type: 'province',
    lat: 16.0471,
    lng: 108.2068,
    address: '\u0110\u00e0 N\u1eb5ng, Vi\u1ec7t Nam',
    openingHours: null,
    images: null,
    osmTags: {},
    tags: ['beach', 'city'],
    aliases: ['da nang', 'danang'],
  },
  {
    osmId: 'local:hoi-an',
    name: 'H\u1ed9i An',
    type: 'historic',
    lat: 15.8801,
    lng: 108.338,
    address: 'Qu\u1ea3ng Nam, Vi\u1ec7t Nam',
    openingHours: null,
    images: null,
    osmTags: {},
    tags: ['heritage', 'culture'],
    aliases: ['hoi an', 'hoian', 'quang nam'],
  },
];

export function normalizePlaceSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function normalizeVietnameseSearch(value: string): string {
  return normalizeVietnameseText(value);
}

export function getPriorityLocalityResults(query: string): PlaceDraft[] {
  const normalized = normalizeVietnameseSearch(query);
  return PRIORITY_LOCALITY_RESULTS
    .filter((item) => item.aliases.some((alias) => alias === normalized || alias.includes(normalized) || normalized.includes(alias)))
    .map((item) => ({
      osmId: item.osmId,
      name: item.name,
      type: item.type,
      lat: item.lat,
      lng: item.lng,
      address: item.address,
      openingHours: item.openingHours,
      images: item.images,
      osmTags: item.osmTags,
      tags: item.tags,
    }));
}

export function getLocalFallbackResults(query: string): PlaceDraft[] {
  const normalized = normalizeVietnameseSearch(query);
  const fromClean = LOCAL_SEARCH_FALLBACKS
    .filter((item) => {
      const haystack = normalizeVietnameseSearch(`${item.name} ${item.address} ${item.tags.join(' ')}`);
      return haystack.includes(normalized) || normalized.includes(normalizeVietnameseSearch(item.name));
    })
    .map((item) => ({
      osmId: `local:${item.slug}`,
      name: item.name,
      type: item.type,
      lat: item.lat,
      lng: item.lng,
      address: item.address,
      openingHours: null,
      images: null,
      osmTags: {},
      tags: item.tags,
    }));

  const fromLocalities = LOCALITIES
    .filter((locality) => {
      const name = normalizeVietnameseSearch(locality.name);
      const description = normalizeVietnameseSearch(locality.description || '');
      return name.includes(normalized) || normalized.includes(name) || description.includes(normalized);
    })
    .slice(0, 6)
    .map((locality) => {
      const center = provinceCenter(locality.name);
      return {
        osmId: `locality:${locality.slug}`,
        name: locality.name,
        type: 'province',
        lat: center.lat,
        lng: center.lng,
        address: `${locality.name}, Việt Nam`,
        openingHours: null,
        images: null,
        osmTags: {},
        tags: ['province', 'du lịch'],
      };
    });

  const seen = new Set<string>();
  return [...fromClean, ...fromLocalities]
    .filter((place) => {
      if (seen.has(place.name)) return false;
      seen.add(place.name);
      return true;
    })
    .slice(0, 8);
}

export function buildPlaceSearchCacheKey(query: string): string {
  return `geo:search:${encodeURIComponent(normalizePlaceSearchQuery(query))}`;
}

export function parseCachedSearchPayload(cached: string): CachedSearchPayload {
  try {
    const parsed = JSON.parse(cached) as CachedSearchPayload['results'];
    if (parsed.length > 0) return { status: 'hit', results: parsed };
    return { status: 'empty', results: parsed };
  } catch {
    return { status: 'malformed', results: [] };
  }
}
