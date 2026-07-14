import { haversineKm } from '@/lib/geo';
import { normalizeVietnameseText } from '@/lib/string';
import { knownProvinceKeys, resolveProvinceKey } from '@/lib/vietnam-tourism';

export interface HotelLike {
  name: string;
  province?: string | null;
  provinceKey?: string | null;
  district?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  rating?: number | null;
}

export interface HotelMatchCriteria {
  destination?: string | null;
  province?: string | null;
  district?: string | null;
  lat?: number | null;
  lng?: number | null;
}

const AREA_TO_PROVINCE: Record<string, string> = {
  'ha long': 'quang ninh',
  'bai chay': 'quang ninh',
  'hoi an': 'quang nam',
  'sa pa': 'lao cai',
  'sapa': 'lao cai',
  'nha trang': 'khanh hoa',
  'da lat': 'lam dong',
  'phu quoc': 'kien giang',
  'sam son': 'thanh hoa',
  'mui ne': 'binh thuan',
  'cat ba': 'hai phong',
  'vung tau': 'ba ria vung tau',
  'phong nha': 'quang binh',
  'tam dao': 'vinh phuc',
  'mai chau': 'hoa binh',
};

export function normalizeLocation(value?: string | null): string {
  if (!value) return '';
  return normalizeVietnameseText(value).replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function primarySegment(value?: string | null): string {
  if (!value) return '';
  return (value.split(/[,;/]/)[0] || value).trim();
}

function resolveTargetProvinceKey(criteria: HotelMatchCriteria): string {
  const primary = primarySegment(criteria.province || criteria.destination);
  if (!primary) return '';
  const direct = resolveProvinceKey(primary);
  if (knownProvinceKeys().includes(direct)) return direct;
  const normalized = normalizeLocation(primary);
  if (AREA_TO_PROVINCE[normalized]) return AREA_TO_PROVINCE[normalized];
  for (const [area, province] of Object.entries(AREA_TO_PROVINCE)) {
    if (normalized.includes(area)) return province;
  }
  return direct;
}

function hotelProvinceKey(hotel: HotelLike): string {
  if (hotel.provinceKey) return hotel.provinceKey;
  if (hotel.province) return resolveProvinceKey(hotel.province);
  return '';
}


export function resolveHotelProvinceFilterKey(criteria: HotelMatchCriteria): string | null {
  const target = resolveTargetProvinceKey(criteria);
  return target && knownProvinceKeys().includes(target) ? target : null;
}

function coordScore(criteria: HotelMatchCriteria, hotel: HotelLike): number {
  if (
    typeof criteria.lat === 'number' &&
    typeof criteria.lng === 'number' &&
    typeof hotel.lat === 'number' &&
    typeof hotel.lng === 'number'
  ) {
    const distance = haversineKm(criteria.lat, criteria.lng, hotel.lat, hotel.lng);
    if (distance <= 5) return 40;
    if (distance <= 20) return 25;
    if (distance <= 50) return 10;
  }
  return 0;
}

export function scoreHotel(hotel: HotelLike, criteria: HotelMatchCriteria): number | null {
  const target = resolveTargetProvinceKey(criteria);
  const targetIsKnownProvince = Boolean(target) && knownProvinceKeys().includes(target);
  const hpk = hotelProvinceKey(hotel);

  if (targetIsKnownProvince && hpk && hpk !== target) return null;

  let score = 0;
  if (targetIsKnownProvince && hpk && hpk === target) score += 100;

  const targetDistrict = normalizeLocation(criteria.district);
  const hotelDistrict = normalizeLocation(hotel.district);
  if (targetDistrict && hotelDistrict && hotelDistrict === targetDistrict) score += 50;

  const dest = normalizeLocation(primarySegment(criteria.destination));
  const name = normalizeLocation(hotel.name);
  const addr = normalizeLocation(hotel.address);
  if (dest) {
    if (name.includes(dest) || dest.includes(name)) score += 30;
    if (addr.includes(dest)) score += 20;
  }

  score += coordScore(criteria, hotel);

  if (dest && score === 0) {
    const tokens = dest.split(' ').filter((token) => token.length > 2);
    if (tokens.some((token) => name.includes(token) || addr.includes(token))) score += 5;
  }

  if (typeof hotel.rating === 'number' && hotel.rating > 0) {
    score += Math.min(hotel.rating, 5);
  }

  return score;
}

export function matchHotels<T extends HotelLike>(hotels: T[], criteria: HotelMatchCriteria): T[] {
  return hotels
    .map((hotel) => ({ hotel, score: scoreHotel(hotel, criteria) }))
    .filter((entry): entry is { hotel: T; score: number } => entry.score !== null && entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.hotel);
}
