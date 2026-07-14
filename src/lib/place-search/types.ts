import type { Place } from '@/lib/db';

export interface NominatimResult {
  place_id: number;
  osm_type?: string;
  osm_id?: number;
  lat: string;
  lon: string;
  display_name: string;
  type?: string;
  class?: string;
  address?: Record<string, string>;
}

export type PlaceDraft = Omit<Place, '_id' | 'createdAt' | 'updatedAt' | 'ratingAvg' | 'ratingCount'>;

export interface RawPoi {
  id: string;
  name: string;
  type: string;
  amenity?: string;
  shop?: string;
  lat: number;
  lng: number;
}

export interface OverpassSearchElement {
  id: number | string;
  lat?: number;
  lon?: number;
  center?: {
    lat?: number;
    lon?: number;
  };
  tags?: Record<string, string | undefined>;
}

export interface OverpassSearchResponse {
  elements?: OverpassSearchElement[];
}

export interface SearchCenter {
  mainLocationName: string;
  centerLat: number | null;
  centerLng: number | null;
}

export type SavedPlace = PlaceDraft & {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CachedSearchPayload =
  | { status: 'hit'; results: Place[] }
  | { status: 'empty'; results: Place[] }
  | { status: 'malformed'; results: [] };
