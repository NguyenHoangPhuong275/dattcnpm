import { Schema, model, models, type Document, type Model, type Types } from 'mongoose';

import { COLLECTIONS } from '../collections';

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

export const ReviewSchema = new Schema<IReview>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  placeId: { type: Schema.Types.ObjectId, ref: 'Place', required: true },
  parentId: { type: Schema.Types.ObjectId, ref: 'Review', default: null },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: null },
  images: { type: [String], default: null },
  deletedAt: { type: Date, default: null },
}, { timestamps: true, collection: COLLECTIONS.reviews });

ReviewSchema.index({ placeId: 1, deletedAt: 1 });

export const Review: Model<IReview> = models.Review || model<IReview>('Review', ReviewSchema);
