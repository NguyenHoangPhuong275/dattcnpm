import { Schema, model, models, type Document, type Model, type Types } from 'mongoose';

import { COLLECTIONS } from '../collections';

export interface IHotelBooking extends Document {
  _id: Types.ObjectId;
  hotelId: Types.ObjectId;
  userId: Types.ObjectId;
  tripId?: Types.ObjectId | null;
  roomCode: string;
  roomName: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guests: number;
  guestTitle: string;
  guestName: string;
  phone: string;
  contactEmail: string;
  note?: string | null;
  pricePerNight: number;
  totalPrice: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentStatus: 'unpaid' | 'paid';
  paidAt?: Date | null;
  confirmedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const HotelBookingSchema = new Schema<IHotelBooking>({
  hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tripId: { type: Schema.Types.ObjectId, ref: 'Trip', default: null },
  roomCode: { type: String, required: true },
  roomName: { type: String, required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  nights: { type: Number, required: true, min: 1 },
  guests: { type: Number, required: true, min: 1 },
  guestTitle: { type: String, required: true, trim: true },
  guestName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  contactEmail: { type: String, required: true, lowercase: true, trim: true },
  note: { type: String, default: null },
  pricePerNight: { type: Number, required: true, min: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'VND' },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
  paidAt: { type: Date, default: null },
  confirmedAt: { type: Date, default: null },
}, { timestamps: true, collection: COLLECTIONS.hotelBookings });

HotelBookingSchema.index({ userId: 1, createdAt: -1 });
HotelBookingSchema.index({ hotelId: 1, createdAt: -1 });

export const HotelBooking: Model<IHotelBooking> =
  models.HotelBooking || model<IHotelBooking>('HotelBooking', HotelBookingSchema);
