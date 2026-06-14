import { Schema, model, models, type Document, type Model, type Types } from 'mongoose';

import { COLLECTIONS } from '../collections';

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

export const ItineraryItemSchema = new Schema<IItineraryItem>({
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

export const FavoritePlaceSchema = new Schema<IFavoritePlace>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  placeId: { type: Schema.Types.ObjectId, ref: 'Place', required: true },
}, { timestamps: { createdAt: true, updatedAt: false }, collection: COLLECTIONS.favorites });

export const FavoritePlace: Model<IFavoritePlace> = models.FavoritePlace || model<IFavoritePlace>('FavoritePlace', FavoritePlaceSchema);

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

export const SearchHistorySchema = new Schema<ISearchHistory>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  query: { type: String, required: true },
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
  resultCount: { type: Number, default: null },
  metadata: { type: Object, default: null },
}, { timestamps: { createdAt: true, updatedAt: false }, collection: COLLECTIONS.searchHistories });

SearchHistorySchema.index({ userId: 1, createdAt: -1 });

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

export const TripShareSchema = new Schema<ITripShare>({
  tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
  sharedByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  sharedWithUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  permission: { type: String, enum: ['READ', 'EDIT'], default: 'READ' },
  shareCode: { type: String, default: null },
  expiresAt: { type: Date, default: null },
}, { timestamps: { createdAt: true, updatedAt: false }, collection: COLLECTIONS.tripShares, strict: false });

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

export const NotificationSchema = new Schema<INotification>({
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

export const TagSchema = new Schema<ITag>({
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

export const UserPreferenceSchema = new Schema<IUserPreference>({
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

export const TripBudgetSchema = new Schema<ITripBudget>({
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

export const TripAccommodationSchema = new Schema<ITripAccommodation>({
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

export const TripChecklistSchema = new Schema<ITripChecklist>({
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

export const UserFollowSchema = new Schema<IUserFollow>({
  followerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  followingId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: { createdAt: true, updatedAt: false }, collection: COLLECTIONS.userFollows });

export const UserFollow: Model<IUserFollow> = models.UserFollow || model<IUserFollow>('UserFollow', UserFollowSchema);
