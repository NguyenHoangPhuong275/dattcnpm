import mongoose, { Schema, model, models, Document, Types, Model } from 'mongoose';


import type { 
  MongoId,
  User as PlainUser,
  Trip as PlainTrip,
  Place as PlainPlace,
  ItineraryItem as PlainItineraryItem,
  FavoritePlace as PlainFavoritePlace,
  SearchHistory as PlainSearchHistory,
  AuditLog as PlainAuditLog,
  Review as PlainReview,
  TripShare as PlainTripShare,
  Notification as PlainNotification,
  Tag as PlainTag,
  UserPreference as PlainUserPreference,
  TripBudget as PlainTripBudget,
  TripAccommodation as PlainTripAccommodation,
  TripChecklist as PlainTripChecklist,
  UserFollow as PlainUserFollow,
} from '../database/schema';

export const COLLECTIONS = {
  users: 'users',
  trips: 'trips',
  places: 'places',
  itineraryItems: 'itinerary_items',
  favorites: 'favorite_places',
  reviews: 'reviews',
  auditLogs: 'audit_logs',
  searchHistories: 'search_histories',
  tripShares: 'trip_shares',
  notifications: 'notifications',
  tags: 'tags',
  userPreferences: 'user_preferences',
  tripBudgets: 'trip_budgets',
  tripAccommodations: 'trip_accommodations',
  tripChecklists: 'trip_checklists',
  userFollows: 'user_follows',
} as const;

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];

export const MANAGED_COLLECTIONS: CollectionName[] = Object.values(COLLECTIONS);

function toPlain<T>(doc: unknown): T | undefined {
  if (!doc) return undefined;
  const mongooseDoc = doc as { toObject?: () => Record<string, unknown> };
  const obj: Record<string, unknown> = mongooseDoc.toObject
    ? mongooseDoc.toObject()
    : { ...(doc as Record<string, unknown>) };
  if (obj._id) {
    obj._id = String(obj._id);
    obj.id = obj._id;
  }
  return obj as T;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
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

  
  phone?: string | null | undefined;
  dateOfBirth?: Date | null | undefined;
  gender?: 'Nam' | 'Nữ' | 'Khác' | null | undefined;
  nationality?: string | null | undefined;
  preferredLanguage?: string | null | undefined;
  homeCity?: string | null | undefined;
  emergencyContact?: {
    name?: string | null;
    phone?: string | null;
  } | null | undefined;

  
  travelStyles?: string[];
  budgetLevel?: string | null | undefined;
  preferredDestinations?: string[];
  interests?: string[];

  
  twoFactorEnabled?: boolean | null | undefined;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    avatarUrl: { type: String, default: null },
    role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
    isLocked: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },

    
    phone: { type: String, default: null },
    dateOfBirth: { type: Date, default: null },
    gender: { type: String, enum: ['Nam', 'Nữ', 'Khác'], default: null },
    nationality: { type: String, default: null },
    preferredLanguage: { type: String, default: null },
    homeCity: { type: String, default: null },
    emergencyContact: {
      name: { type: String, default: null },
      phone: { type: String, default: null },
    },

    
    travelStyles: { type: [String], default: [] },
    budgetLevel: { type: String, default: null },
    preferredDestinations: { type: [String], default: [] },
    interests: { type: [String], default: [] },

    
    twoFactorEnabled: { type: Boolean, default: false },
  },
  { timestamps: true, collection: COLLECTIONS.users }
);
export type PlainUserWithId = PlainUser & { id: string };

export const User: Model<IUser> = models.User || model<IUser>('User', UserSchema);

export async function getUserById(userId: string): Promise<PlainUser | null> {
  if (!userId) return null;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    if (userId === 'test-user-phuong') {
      return {
        _id: 'test-user-phuong',
        id: 'test-user-phuong',
        email: (process.env.DEFAULT_TEST_EMAIL || 'test@example.com').toLowerCase().trim(),
        fullName: 'Nguyễn Hoàng Phương (Test)',
        role: 'USER',
        avatarUrl: null,
        isLocked: false,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as PlainUserWithId;
    }
    return null;
  }
  const user = await User.findById(userId).lean();
  return user ? (toPlain<PlainUser>(user) ?? null) : null;
}

