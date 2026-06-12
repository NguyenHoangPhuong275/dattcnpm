export const ROUTES = {
  home: '/',
  trips: '/trips',
  profile: '/profile',
  local: '/local',
} as const;

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  BAD_REQUEST: 'BAD_REQUEST',
  GONE: 'GONE',
} as const;

export const DEFAULT_TRIP_IMAGE = '/images/hanoi_temple.jpg';
export const DEFAULT_LOCALE = 'vi-VN';
export const DEFAULT_CURRENCY = 'VND';
