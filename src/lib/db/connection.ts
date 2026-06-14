import mongoose from 'mongoose';
import type { 
  User as PlainUser,
  Trip as PlainTrip,
  Place as PlainPlace,
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
} from '../../database/schema';

import { createCollection } from './collections';
import { 
  User, 
  Trip, 
  Place, 
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
  UserFollow 
} from './models';
import { AuditLog } from './audit';
import { createAllCollections } from './maintenance';

export let isConnected = false;
let collectionsEnsured = false;

export async function connectMongo(): Promise<'connected'> {
  if (isConnected) return 'connected';

  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGODB_URI (or MONGO_URI) is not defined in environment variables');
  }

  try {
    await mongoose.connect(uri);
    isConnected = true;

    if (!collectionsEnsured) {
      await createAllCollections();
      collectionsEnsured = true;
    }

    return 'connected';
  } catch (error) {
    throw error;
  }
}

export async function disconnectMongo(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
}

export type AppDatabase = {
  users: ReturnType<typeof createCollection<PlainUser>>;
  trips: ReturnType<typeof createCollection<PlainTrip>>;
  places: ReturnType<typeof createCollection<PlainPlace>>;
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
};

let dbInstance: AppDatabase | null = null;

export async function getDb(): Promise<AppDatabase> {
  await connectMongo();

  if (!dbInstance) {
    dbInstance = {
      users: createCollection<PlainUser>(User),
      trips: createCollection<PlainTrip>(Trip),
      places: createCollection<PlainPlace>(Place),
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
    };
  }

  return dbInstance;
}

export function resetConnectionState() {
  dbInstance = null;
  isConnected = false;
  collectionsEnsured = false;
}
