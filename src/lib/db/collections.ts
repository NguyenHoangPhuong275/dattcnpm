import mongoose, { type Model, type PipelineStage } from 'mongoose';

import type { MongoId } from './schema';

export const COLLECTIONS = {
  users: 'users',
  trips: 'trips',
  places: 'places',
  hotels: 'hotels',
  hotelReviews: 'hotel_reviews',
  hotelBookings: 'hotel_bookings',
  flightBookings: 'flight_bookings',
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
  reviewReports: 'review_reports',
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

export type FindOptions = {
  sortBy?: string;
  sortOrder?: 1 | -1;
  limit?: number;
  projection?: Record<string, 0 | 1>;
};

export const PAGINATION_DEFAULT_LIMIT = 20;
export const PAGINATION_MAX_LIMIT = 100;

export function normalizePagination(input: { page?: number; limit?: number }): { page: number; limit: number } {
  const rawPage = Number(input.page);
  const rawLimit = Number(input.limit);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
  let limit = Number.isFinite(rawLimit) && rawLimit >= 1 ? Math.floor(rawLimit) : PAGINATION_DEFAULT_LIMIT;
  if (limit > PAGINATION_MAX_LIMIT) limit = PAGINATION_MAX_LIMIT;
  return { page, limit };
}

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
    async find(filter: CollectionFilter = {}, options: FindOptions = {}): Promise<T[]> {
      let query = options.projection
        ? mongooseModel.find(filter, options.projection)
        : mongooseModel.find(filter);
      if (options.sortBy) query = query.sort({ [options.sortBy]: options.sortOrder ?? 1 });
      if (typeof options.limit === 'number' && options.limit > 0) query = query.limit(options.limit);
      const docs = await query.lean();
      return docs.map((d: unknown) => toPlain<T>(d)).filter((d): d is T => !!d);
    },
    async findPaginated(filter: CollectionFilter = {}, options: PaginationOptions): Promise<PaginatedResult<T>> {
      const { page, limit } = normalizePagination({ page: options.page, limit: options.limit });
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
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
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
    async findOneAndUpdate(filter: CollectionFilter, update: Record<string, unknown>): Promise<T | null> {
      const updated = await mongooseModel.findOneAndUpdate(filter, update, { returnDocument: 'after' }).lean();
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
    async updateMany(filter: CollectionFilter, update: Record<string, unknown>): Promise<number> {
      const res = await mongooseModel.updateMany(filter, update);
      return res.modifiedCount || 0;
    },
    async bulkWrite(ops: Record<string, unknown>[]): Promise<{ upsertedCount: number; modifiedCount: number; matchedCount: number }> {
      if (!ops.length) return { upsertedCount: 0, modifiedCount: 0, matchedCount: 0 };
      type BulkOps = Parameters<typeof mongooseModel.bulkWrite>[0];
      const batchSize = 1000;
      let upsertedCount = 0;
      let modifiedCount = 0;
      let matchedCount = 0;
      for (let i = 0; i < ops.length; i += batchSize) {
        const batch = ops.slice(i, i + batchSize) as unknown as BulkOps;
        const res = await mongooseModel.bulkWrite(batch);
        upsertedCount += res.upsertedCount || 0;
        modifiedCount += res.modifiedCount || 0;
        matchedCount += res.matchedCount || 0;
      }
      return { upsertedCount, modifiedCount, matchedCount };
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
    async aggregate<TResult>(pipeline: PipelineStage[]): Promise<TResult[]> {
      return mongooseModel.aggregate<TResult>(pipeline);
    },
  };
}
