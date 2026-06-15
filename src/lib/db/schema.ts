
export type MongoId = string;

export interface User {
  _id: MongoId;
  email: string;
  passwordHash: string;
  fullName: string;
  avatarUrl?: string | null;
  role: 'USER' | 'ADMIN';
  isLocked: boolean;
  emailVerified: boolean;
  emailVerifiedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  
  phone?: string | null;
  dateOfBirth?: Date | null;
  gender?: 'Nam' | 'Nữ' | 'Khác' | null;
  nationality?: string | null;
  preferredLanguage?: string | null;
  homeCity?: string | null;
  emergencyContact?: {
    name?: string | null;
    phone?: string | null;
  } | null;

  
  travelStyles?: string[];
  budgetLevel?: string | null;
  preferredDestinations?: string[];
  interests?: string[];  

  
  twoFactorEnabled?: boolean | null;
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
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface Place {
  _id: MongoId;
  osmId?: string | null;
  name: string;
  type: string;
  lat: number;
  lng: number;
  address?: string | null;
  openingHours?: string | null;
  images?: string[] | null;
  osmTags?: Record<string, unknown> | null;
  tags?: string[] | null;
  ratingAvg: number;
  ratingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ItineraryItem {
  _id: MongoId;
  tripId: MongoId;
  placeId: MongoId;
  day: number;
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
  userId?: MongoId | null;
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
  action: string;
  targetType: string;
  targetId?: MongoId | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
}

export interface Review {
  _id: MongoId;
  userId: MongoId;
  placeId: MongoId;
  parentId?: MongoId | null;
  rating: number;
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
  sharedWithUserId?: MongoId | null;
  permission: 'READ' | 'EDIT';
  shareCode?: string | null;
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
  category: string;
  createdAt: Date;
}

export interface PlaceTag {
  _id: MongoId;
  placeId: MongoId;
  tagId: MongoId;
}

export interface UserPreference {
  _id: MongoId;
  userId: MongoId;
  tagId: MongoId;
  preferenceScore: number;
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
  fromItemId: MongoId;
  toItemId: MongoId;
  transportMode: 'WALK' | 'BIKE' | 'CAR' | 'BUS' | 'TAXI' | 'OTHER';
  durationMinutes?: number | null;
  distanceKm?: number | null;
  note?: string | null;
}

export interface TripAccommodation {
  _id: MongoId;
  tripId: MongoId;
  placeId?: MongoId | null;
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

export interface CachedGeoResult {
  query: string;
  lat: number;
  lng: number;
  displayName?: string;

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
  firstAttempt: number;
}

export interface SessionData {
  userId: string;
  role: 'USER' | 'ADMIN';

}

export interface BlacklistEntry {

  reason?: string;
}

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
