import mongoose, { type Model } from 'mongoose';

import type { MongoId } from '@/database/schema';

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

export type CollectionFilter = Record<string, unknown>;

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
};

export type PaginationOptions = {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 1 | -1;
};

export function toPlain<T>(doc: unknown): T | undefined {
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

export function createCollection<T extends { _id: MongoId }>(mongooseModel: Model<unknown>) {
  type InsertInput = Record<string, unknown>;

  return {
    async findOne(filter: CollectionFilter = {}): Promise<T | undefined> {
      const doc = await mongooseModel.findOne(filter).lean();
      return doc ? toPlain<T>(doc) : undefined;
    },
    async find(filter: CollectionFilter = {}): Promise<T[]> {
      const docs = await mongooseModel.find(filter).lean();
      return docs.map((d: unknown) => toPlain<T>(d)).filter((d): d is T => !!d);
    },
    async findPaginated(filter: CollectionFilter = {}, options: PaginationOptions): Promise<PaginatedResult<T>> {
      const page = Math.max(1, Math.floor(options.page));
      const limit = Math.max(1, Math.floor(options.limit));
      const skip = (page - 1) * limit;
      const sort = options.sortBy ? { [options.sortBy]: options.sortOrder ?? 1 } : undefined;

      const [docs, total] = await Promise.all([
        mongooseModel.find(filter).sort(sort).skip(skip).limit(limit).lean(),
        mongooseModel.countDocuments(filter),
      ]);

      return {
        data: docs.map((d: unknown) => toPlain<T>(d)).filter((d): d is T => !!d),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
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
    async deleteMany(filter: CollectionFilter = {}): Promise<number> {
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
    async count(filter: CollectionFilter = {}): Promise<number> {
      return mongooseModel.countDocuments(filter);
    },
  };
}
