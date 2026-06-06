/**
 * MongoDB Document Schemas + Redis Cache Structures
 * 
 * This file defines the TypeScript types for the database layer.
 * 
 * ARCHITECTURE DECISION (per docs/01_SRS.md + docs/03_DATA_MODEL.md):
 * - Primary DB: MongoDB (Document Store) — flexible for OSM/POI data, geospatial queries.
 * - Cache / Session / Rate Limit: Redis.
 * - NO SQLite, NO Prisma in current design.
 * 
 * Naming: camelCase (matching the "Schema TypeScript tham khảo" in 03_DATA_MODEL.md).
 * Dates: native Date objects (driver will handle).
 * Soft deletes: deletedAt where applicable.
 * Flexible data: metadata / osmTags use Record<string, unknown>.
 * 
 * Indexes are noted in comments (to be created in MongoDB setup / Mongoose).
 * 
 * See also:
 * - docs/03_DATA_MODEL.md for the minimal reference + Redis key table.
 * - docs/01_SRS.md for full functional requirements (FR-01 to FR-17).
 */

/**
 * ID type for MongoDB documents.
 * 
 * Currently a plain string to avoid requiring the 'mongodb' package at this stage
 * of the project (see package.json / installation when you add the driver or Mongoose).
 * 
 * When you install the driver:
 *   1. npm install mongodb   (or mongoose)
 *   2. Change to: import type { ObjectId } from 'mongodb';
 *   3. Replace `MongoId` with `ObjectId` (or keep MongoId as a project-wide alias).
 */
export type MongoId = string;

// ============================================================
// MONGOOSE / MONGODB DOCUMENT INTERFACES
// ============================================================

