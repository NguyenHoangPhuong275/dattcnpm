import { Schema, model, models, type Document, type Model, type Types } from 'mongoose';

import { COLLECTIONS } from '../collections';

interface IFlightBookingSegment {
  scheduleId: string;
  flightNumber: string;
  airlineCode: string;
  from: string;
  to: string;
  flightDate: Date;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  pricePerPassenger: number;
}

export interface IFlightBooking extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  tripId?: Types.ObjectId | null;
  outbound: IFlightBookingSegment;
  returnFlight?: IFlightBookingSegment | null;
  passengers: number;
  passengerNames: string[];
  contactName: string;
  phone: string;
  contactEmail: string;
  note?: string | null;
  totalPrice: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentStatus: 'unpaid' | 'paid';
  paidAt?: Date | null;
  confirmedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const FlightBookingSegmentSchema = new Schema<IFlightBookingSegment>({
  scheduleId: { type: String, required: true },
  flightNumber: { type: String, required: true },
  airlineCode: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  flightDate: { type: Date, required: true },
  departureTime: { type: String, required: true },
  arrivalTime: { type: String, required: true },
  duration: { type: String, required: true },
  pricePerPassenger: { type: Number, required: true, min: 0 },
}, { _id: false });

export const FlightBookingSchema = new Schema<IFlightBooking>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tripId: { type: Schema.Types.ObjectId, ref: 'Trip', default: null },
  outbound: { type: FlightBookingSegmentSchema, required: true },
  returnFlight: { type: FlightBookingSegmentSchema, default: null },
  passengers: { type: Number, required: true, min: 1, max: 9 },
  passengerNames: { type: [String], required: true },
  contactName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  contactEmail: { type: String, required: true, lowercase: true, trim: true },
  note: { type: String, default: null },
  totalPrice: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'VND' },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
  paidAt: { type: Date, default: null },
  confirmedAt: { type: Date, default: null },
}, { timestamps: true, collection: COLLECTIONS.flightBookings });

FlightBookingSchema.index({ userId: 1, createdAt: -1 });
FlightBookingSchema.index({ 'outbound.flightDate': 1, status: 1 });

export const FlightBooking: Model<IFlightBooking> =
  models.FlightBooking || model<IFlightBooking>('FlightBooking', FlightBookingSchema);
