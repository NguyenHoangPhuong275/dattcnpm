/**
 * Application Constants
 * 
 * Central place for magic strings, configuration values, and enums.
 * This improves maintainability and prevents typos.
 */

// ==================== USER ROLES ====================
export const USER_ROLES = {
  USER: "USER",
  ADMIN: "ADMIN",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// ==================== DATABASE COLLECTIONS ====================
export const COLLECTIONS = {
  USERS: "users",
  TRIPS: "trips",
  PLACES: "places",
  ITINERARY_ITEMS: "itineraryItems",
  FAVORITE_PLACES: "favoritePlaces",
  SEARCH_HISTORIES: "searchHistories",
  AUDIT_LOGS: "auditLogs",
} as const;

// ==================== REDIS KEY PREFIXES ====================
// Using consistent prefixes makes debugging and monitoring much easier
export const REDIS_KEYS = {
  GEO_SEARCH: "geo:search",
  POI: "poi",
  WEATHER: "weather",
  RATE_LIMIT_LOGIN: "rl:login",
  RATE_LIMIT_SEARCH: "rl:search",
  TOKEN_BLACKLIST: "blacklist",
  SESSION: "session",
} as const;

// ==================== AUDIT LOG ACTIONS ====================
export const AUDIT_ACTIONS = {
  CREATE_TRIP: "CREATE_TRIP",
  UPDATE_TRIP: "UPDATE_TRIP",
  DELETE_TRIP: "DELETE_TRIP",
  ADD_ITINERARY_ITEM: "ADD_ITINERARY_ITEM",
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  USER_LOCKED: "USER_LOCKED",
  USER_UNLOCKED: "USER_UNLOCKED",
} as const;

// ==================== ERROR MESSAGES (for consistency) ====================
export const ERROR_MESSAGES = {
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Forbidden",
  NOT_FOUND: "Resource not found",
  VALIDATION_ERROR: "Validation error",
  INTERNAL_ERROR: "Internal server error",
  RATE_LIMIT_EXCEEDED: "Too many requests, please try again later",
} as const;