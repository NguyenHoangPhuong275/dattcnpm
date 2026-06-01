/**
 * Database Type Definitions
 * 
 * These types are the single source of truth for our MongoDB document shapes.
 * They are used by Mongoose models (when created) and throughout the application.
 * 
 * Keep these in sync with the actual MongoDB collections and indexes defined in docs/03_DATA_MODEL.md
 */

import { ObjectId } from "mongodb";

// ==================== USER ====================
export interface User {
  _id: ObjectId;
  email: string;                    // Must be unique + lowercase
  passwordHash: string;             // Never return to client
  fullName: string;
  role: "USER" | "ADMIN";
  isLocked: boolean;
  preferences?: string[];           // For future personalization / AI recommendations
  createdAt: Date;
  updatedAt: Date;
}

// ==================== TRIP ====================
export interface Trip {
  _id: ObjectId;
  userId: ObjectId;                 // Reference to users._id
  title: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== PLACE (POI Cache) ====================
export interface Place {
  _id: ObjectId;
  osmId?: string;                   // OpenStreetMap ID for deduplication (unique + sparse index)
  name: string;
  type: string;                     // e.g. "restaurant", "hotel", "attraction"
  lat: number;
  lng: number;
  address?: string;
  images?: string[];
  tags?: string[];
  raw?: Record<string, any>;        // Original data from Overpass / Nominatim
  createdAt: Date;
}

// ==================== ITINERARY ITEM ====================
export interface ItineraryItem {
  _id: ObjectId;
  tripId: ObjectId;                 // Reference to trips._id
  placeId: ObjectId;                // Reference to places._id
  day: number;                      // Day number within the trip (1-based)
  orderIndex: number;               // Order within the same day
  note?: string;
  startTime?: Date;
  endTime?: Date;
  createdAt: Date;
}

// ==================== FAVORITE PLACE ====================
export interface FavoritePlace {
  _id: ObjectId;
  userId: ObjectId;
  placeId: ObjectId;
  createdAt: Date;
}

// ==================== SEARCH HISTORY ====================
export interface SearchHistory {
  _id: ObjectId;
  userId?: ObjectId;                // Can be null for unauthenticated guests
  query: string;
  lat?: number;
  lng?: number;
  createdAt: Date;
}

// ==================== AUDIT LOG ====================
export interface AuditLog {
  _id: ObjectId;
  userId?: ObjectId;
  action: string;                   // e.g. "CREATE_TRIP", "USER_LOCKED"
  targetType: string;               // e.g. "Trip", "User"
  targetId?: ObjectId;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// ==================== UTILITY TYPES ====================
export type CreateUserInput = Omit<User, "_id" | "createdAt" | "updatedAt">;
export type CreateTripInput = Omit<Trip, "_id" | "createdAt" | "updatedAt">;