export async function updateUserProfile(userId: string, updates: Partial<IUser>): Promise<PlainUser | null> {
  if (!userId) return null;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    if (userId === 'test-user-phuong') {
      return {
        _id: 'test-user-phuong',
        id: 'test-user-phuong',
        email: (process.env.DEFAULT_TEST_EMAIL || 'test@example.com').toLowerCase().trim(),
        fullName: 'Nguyễn Hoàng Phương (Test)',
        role: 'USER',
        avatarUrl: null,
        isLocked: false,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...updates,
      } as PlainUserWithId;
    }
    return null;
  }
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updates },
    { returnDocument: 'after', lean: true }
  );
  return user ? (toPlain<PlainUser>(user) ?? null) : null;
}

export interface ITrip extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
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

const TripSchema = new Schema<ITrip>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, default: null },
  destination: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isPublic: { type: Boolean, default: false },
  coverImage: { type: String, default: null },
  metadata: { type: Object, default: null },
  deletedAt: { type: Date, default: null },
}, { timestamps: true, collection: COLLECTIONS.trips });

export const Trip: Model<ITrip> = models.Trip || model<ITrip>('Trip', TripSchema);

export interface IPlace extends Document {
  _id: Types.ObjectId;
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

const PlaceSchema = new Schema<IPlace>({
  osmId: { type: String, default: null },
  name: { type: String, required: true },
  type: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  address: { type: String, default: null },
  openingHours: { type: String, default: null },
  images: { type: [String], default: null },
  osmTags: { type: Object, default: null },
  tags: { type: [String], default: null },
  ratingAvg: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
}, { timestamps: true, collection: COLLECTIONS.places });

export const Place: Model<IPlace> = models.Place || model<IPlace>('Place', PlaceSchema);

export interface IItineraryItem extends Document {
  _id: Types.ObjectId;
  tripId: Types.ObjectId;
  placeId: Types.ObjectId;
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

const ItineraryItemSchema = new Schema<IItineraryItem>({
  tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
  placeId: { type: Schema.Types.ObjectId, ref: 'Place', required: true },
  day: { type: Number, required: true },
  orderIndex: { type: Number, required: true },
  note: { type: String, default: null },
  startTime: { type: Date, default: null },
  endTime: { type: Date, default: null },
  cost: { type: Number, default: null },
  currency: { type: String, default: null },
  metadata: { type: Object, default: null },
}, { timestamps: true, collection: COLLECTIONS.itineraryItems });

export const ItineraryItem: Model<IItineraryItem> = models.ItineraryItem || model<IItineraryItem>('ItineraryItem', ItineraryItemSchema);

export interface IFavoritePlace extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  placeId: Types.ObjectId;
  createdAt: Date;
}

const FavoritePlaceSchema = new Schema<IFavoritePlace>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  placeId: { type: Schema.Types.ObjectId, ref: 'Place', required: true },
}, { timestamps: { createdAt: true, updatedAt: false }, collection: COLLECTIONS.favorites });

export const FavoritePlace: Model<IFavoritePlace> = models.FavoritePlace || model<IFavoritePlace>('FavoritePlace', FavoritePlaceSchema);

export interface IReview extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  placeId: Types.ObjectId;
  parentId?: Types.ObjectId | null;
  rating: number;
  comment?: string | null;
  images?: string[] | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const ReviewSchema = new Schema<IReview>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  placeId: { type: Schema.Types.ObjectId, ref: 'Place', required: true },
  parentId: { type: Schema.Types.ObjectId, ref: 'Review', default: null },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: null },
  images: { type: [String], default: null },
  deletedAt: { type: Date, default: null },
}, { timestamps: true, collection: COLLECTIONS.reviews });

