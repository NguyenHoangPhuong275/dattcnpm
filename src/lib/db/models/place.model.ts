import { Schema, model, models, type Document, type Model, type Types } from 'mongoose';

import { COLLECTIONS } from '../collections';

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

export const PlaceSchema = new Schema<IPlace>({
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
