import mongoose, { Schema, model, models, type Document, type Model, type Types } from 'mongoose';

import type { User as PlainUser } from '../schema';
import { COLLECTIONS, toPlain } from '../collections';

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  fullName: string;
  avatarUrl?: string | null;
  role: 'USER' | 'ADMIN';
  isLocked: boolean;
  emailVerified: boolean;
  emailVerifiedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  phone?: string | null | undefined;
  dateOfBirth?: Date | null | undefined;
  gender?: 'Nam' | 'Nữ' | 'Khác' | null | undefined;
  nationality?: string | null | undefined;
  preferredLanguage?: string | null | undefined;
  homeCity?: string | null | undefined;
  emergencyContact?: {
    name?: string | null;
    phone?: string | null;
  } | null | undefined;
  travelStyles?: string[];
  budgetLevel?: string | null | undefined;
  preferredDestinations?: string[];
  interests?: string[];
  weatherAlerts?: {
    maxTemp?: number | null;
    minTemp?: number | null;
    maxRainProbability?: number | null;
    maxWindKmh?: number | null;
  } | null;
  twoFactorEnabled?: boolean | null | undefined;
}

export const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    avatarUrl: { type: String, default: null },
    role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
    isLocked: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
    phone: { type: String, default: null },
    dateOfBirth: { type: Date, default: null },
    gender: { type: String, enum: ['Nam', 'Nữ', 'Khác'], default: null },
    nationality: { type: String, default: null },
    preferredLanguage: { type: String, default: null },
    homeCity: { type: String, default: null },
    emergencyContact: {
      name: { type: String, default: null },
      phone: { type: String, default: null },
    },
    travelStyles: { type: [String], default: [] },
    budgetLevel: { type: String, default: null },
    preferredDestinations: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    weatherAlerts: {
      type: {
        maxTemp: { type: Number, default: null },
        minTemp: { type: Number, default: null },
        maxRainProbability: { type: Number, default: null },
        maxWindKmh: { type: Number, default: null },
      },
      default: null,
    },
    twoFactorEnabled: { type: Boolean, default: false },
  },
  { timestamps: true, collection: COLLECTIONS.users }
);

UserSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);

UserSchema.index({ email: 1, deletedAt: 1 });

export type PlainUserWithId = PlainUser & { id: string };

export const User: Model<IUser> = models.User || model<IUser>('User', UserSchema);

export async function getUserById(userId: string): Promise<PlainUser | null> {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return null;
  const user = await User.findOne({ _id: userId, deletedAt: null }).lean();
  return user ? (toPlain<PlainUser>(user) ?? null) : null;
}

export async function updateUserProfile(userId: string, updates: Partial<IUser>): Promise<PlainUser | null> {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return null;
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updates },
    { returnDocument: 'after', lean: true }
  );
  return user ? (toPlain<PlainUser>(user) ?? null) : null;
}
