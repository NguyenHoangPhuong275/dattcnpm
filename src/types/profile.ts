export type Gender = 'Nam' | 'Nữ' | 'Khác' | '';
export type BudgetLevel = 'Tiết kiệm' | 'Trung bình' | 'Thoải mái' | 'Sang trọng';
export type ProfileTab = 'personal' | 'preferences' | 'trips' | 'favorites' | 'reviews' | 'security' | 'search-history';

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

export interface TravelPreferences {
  travelStyles: string[];
  interests: string[];
  budgetLevel: BudgetLevel;
  preferredDestinations: string[];
}

export interface TripSummary {
  _id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  isPublic: boolean;
  coverImage?: string | null;
}

export interface FavoritePlaceSummary {
  _id: string;
  name: string;
  type: string;
  address?: string;
  lat: number;
  lng: number;
}

export interface MyReview {
  _id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  place?: {
    id?: string;
    name?: string;
    type?: string;
    address?: string;
  };
}
