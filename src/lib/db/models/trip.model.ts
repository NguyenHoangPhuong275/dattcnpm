import { Schema, model, models, type Document, type Model, type Types } from 'mongoose';

import { COLLECTIONS } from '../collections';

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

export const TripSchema = new Schema<ITrip>({
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

TripSchema.index({ userId: 1, updatedAt: -1 });
TripSchema.index({ isPublic: 1, updatedAt: -1 });

export const Trip: Model<ITrip> = models.Trip || model<ITrip>('Trip', TripSchema);
