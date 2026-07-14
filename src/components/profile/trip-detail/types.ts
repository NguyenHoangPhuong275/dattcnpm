import type { ItineraryItemInput } from '@/lib/validations/trip';
import type { TripSummary } from '@/types/profile';
import type { TripAccess } from '@/types/trip';

export interface TripDetailModalProps {
  trip: TripSummary | null;
  onClose: () => void;
  onTripUpdated?: () => void;
  userId: string | null;
}

export interface ItineraryPlace {
  _id: string;
  name: string;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
}

export interface ItineraryItem {
  _id: string;
  day: number;
  orderIndex: number;
  note: string;
  placeId: string;
  place?: ItineraryPlace | null;
  cost?: number | null;
  currency?: string | null;
}

export type ItineraryDraft = Omit<ItineraryItemInput, 'day' | 'orderIndex' | 'cost'> & {
  day: number | '';
  cost: string;
  currency: string;
};

export interface TripEditDraft {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  isPublic: boolean;
  description: string;
  coverImage: string;
}

export interface ApiListResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
}

export interface ItineraryGroup {
  day: number;
  items: ItineraryItem[];
}

export interface HotelAnchor {
  lat: number;
  lng: number;
  name: string;
}

export interface TripDetailPermissions {
  access: TripAccess;
  isOwner: boolean;
  canEdit: boolean;
  canViewPrivate: boolean;
}
