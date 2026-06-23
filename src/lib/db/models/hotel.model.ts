import { Schema, model, models, type Document, type Model, type Types } from 'mongoose';

import { COLLECTIONS } from '../collections';

export const HOTEL_PRICE_LEVELS = ['budget', 'mid', 'luxury'] as const;

export interface IHotel extends Document {
  _id: Types.ObjectId;
  osmId?: string | null;
  name: string;
  province?: string | null;
  provinceKey?: string | null;
  district?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  rating?: number | null;
  priceLevel?: (typeof HOTEL_PRICE_LEVELS)[number] | null;
  tags?: string[] | null;
  images?: string[] | null;
  phone?: string | null;
  website?: string | null;
  amenities?: string[] | null;
  location?: { type: 'Point'; coordinates: [number, number] } | null;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

export const HotelSchema = new Schema<IHotel>({
  osmId: { type: String, default: null },
  name: { type: String, required: true },
  province: { type: String, default: null },
  provinceKey: { type: String, default: null },
  district: { type: String, default: null },
  address: { type: String, default: null },
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
  rating: { type: Number, default: null },
  priceLevel: { type: String, enum: [...HOTEL_PRICE_LEVELS, null], default: null },
  tags: { type: [String], default: null },
  images: { type: [String], default: null },
  phone: { type: String, default: null },
  website: { type: String, default: null },
  amenities: { type: [String], default: [] },
  location: {
    type: { type: String, enum: ['Point'], default: undefined },
    coordinates: { type: [Number], default: undefined },
  },
  source: { type: String, default: 'osm' },
}, { timestamps: true, collection: COLLECTIONS.hotels });

HotelSchema.index({ provinceKey: 1 });
HotelSchema.index({ location: '2dsphere' });
HotelSchema.index(
  { osmId: 1 },
  { unique: true, partialFilterExpression: { osmId: { $type: 'string' } } }
);

export const Hotel: Model<IHotel> = models.Hotel || model<IHotel>('Hotel', HotelSchema);