export const Review: Model<IReview> = models.Review || model<IReview>('Review', ReviewSchema);

export interface IAuditLog extends Document {
  userId?: Types.ObjectId | null;
  action: string;
  targetType: string;
  targetId?: Types.ObjectId | null;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  action: { type: String, required: true },
  targetType: { type: String, required: true },
  targetId: { type: Schema.Types.ObjectId, default: null },
  metadata: { type: Object, default: {} },
}, { timestamps: { createdAt: true, updatedAt: false }, collection: COLLECTIONS.auditLogs });

export const AuditLog: Model<IAuditLog> = models.AuditLog || model<IAuditLog>('AuditLog', AuditLogSchema);


export interface ISearchHistory extends Document {
  _id: Types.ObjectId;
  userId?: Types.ObjectId | null;
  query: string;
  lat?: number | null;
  lng?: number | null;
  resultCount?: number | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
}
const SearchHistorySchema = new Schema<ISearchHistory>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  query: { type: String, required: true },
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
  resultCount: { type: Number, default: null },
  metadata: { type: Object, default: null },
}, { timestamps: { createdAt: true, updatedAt: false }, collection: COLLECTIONS.searchHistories });
export const SearchHistory: Model<ISearchHistory> = models.SearchHistory || model<ISearchHistory>('SearchHistory', SearchHistorySchema);

export interface ITripShare extends Document {
  _id: Types.ObjectId;
  tripId: Types.ObjectId;
  sharedByUserId: Types.ObjectId;
  sharedWithUserId?: Types.ObjectId | null;
  permission: 'READ' | 'EDIT';
  shareCode?: string | null;
  expiresAt?: Date | null;
  createdAt: Date;
}
const TripShareSchema = new Schema<ITripShare>({
  tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
  sharedByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sharedWithUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  permission: { type: String, enum: ['READ', 'EDIT'], default: 'READ' },
  shareCode: { type: String, default: null },
  expiresAt: { type: Date, default: null },
}, { timestamps: { createdAt: true, updatedAt: false }, collection: COLLECTIONS.tripShares });
export const TripShare: Model<ITripShare> = models.TripShare || model<ITripShare>('TripShare', TripShareSchema);

export interface INotification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  content: string;
  type: 'TRIP_SHARE' | 'SYSTEM' | 'WEATHER_ALERT' | 'RECOMMENDATION';
  isRead: boolean;
  actionUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
}
const NotificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: 'Thông báo hệ thống' },
  content: { type: String, required: true },
  type: { type: String, enum: ['TRIP_SHARE', 'SYSTEM', 'WEATHER_ALERT', 'RECOMMENDATION'], default: 'SYSTEM' },
  isRead: { type: Boolean, default: false },
  actionUrl: { type: String, default: null },
  metadata: { type: Object, default: null },
}, { timestamps: { createdAt: true, updatedAt: false }, collection: COLLECTIONS.notifications });
export const Notification: Model<INotification> = models.Notification || model<INotification>('Notification', NotificationSchema);

export interface ITag extends Document {
  _id: Types.ObjectId;
  name: string;
  category: string;
  createdAt: Date;
}
const TagSchema = new Schema<ITag>({
  name: { type: String, required: true, unique: true },
  category: { type: String, default: 'general' },
}, { timestamps: { createdAt: true, updatedAt: false }, collection: COLLECTIONS.tags });
export const Tag: Model<ITag> = models.Tag || model<ITag>('Tag', TagSchema);

export interface IUserPreference extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  tagId: Types.ObjectId;
  preferenceScore: number;
  updatedAt: Date;
}
const UserPreferenceSchema = new Schema<IUserPreference>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tagId: { type: Schema.Types.ObjectId, ref: 'Tag', required: true },
  preferenceScore: { type: Number, default: 0 },
}, { timestamps: { createdAt: false, updatedAt: true }, collection: COLLECTIONS.userPreferences });
export const UserPreference: Model<IUserPreference> = models.UserPreference || model<IUserPreference>('UserPreference', UserPreferenceSchema);

