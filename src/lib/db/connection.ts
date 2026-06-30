import mongoose from 'mongoose';
import { env } from '@/lib/env';
import type {
  User as PlainUser,
  Trip as PlainTrip,
  Place as PlainPlace,
  Hotel as PlainHotel,
  HotelReview as PlainHotelReview,
  ItineraryItem as PlainItineraryItem,
  FavoritePlace as PlainFavoritePlace,
  Review as PlainReview,
  AuditLog as PlainAuditLog,
  SearchHistory as PlainSearchHistory,
  TripShare as PlainTripShare,
  Notification as PlainNotification,
  Tag as PlainTag,
  UserPreference as PlainUserPreference,
  TripBudget as PlainTripBudget,
  TripAccommodation as PlainTripAccommodation,
  TripChecklist as PlainTripChecklist,
  UserFollow as PlainUserFollow,
  ReviewReport as PlainReviewReport,
} from './schema';

import { createCollection } from './collections';
import {
  User,
  Trip,
  Place,
  Hotel,
  HotelReview,
  Review,
  ItineraryItem,
  FavoritePlace,
  SearchHistory,
  TripShare,
  Notification,
  Tag,
  UserPreference,
  TripBudget,
  TripAccommodation,
  TripChecklist,
  UserFollow,
  ReviewReport,
} from './models';
import { AuditLog } from './audit';
import { createAllCollections } from './maintenance';

export let isConnected = false;
let collectionsEnsured = false;
let connectPromise: Promise<unknown> | null = null;

const CONNECT_OPTIONS = {
  serverSelectionTimeoutMS: 8000,
};

const PUBLIC_DNS_SERVERS = ['8.8.8.8', '1.1.1.1'];
let dnsResolverEnsured = false;

function ensureReliableDnsResolver(uri: string): void {
  if (dnsResolverEnsured) return;
  dnsResolverEnsured = true;
  if (!uri.startsWith('mongodb+srv://')) return;
  const getBuiltinModule = (globalThis as typeof globalThis & {
    process?: { getBuiltinModule?: (id: string) => unknown };
  }).process?.getBuiltinModule;
  if (typeof getBuiltinModule !== 'function') return;
  try {
    const dns = getBuiltinModule('node:dns') as typeof import('node:dns');
    const current = dns.getServers();
    if (PUBLIC_DNS_SERVERS.every((s) => current.includes(s))) return;
    dns.setServers([...PUBLIC_DNS_SERVERS, ...current.filter((s) => !PUBLIC_DNS_SERVERS.includes(s))]);
  } catch {
    // Không set được thì giữ nguyên resolver hệ thống.
  }
}

async function connectWithRetry(uri: string): Promise<typeof mongoose> {
  ensureReliableDnsResolver(uri);
  const maxAttempts = 3;
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await mongoose.connect(uri, CONNECT_OPTIONS);
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
      }
    }
  }
  throw lastError;
}

async function ensureCollections(): Promise<void> {
  if (!collectionsEnsured) {
    await createAllCollections();
    collectionsEnsured = true;
  }
}

export async function connectMongo(): Promise<'connected'> {
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    await ensureCollections();
    return 'connected';
  }

  if (!connectPromise) {
    connectPromise = (
      mongoose.connection.readyState === 2
        ? mongoose.connection.asPromise()
        : connectWithRetry(env.MONGODB_URI)
    ).finally(() => {
      connectPromise = null;
    });
  }

  try {
    await connectPromise;
    isConnected = true;
  } catch (error) {
    isConnected = false;
    throw error;
  }

  await ensureCollections();
  return 'connected';
}

export async function disconnectMongo(): Promise<void> {
  if (mongoose.connection.readyState === 0) {
    isConnected = false;
    return;
  }
  await mongoose.disconnect();
  isConnected = false;
}

export type AppDatabase = {
  users: ReturnType<typeof createCollection<PlainUser>>;
  trips: ReturnType<typeof createCollection<PlainTrip>>;
  places: ReturnType<typeof createCollection<PlainPlace>>;
  hotels: ReturnType<typeof createCollection<PlainHotel>>;
  hotelReviews: ReturnType<typeof createCollection<PlainHotelReview>>;
  itineraryItems: ReturnType<typeof createCollection<PlainItineraryItem>>;
  favorites: ReturnType<typeof createCollection<PlainFavoritePlace>>;
  reviews: ReturnType<typeof createCollection<PlainReview>>;
  auditLogs: ReturnType<typeof createCollection<PlainAuditLog>>;
  searchHistories: ReturnType<typeof createCollection<PlainSearchHistory>>;
  tripShares: ReturnType<typeof createCollection<PlainTripShare>>;
  notifications: ReturnType<typeof createCollection<PlainNotification>>;
  tags: ReturnType<typeof createCollection<PlainTag>>;
  userPreferences: ReturnType<typeof createCollection<PlainUserPreference>>;
  tripBudgets: ReturnType<typeof createCollection<PlainTripBudget>>;
  tripAccommodations: ReturnType<typeof createCollection<PlainTripAccommodation>>;
  tripChecklists: ReturnType<typeof createCollection<PlainTripChecklist>>;
  userFollows: ReturnType<typeof createCollection<PlainUserFollow>>;
  reviewReports: ReturnType<typeof createCollection<PlainReviewReport>>;
};

let dbInstance: AppDatabase | null = null;

export async function getDb(): Promise<AppDatabase> {
  await connectMongo();

  if (!dbInstance) {
    dbInstance = {
      users: createCollection<PlainUser>(User),
      trips: createCollection<PlainTrip>(Trip),
      places: createCollection<PlainPlace>(Place),
      hotels: createCollection<PlainHotel>(Hotel),
      hotelReviews: createCollection<PlainHotelReview>(HotelReview),
      itineraryItems: createCollection<PlainItineraryItem>(ItineraryItem),
      favorites: createCollection<PlainFavoritePlace>(FavoritePlace),
      reviews: createCollection<PlainReview>(Review),
      auditLogs: createCollection<PlainAuditLog>(AuditLog),
      searchHistories: createCollection<PlainSearchHistory>(SearchHistory),
      tripShares: createCollection<PlainTripShare>(TripShare),
      notifications: createCollection<PlainNotification>(Notification),
      tags: createCollection<PlainTag>(Tag),
      userPreferences: createCollection<PlainUserPreference>(UserPreference),
      tripBudgets: createCollection<PlainTripBudget>(TripBudget),
      tripAccommodations: createCollection<PlainTripAccommodation>(TripAccommodation),
      tripChecklists: createCollection<PlainTripChecklist>(TripChecklist),
      userFollows: createCollection<PlainUserFollow>(UserFollow),
      reviewReports: createCollection<PlainReviewReport>(ReviewReport),
    };
  }

  return dbInstance;
}

export function resetConnectionState() {
  dbInstance = null;
  isConnected = false;
  collectionsEnsured = false;
  connectPromise = null;
}
