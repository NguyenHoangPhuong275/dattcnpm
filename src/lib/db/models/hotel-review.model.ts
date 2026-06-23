import { Schema, model, models, type Document, type Model, type Types } from 'mongoose';

import { COLLECTIONS } from '../collections';

export interface IHotelReview extends Document {
  _id: Types.ObjectId;
  hotelId: Types.ObjectId;
  userId: Types.ObjectId;
  rating: number;
  comment?: string | null;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const HotelReviewSchema = new Schema<IHotelReview>({
  hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: null },
  deletedAt: { type: Date, default: null },
}, { timestamps: true, collection: COLLECTIONS.hotelReviews });

HotelReviewSchema.index({ hotelId: 1, deletedAt: 1 });
HotelReviewSchema.index(
  { userId: 1, hotelId: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);

export const HotelReview: Model<IHotelReview> = models.HotelReview || model<IHotelReview>('HotelReview', HotelReviewSchema);
