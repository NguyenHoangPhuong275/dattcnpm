
export type MongoId = string;

export interface User {
  _id: MongoId;
  email: string;
  passwordHash: string;
  fullName: string;
  avatarUrl?: string | null;
  role: 'USER' | 'ADMIN';
  tokenVersion: number;
  isLocked: boolean;
  emailVerified: boolean;
  emailVerifiedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;


  phone?: string | null;
  dateOfBirth?: Date | null;
  gender?: 'Nam' | 'Nữ' | 'Khác' | null;
  nationality?: string | null;
  preferredLanguage?: string | null;
  homeCity?: string | null;
  emergencyContact?: {
    name?: string | null;
    phone?: string | null;
  } | null;


  travelStyles?: string[];
  budgetLevel?: string | null;
  preferredDestinations?: string[];
  interests?: string[];

  weatherAlerts?: WeatherAlertThresholds | null;


  twoFactorEnabled?: boolean | null;
}

export interface WeatherAlertThresholds {
  maxTemp?: number | null;
  minTemp?: number | null;
  maxRainProbability?: number | null;
  maxWindKmh?: number | null;
}

export interface TripCollaborator {
  userId: MongoId;
  permission: 'READ' | 'EDIT';
  invitedAt: Date;
  acceptedAt?: Date | null;
}

export interface Trip {
  _id: MongoId;
  userId: MongoId;
  title: string;
  description?: string | null;
  destination: string;
  startDate: Date;
  endDate: Date;
  isPublic: boolean;
  coverImage?: string | null;
  metadata?: Record<string, unknown> | null;
  collaborators?: TripCollaborator[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface Place {
  _id: MongoId;
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

export interface Hotel {
  _id: MongoId;
  osmId?: string | null;
  name: string;
  province?: string | null;
  provinceKey?: string | null;
  district?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  rating?: number | null;
  priceLevel?: 'budget' | 'mid' | 'luxury' | null;
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

export type HotelBookingStatus = 'pending' | 'confirmed' | 'cancelled';
export type HotelPaymentStatus = 'unpaid' | 'paid';

export interface HotelBooking {
  _id: MongoId;
  hotelId: MongoId;
  userId: MongoId;
  tripId?: MongoId | null;
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
  status: HotelBookingStatus;
  paymentStatus: HotelPaymentStatus;
  paidAt?: Date | null;
  confirmedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FlightBookingSegment {
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

export type FlightBookingStatus = 'pending' | 'confirmed' | 'cancelled';
export type FlightPaymentStatus = 'unpaid' | 'paid';

export interface FlightBooking {
  _id: MongoId;
  userId: MongoId;
  tripId?: MongoId | null;
  outbound: FlightBookingSegment;
  returnFlight?: FlightBookingSegment | null;
  passengers: number;
  passengerNames: string[];
  contactName: string;
  phone: string;
  contactEmail: string;
  note?: string | null;
  totalPrice: number;
  currency: string;
  status: FlightBookingStatus;
  paymentStatus: FlightPaymentStatus;
  paidAt?: Date | null;
  confirmedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface HotelReview {
  _id: MongoId;
  hotelId: MongoId;
  userId: MongoId;
  rating: number;
  comment?: string | null;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ItineraryItem {
  _id: MongoId;
  tripId: MongoId;
  placeId: MongoId;
  day: number;
  orderIndex: number;
  note?: string | null;
  startTime?: Date | null;
  endTime?: Date | null;
  cost?: number | null;
  currency?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FavoritePlace {
  _id: MongoId;
  userId: MongoId;
  placeId: MongoId;
  createdAt: Date;
}

export interface SearchHistory {
  _id: MongoId;
  userId?: MongoId | null;
  query: string;
  lat?: number | null;
  lng?: number | null;
  resultCount?: number | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
}

export interface AuditLog {
  _id: MongoId;
  userId?: MongoId | null;
  action: string;
  targetType: string;
  targetId?: MongoId | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
}

export interface Review {
  _id: MongoId;
  userId: MongoId;
  placeId: MongoId;
  parentId?: MongoId | null;
  rating: number;
  comment?: string | null;
  images?: string[] | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface TripShare {
  _id: MongoId;
  tripId: MongoId;
  sharedByUserId: MongoId;
  sharedWithUserId?: MongoId | null;
  permission: 'READ' | 'EDIT';
  shareCode?: string | null;
  isActive: boolean;
  expiresAt?: Date | null;
  createdAt: Date;
}

export interface Notification {
  _id: MongoId;
  userId: MongoId;
  title: string;
  content: string;
  type: 'TRIP_SHARE' | 'SYSTEM' | 'WEATHER_ALERT' | 'RECOMMENDATION';
  isRead: boolean;
  actionUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
}

export interface Tag {
  _id: MongoId;
  name: string;
  category: string;
  createdAt: Date;
}

export interface UserPreference {
  _id: MongoId;
  userId: MongoId;
  tagId: MongoId;
  preferenceScore: number;
  updatedAt: Date;
}

export type TripBudgetCategory = 'transport' | 'food' | 'accommodation' | 'ticket' | 'shopping' | 'other';
export type TripBudgetType = 'planned' | 'actual';

export interface TripBudget {
  _id: MongoId;
  tripId: MongoId;
  userId: MongoId;
  category: TripBudgetCategory;
  amount: number;
  currency: string;
  note?: string | null;
  date?: Date | null;
  type: TripBudgetType;
  createdAt: Date;
  updatedAt: Date;
}

export interface TripAccommodation {
  _id: MongoId;
  tripId: MongoId;
  placeId?: MongoId | null;
  hotelId?: MongoId | null;
  name: string;
  address?: string | null;
  checkIn: Date;
  checkOut: Date;
  bookingRef?: string | null;
  cost?: number | null;
  currency: string;
  note?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TripChecklist {
  _id: MongoId;
  tripId: MongoId;
  label: string;
  isDone: boolean;
  dueDate?: Date | null;
  createdAt: Date;
}

export interface UserFollow {
  _id: MongoId;
  followerId: MongoId;
  followingId: MongoId;
  createdAt: Date;
}

export type ReviewReportReason = 'spam' | 'inappropriate' | 'fake' | 'offensive' | 'off_topic' | 'other';
export type ReviewReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface ReviewReport {
  _id: MongoId;
  reviewId: MongoId;
  reportedBy: MongoId;
  reason: ReviewReportReason;
  note?: string | null;
  status: ReviewReportStatus;
  createdAt: Date;
}
