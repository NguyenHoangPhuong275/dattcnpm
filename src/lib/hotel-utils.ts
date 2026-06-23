import { HOTEL_PHOTOS } from '@/data/hotel-photos';

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index++) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function getHotelPhoto(seed: string): string {
  return HOTEL_PHOTOS[hashString(seed || 'hotel') % HOTEL_PHOTOS.length];
}

export function getHotelPhotos(seed: string, count = 3): string[] {
  const start = hashString(seed || 'hotel') % HOTEL_PHOTOS.length;
  const total = Math.min(count, HOTEL_PHOTOS.length);
  return Array.from({ length: total }, (_, index) => HOTEL_PHOTOS[(start + index) % HOTEL_PHOTOS.length]);
}

export function getHotelGradient(seed: string): string {
  const hue = hashString(seed || 'hotel') % 360;
  const hue2 = (hue + 40) % 360;
  return `linear-gradient(135deg, hsl(${hue} 55% 52%), hsl(${hue2} 62% 40%))`;
}

export function getHotelInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : 'K';
}

// Phải khớp images.remotePatterns trong next.config.ts.
const OPTIMIZABLE_IMAGE_HOSTS = new Set([
  'commons.wikimedia.org',
  'upload.wikimedia.org',
  'images.unsplash.com',
]);

export function isOptimizableImage(src: string): boolean {
  if (src.startsWith('/')) return true;
  try {
    const url = new URL(src);
    return (
      (url.protocol === 'https:' || url.protocol === 'http:') &&
      OPTIMIZABLE_IMAGE_HOSTS.has(url.hostname)
    );
  } catch {
    return false;
  }
}

export function isDisplayableImage(src: string): boolean {
  if (src.startsWith('/')) return true;
  try {
    const url = new URL(src);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}
