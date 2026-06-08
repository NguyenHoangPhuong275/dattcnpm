

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
  gender?: 'Nam' | 'Nữ' | 'Khác' | '';
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
  budgetLevel: 'Tiết kiệm' | 'Trung bình' | 'Thoải mái' | 'Sang trọng';
  preferredDestinations: string[];
}

export interface TripSummary {
  _id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  isPublic: boolean;
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
  place?: { id?: string; name?: string; type?: string; address?: string };
}

export type ProfileTab = 'personal' | 'preferences' | 'trips' | 'favorites' | 'reviews' | 'security';
