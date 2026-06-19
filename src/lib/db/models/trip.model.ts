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
  collaborators?: ITripCollaborator[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface ITripCollaborator {
  userId: Types.ObjectId;
  permission: 'READ' | 'EDIT';
  invitedAt: Date;
  acceptedAt?: Date | null;
}

const TripCollaboratorSchema = new Schema<ITripCollaborator>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  permission: { type: String, enum: ['READ', 'EDIT'], default: 'READ' },
  invitedAt: { type: Date, default: Date.now },
  acceptedAt: { type: Date, default: null },
}, { _id: false });

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
  collaborators: { type: [TripCollaboratorSchema], default: [] },
  deletedAt: { type: Date, default: null },
}, { timestamps: true, collection: COLLECTIONS.trips });

TripSchema.index({ userId: 1, updatedAt: -1 });
TripSchema.index({ isPublic: 1, updatedAt: -1 });
TripSchema.index({ userId: 1, deletedAt: 1 });
TripSchema.index({ deletedAt: 1, startDate: 1 });

export const Trip: Model<ITrip> = models.Trip || model<ITrip>('Trip', TripSchema);
