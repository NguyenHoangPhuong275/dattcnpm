export interface UserTable {
  id: number;
  email: string;
  password_hash: string;
  full_name: string;
  avatar_url: string | null;
  role: 'USER' | 'ADMIN';
  is_locked: boolean;
  preferences: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface TripTable {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  destination: string;
  start_date: string;
  end_date: string;
  is_public: boolean;
  share_code: string | null;
  cover_image: string | null;
  metadata: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PlaceTable {
  id: number;
  osm_id: string | null;
  name: string;
  type: string;
  lat: number;
  lng: number;
  address: string | null;
  opening_hours: string | null;
  images: string | null;
  osm_tags: string | null;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface ItineraryItemTable {
  id: number;
  trip_id: number;
  place_id: number;
  day: number;
  order_index: number;
  note: string | null;
  start_time: string | null;
  end_time: string | null;
  cost: number | null;
  metadata: string | null;
  created_at: string;
  updated_at: string;
}

export interface FavoritePlaceTable {
  id: number;
  user_id: number;
  place_id: number;
  created_at: string;
}

export interface SearchHistoryTable {
  id: number;
  user_id: number | null;
  query: string;
  lat: number | null;
  lng: number | null;
  metadata: string | null;
  created_at: string;
}

export interface AuditLogTable {
  id: number;
  user_id: number | null;
  action: string;
  target_type: string;
  target_id: number | null;
  metadata: string | null;
  created_at: string;
}

export interface ReviewTable {
  id: number;
  user_id: number;
  place_id: number;
  rating: number;
  comment: string | null;
  images: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface TripShareTable {
  id: number;
  trip_id: number;
  shared_by_user_id: number;
  shared_with_user_id: number | null;
  permission: 'READ' | 'EDIT';
  share_code: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface NotificationTable {
  id: number;
  user_id: number;
  title: string;
  content: string;
  type: 'TRIP_SHARE' | 'SYSTEM' | 'WEATHER_ALERT' | 'RECOMMENDATION';
  is_read: boolean;
  metadata: string | null;
  created_at: string;
}

export interface TagTable {
  id: number;
  name: string;
  category: string;
  created_at: string;
}

export interface PlaceTagTable {
  place_id: number;
  tag_id: number;
}

export interface UserPreferenceTable {
  id: number;
  user_id: number;
  tag_id: number;
  preference_score: number;
  updated_at: string;
}

export interface TripBudgetTable {
  id: number;
  trip_id: number;
  category: 'TRANSPORT' | 'ACCOMMODATION' | 'FOOD' | 'ACTIVITY' | 'OTHER';
  estimated_amount: number;
  actual_amount: number | null;
  currency: string;
  note: string | null;
  created_at: string;
}