export interface User {
  _id: MongoId;
  email: string;                 // unique, lowercase
  passwordHash: string;
  fullName: string;
  avatarUrl?: string | null;
  role: 'USER' | 'ADMIN';
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface Trip {
  _id: MongoId;
  userId: MongoId;
  title: string;
  description?: string | null;
  destination: string;
  startDate: Date;
  endDate: Date;
  isPublic: boolean;
  coverImage?: string | null;
  metadata?: Record<string, unknown> | null; // e.g. total cost summary, stats
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface Place {
  _id: MongoId;
  osmId?: string | null;                 // for dedup from OpenStreetMap
  name: string;
  type: string;                          // restaurant | hotel | attraction | ...
  lat: number;
  lng: number;
  address?: string | null;
  openingHours?: string | null;
  images?: string[] | null;
  osmTags?: Record<string, unknown> | null; // raw OSM tags (flexible)
  tags?: string[] | null;                // normalized tags for recommendation
  ratingAvg: number;
  ratingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ItineraryItem {
  _id: MongoId;
  tripId: MongoId;
  placeId: MongoId;
  day: number;                           // 1-based day of the trip
  orderIndex: number;
  note?: string | null;
  startTime?: Date | null;
  endTime?: Date | null;
  cost?: number | null;
  currency?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FavoritePlace {
  _id: MongoId;
  userId: MongoId;
  placeId: MongoId;
  createdAt: Date;
}

export interface SearchHistory {
  _id: MongoId;
  userId?: MongoId | null;              // null for guests
  query: string;
  lat?: number | null;
  lng?: number | null;
  resultCount?: number | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
}

export interface AuditLog {
  _id: MongoId;
  userId?: MongoId | null;
  action: string;                        // e.g. 'CREATE_TRIP', 'UPDATE_PLACE', 'LOGIN'
  targetType: string;                    // 'Trip' | 'Place' | 'User' | ...
  targetId?: MongoId | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
}

export interface Review {
  _id: MongoId;
  userId: MongoId;
  placeId: MongoId;
  parentId?: MongoId | null;            // for threaded comments/replies
  rating: number;                        // 1-5
  comment?: string | null;
  images?: string[] | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface TripShare {
  _id: MongoId;
  tripId: MongoId;
  sharedByUserId: MongoId;
  sharedWithUserId?: MongoId | null;    // null = share via code (public link)
  permission: 'READ' | 'EDIT';
  shareCode?: string | null;             // for unauthenticated share links
  expiresAt?: Date | null;
  createdAt: Date;
}

export interface Notification {
  _id: MongoId;
  userId: MongoId;
  title: string;
  content: string;
  type: 'TRIP_SHARE' | 'SYSTEM' | 'WEATHER_ALERT' | 'RECOMMENDATION';
  isRead: boolean;
  actionUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
}

export interface Tag {
  _id: MongoId;
  name: string;
  category: string;                      // e.g. 'cuisine', 'activity', 'mood'
  createdAt: Date;
}

// Join collection for many-to-many (or can be embedded in Place if small)
export interface PlaceTag {
  _id?: MongoId;
  placeId: MongoId;
  tagId: MongoId;
}

export interface UserPreference {
  _id: MongoId;
  userId: MongoId;
  tagId: MongoId;
  preferenceScore: number;               // e.g. 0-100 for rule-based recs (FR-13a)
  updatedAt: Date;
}

export interface TripBudget {
  _id: MongoId;
  tripId: MongoId;
  category: 'TRANSPORT' | 'ACCOMMODATION' | 'FOOD' | 'ACTIVITY' | 'OTHER';
  estimatedAmount: number;
  actualAmount?: number | null;
  currency: string;
  note?: string | null;
  createdAt: Date;
}

export interface ItineraryTransport {
  _id: MongoId;
  tripId: MongoId;
  fromItemId: MongoId;                  // previous ItineraryItem
  toItemId: MongoId;                    // next ItineraryItem
  transportMode: 'WALK' | 'BIKE' | 'CAR' | 'BUS' | 'TAXI' | 'OTHER';
  durationMinutes?: number | null;
  distanceKm?: number | null;
  note?: string | null;
}

export interface TripAccommodation {
  _id: MongoId;
  tripId: MongoId;
  placeId?: MongoId | null;             // link to a Place if it's a known POI
  name: string;
  checkIn: Date;
  checkOut: Date;
  bookingRef?: string | null;
  cost?: number | null;
  currency: string;
  note?: string | null;
  createdAt: Date;
}

export interface TripChecklist {
  _id: MongoId;
  tripId: MongoId;
  label: string;
  isDone: boolean;
  dueDate?: Date | null;
  createdAt: Date;
}

export interface UserFollow {
  _id: MongoId;
  followerId: MongoId;
  followingId: MongoId;
  createdAt: Date;
}

// ============================================================
// REDIS STRUCTURES (per docs/03_DATA_MODEL.md)
// ============================================================

/**
 * Redis is used for:
 * - API response caching (geocoding, POI, weather) to respect rate limits of free tiers.
 * - Rate limiting (login, search).
 * - Session storage + JWT token blacklist (for logout/invalidation).
 */

export interface CachedGeoResult {
  query: string;
  lat: number;
  lng: number;
  displayName?: string;
  // additional normalized fields as needed
}

export interface CachedPOI {
  lat: number;
  lng: number;
  radius: number;
  type?: string;
  places: Array<Pick<Place, '_id' | 'name' | 'type' | 'lat' | 'lng' | 'address'>>;
}

export interface CachedWeather {
  lat: number;
  lng: number;
  current: Record<string, unknown>;
  forecast?: Record<string, unknown>[];
  fetchedAt: Date;
}

export interface RateLimitEntry {
  count: number;
  firstAttempt: number; // timestamp
}

export interface SessionData {
  userId: string; // MongoId as string
  role: 'USER' | 'ADMIN';
  // any other session claims
}

export interface BlacklistEntry {
  // value is usually just "1" or a small marker
  reason?: string;
}

// Key pattern helpers (use these when reading/writing Redis to keep consistency)
export const RedisKey = {
  geoSearch: (query: string) => `geo:search:${encodeURIComponent(query)}`,
  poi: (lat: number, lng: number, radius: number, type = 'all') =>
    `poi:${lat.toFixed(4)}:${lng.toFixed(4)}:${radius}:${type}`,
  weather: (lat: number, lng: number) => `weather:${lat.toFixed(4)}:${lng.toFixed(4)}`,
  rateLimitLogin: (ip: string) => `rl:login:${ip}`,
  rateLimitSearch: (ip: string) => `rl:search:${ip}`,
  session: (sessionId: string) => `session:${sessionId}`,
  tokenBlacklist: (jti: string) => `blacklist:${jti}`,
} as const;

// ============================================================
// INDEX RECOMMENDATIONS (implement in setup / Mongoose schema)
// ============================================================
//
// users:       { email: 1 } (unique)
// trips:       { userId: 1, startDate: -1 }
// places:      { osmId: 1 } (unique, sparse)
// places:      { lat: 1, lng: 1 }  + 2dsphere index on { location: "2dsphere" } (add a GeoJSON field if doing advanced queries)
// places:      { tags: 1 }
// favoritePlaces: { userId: 1, placeId: 1 } (unique)
// searchHistories: { userId: 1, createdAt: -1 }
// auditLogs:   { createdAt: -1 }
// reviews:     { placeId: 1, createdAt: -1 }
// tripShares:  { tripId: 1 }
// notifications: { userId: 1, isRead: 1, createdAt: -1 }
// userFollows: { followerId: 1 }, { followingId: 1 }
// (add more as features grow)

export type MongoDocument =
  | User
  | Trip
  | Place
  | ItineraryItem
  | FavoritePlace
  | SearchHistory
  | AuditLog
  | Review
  | TripShare
  | Notification
  | Tag
  | PlaceTag
  | UserPreference
  | TripBudget
  | ItineraryTransport
  | TripAccommodation
  | TripChecklist
  | UserFollow;