export interface ITripBudget extends Document {
  _id: Types.ObjectId;
  tripId: Types.ObjectId;
  category: 'TRANSPORT' | 'ACCOMMODATION' | 'FOOD' | 'ACTIVITY' | 'OTHER';
  estimatedAmount: number;
  actualAmount?: number | null;
  currency: string;
  note?: string | null;
  createdAt: Date;
}
const TripBudgetSchema = new Schema<ITripBudget>({
  tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
  category: { type: String, enum: ['TRANSPORT', 'ACCOMMODATION', 'FOOD', 'ACTIVITY', 'OTHER'], required: true },
  estimatedAmount: { type: Number, required: true },
  actualAmount: { type: Number, default: null },
  currency: { type: String, default: 'VND' },
  note: { type: String, default: null },
}, { timestamps: { createdAt: true, updatedAt: false }, collection: COLLECTIONS.tripBudgets });
export const TripBudget: Model<ITripBudget> = models.TripBudget || model<ITripBudget>('TripBudget', TripBudgetSchema);

export interface ITripAccommodation extends Document {
  _id: Types.ObjectId;
  tripId: Types.ObjectId;
  placeId?: Types.ObjectId | null;
  name: string;
  checkIn: Date;
  checkOut: Date;
  bookingRef?: string | null;
  cost?: number | null;
  currency: string;
  note?: string | null;
  createdAt: Date;
}
const TripAccommodationSchema = new Schema<ITripAccommodation>({
  tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
  placeId: { type: Schema.Types.ObjectId, ref: 'Place', default: null },
  name: { type: String, required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  bookingRef: { type: String, default: null },
  cost: { type: Number, default: null },
  currency: { type: String, default: 'VND' },
  note: { type: String, default: null },
}, { timestamps: { createdAt: true, updatedAt: false }, collection: COLLECTIONS.tripAccommodations });
export const TripAccommodation: Model<ITripAccommodation> = models.TripAccommodation || model<ITripAccommodation>('TripAccommodation', TripAccommodationSchema);

export interface ITripChecklist extends Document {
  _id: Types.ObjectId;
  tripId: Types.ObjectId;
  label: string;
  isDone: boolean;
  dueDate?: Date | null;
  createdAt: Date;
}
const TripChecklistSchema = new Schema<ITripChecklist>({
  tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
  label: { type: String, required: true },
  isDone: { type: Boolean, default: false },
  dueDate: { type: Date, default: null },
}, { timestamps: { createdAt: true, updatedAt: false }, collection: COLLECTIONS.tripChecklists });
export const TripChecklist: Model<ITripChecklist> = models.TripChecklist || model<ITripChecklist>('TripChecklist', TripChecklistSchema);

export interface IUserFollow extends Document {
  _id: Types.ObjectId;
  followerId: Types.ObjectId;
  followingId: Types.ObjectId;
  createdAt: Date;
}
const UserFollowSchema = new Schema<IUserFollow>({
  followerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  followingId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: { createdAt: true, updatedAt: false }, collection: COLLECTIONS.userFollows });
export const UserFollow: Model<IUserFollow> = models.UserFollow || model<IUserFollow>('UserFollow', UserFollowSchema);

let isConnected = false;
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

function createCollection<T extends { _id: MongoId }>(mongooseModel: Model<any>) {
  type Filter = Record<string, unknown>;
  type InsertInput = Record<string, unknown>;

  return {
    async findOne(filter: Filter = {}): Promise<T | undefined> {
      const doc = await mongooseModel.findOne(filter).lean();
      return doc ? toPlain<T>(doc) : undefined;
    },
    async find(filter: Filter = {}): Promise<T[]> {
      const docs = await mongooseModel.find(filter).lean();
      return docs.map((d: unknown) => toPlain<T>(d)).filter((d): d is T => !!d);
    },
    async findById(id: MongoId): Promise<T | undefined> {
      if (!id || !mongoose.Types.ObjectId.isValid(String(id))) return undefined;
      const doc = await mongooseModel.findById(id).lean();
      return doc ? toPlain<T>(doc) : undefined;
    },
    async insertOne(doc: InsertInput): Promise<T> {
      const created = await mongooseModel.create(doc);
      const plain = toPlain<T>(created);
      if (!plain) throw new Error('Failed to create document');
      return plain;
    },
    async insertMany(docs: InsertInput[]): Promise<T[]> {
      if (!docs.length) return [];
      const created = await mongooseModel.create(docs);
      const arr = Array.isArray(created) ? created : [created];
      return arr.map((c: unknown) => toPlain<T>(c)).filter((d): d is T => !!d);
    },
    async updateOne(id: MongoId, update: Record<string, unknown>): Promise<T | null> {
      if (!id || !mongoose.Types.ObjectId.isValid(String(id))) return null;
      const updated = await mongooseModel.findByIdAndUpdate(id, update, { returnDocument: 'after' }).lean();
      return updated ? toPlain<T>(updated) ?? null : null;
    },
    async deleteOne(id: MongoId): Promise<boolean> {
      if (!id || !mongoose.Types.ObjectId.isValid(String(id))) return false;
      const res = await mongooseModel.findByIdAndDelete(id);
      return !!res;
    },
    async deleteMany(filter: Filter = {}): Promise<number> {
      const res = await mongooseModel.deleteMany(filter);
      return res.deletedCount || 0;
    },
    async reset(): Promise<void> {
      try {
        await mongooseModel.collection.drop();
      } catch (err: unknown) {
        if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: number }).code === 26) return;
        throw err;
      }
    },
    async count(filter: Filter = {}): Promise<number> {
      return mongooseModel.countDocuments(filter);
    },
  };
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

