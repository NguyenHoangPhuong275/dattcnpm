import type { TripAccess } from '@/types/trip';

export type ProfileTab = 'personal' | 'trips' | 'bookings' | 'favorites' | 'security';

export type BudgetLevel = 'budget' | 'mid' | 'comfortable' | 'luxury';
export type TravelStyleCode = 'solo' | 'couple' | 'family' | 'group' | 'adventure' | 'relax';
export type TravelInterestCode =
  | 'beach'
  | 'mountain'
  | 'nature'
  | 'culture'
  | 'history'
  | 'food'
  | 'adventure'
  | 'photography'
  | 'wellness';

export interface TravelPreferences {
  travelStyles: TravelStyleCode[];
  interests: TravelInterestCode[];
  budgetLevel: BudgetLevel;
  preferredDestinations: string[];
}

export interface BasicUser {
  id: string;
  email: string;
  fullName: string;
  role?: string;
  avatarUrl?: string | null;
}

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  gender?: Gender;
  nationality?: string;
  preferredLanguage?: string;
  homeCity?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  avatarUrl?: string;
}

export type Gender = 'Nam' | 'Nữ' | 'Khác' | '';

export interface TripSummary {
  _id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  isPublic: boolean;
  description?: string;
  coverImage?: string | null;
  access?: TripAccess;
}

export interface FavoritePlaceSummary {
  _id: string;
  name: string;
  type: string;
  address?: string;
  lat: number;
  lng: number;
}