export async function findUserByEmail(email: string) {
  const db = await getDb();
  return db.users.findOne({ email: email.toLowerCase() });
}

export async function createAuditLog(
  userId: MongoId | null,
  action: string,
  targetType: string,
  targetId?: MongoId,
  metadata?: Record<string, unknown>
) {
  const db = await getDb();
  return db.auditLogs.insertOne({
    userId: userId || undefined,
    action,
    targetType,
    targetId: targetId || undefined,
    metadata: metadata || {},
  });
}

export async function listManagedCollections(): Promise<string[]> {
  await connectMongo();
  const db = mongoose.connection.db;
  if (!db) return [];
  const cols = await db.listCollections().toArray();
  return cols.map((c) => c.name).filter((name) => MANAGED_COLLECTIONS.includes(name as CollectionName));
}

export async function dropAllManagedCollections(): Promise<string[]> {
  await connectMongo();
  const db = mongoose.connection.db;
  if (!db) return [];

  const dropped: string[] = [];
  for (const name of MANAGED_COLLECTIONS) {
    try {
      await db.dropCollection(name);
      dropped.push(name);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: number }).code === 26) continue;
      throw err;
    }
  }
  dbInstance = null;
  return dropped;
}

export async function dropUnknownCollections(): Promise<string[]> {
  await connectMongo();
  const db = mongoose.connection.db;
  if (!db) return [];

  const cols = await db.listCollections().toArray();
  const known = new Set(MANAGED_COLLECTIONS);
  const dropped: string[] = [];

  for (const col of cols) {
    if (!known.has(col.name as CollectionName)) {
      try {
        await db.dropCollection(col.name);
        dropped.push(col.name);
      } catch (err: unknown) {
        if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: number }).code === 26) continue;
        throw err;
      }
    }
  }

  return dropped;
}

export async function hardResetDatabase(): Promise<void> {
  await dropAllManagedCollections();
  await dropUnknownCollections();
  dbInstance = null;
  isConnected = false;
}

export async function createAllCollections(): Promise<string[]> {
  if (!mongoose.connection.db) {
    await connectMongo();
  }
  const db = mongoose.connection.db;
  if (!db) return [];

  const existing = (await db.listCollections().toArray()).map((c) => c.name);
  const created: string[] = [];

  for (const name of MANAGED_COLLECTIONS) {
    if (!existing.includes(name)) {
      await db.createCollection(name);
      created.push(name);
    }
  }

  return created;
}

export interface DatabaseConsistencyReport {
  expected: CollectionName[];
  actual: string[];
  exactMatch: string[];
  missing: CollectionName[];
  unknown: string[];
  possibleOldDuplicates: Array<{
    actual: string;
    expected?: CollectionName;
    reason: string;
  }>;
  isClean: boolean;
  recommendation: string;
}

export async function checkDatabaseConsistency(): Promise<DatabaseConsistencyReport> {
  await connectMongo();
  const db = mongoose.connection.db;

  const actual: string[] = db
    ? (await db.listCollections().toArray()).map((c) => c.name)
    : [];

  const expected = [...MANAGED_COLLECTIONS];
  const knownSet = new Set(expected);

  const exactMatch = actual.filter((name) => knownSet.has(name as CollectionName));
  const missing = expected.filter((name) => !actual.includes(name));
  const unknown = actual.filter((name) => !knownSet.has(name as CollectionName));

  const possibleOldDuplicates: DatabaseConsistencyReport['possibleOldDuplicates'] = [];

  const lowerActual = new Map(actual.map((n) => [n.toLowerCase(), n]));

  for (const exp of expected) {
    const lowerExp = exp.toLowerCase();
    if (lowerActual.has(lowerExp) && lowerActual.get(lowerExp) !== exp) {
      possibleOldDuplicates.push({
        actual: lowerActual.get(lowerExp)!,
        expected: exp,
        reason: 'case-insensitive match (old name likely still present)',
      });
    }
  }

  const legacyPatterns = [
    { old: 'itineraryitems', expected: 'itinerary_items' },
    { old: 'favoriteplaces', expected: 'favorite_places' },
    { old: 'tripbudgets', expected: 'trip_budgets' },
    { old: 'tripaccommodations', expected: 'trip_accommodations' },
    { old: 'tripchecklists', expected: 'trip_checklists' },
    { old: 'userpreferences', expected: 'user_preferences' },
    { old: 'userfollows', expected: 'user_follows' },
    { old: 'searchhistories', expected: 'search_histories' },
    { old: 'tripshares', expected: 'trip_shares' },
    { old: 'auditlogs', expected: 'audit_logs' },
  ];

  for (const { old, expected: exp } of legacyPatterns) {
    if (actual.includes(old) && !actual.includes(exp)) {
      possibleOldDuplicates.push({
        actual: old,
        expected: exp as CollectionName,
        reason: 'legacy implicit Mongoose plural name still exists',
      });
    }
  }

  for (const name of actual) {
    const lower = name.toLowerCase();
    for (const exp of expected) {
      if (lower === exp.toLowerCase() && name !== exp) {
        if (!possibleOldDuplicates.some((d) => d.actual === name)) {
          possibleOldDuplicates.push({
            actual: name,
            expected: exp,
            reason: 'different casing of a managed collection',
          });
        }
      }
    }
  }

  const isClean =
    missing.length === 0 &&
    unknown.length === 0 &&
    possibleOldDuplicates.length === 0;

  let recommendation = '';
  if (isClean) {
    recommendation = 'Database is consistent with current code. No old/duplicate collections detected.';
  } else {
    const actions: string[] = [];
    if (missing.length) actions.push(`Missing collections (will be created on first write): ${missing.join(', ')}`);
    if (unknown.length) actions.push(`Run webhook event "db.dropUnknown" or call dropUnknownCollections()`);
    if (possibleOldDuplicates.length) actions.push(`Old/duplicate names found — use "db.dropUnknown" or hard reset`);
    recommendation = actions.join(' | ');
  }

  return {
    expected,
    actual,
    exactMatch,
    missing,
    unknown,
    possibleOldDuplicates,
    isClean,
    recommendation,
  };
}

