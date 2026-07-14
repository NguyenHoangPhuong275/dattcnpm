import { formatDateInputValue } from '@/lib/date';
import type { TripSummary } from '@/types/profile';
import type { TripAccess } from '@/types/trip';

import type {
  HotelAnchor,
  ItineraryDraft,
  ItineraryGroup,
  ItineraryItem,
  TripDetailPermissions,
  TripEditDraft,
} from './types';

export const EMPTY_ITINERARY_DRAFT: ItineraryDraft = {
  day: 1,
  placeId: '',
  note: '',
  cost: '',
  currency: 'VND',
};

export const EMPTY_TRIP_EDIT_DRAFT: TripEditDraft = {
  title: '',
  destination: '',
  startDate: '',
  endDate: '',
  isPublic: false,
  description: '',
  coverImage: '',
};

export function getTripDetailPermissions(accessValue?: TripAccess): TripDetailPermissions {
  const access = accessValue ?? 'NONE';
  const isOwner = access === 'OWNER';
  const canEdit = isOwner || access === 'EDIT';

  return {
    access,
    isOwner,
    canEdit,
    canViewPrivate: canEdit || access === 'READ',
  };
}

export function groupItineraryItems(items: ItineraryItem[]): ItineraryGroup[] {
  const groups = new Map<number, ItineraryItem[]>();

  items.forEach((item) => {
    const dayItems = groups.get(item.day) ?? [];
    dayItems.push(item);
    groups.set(item.day, dayItems);
  });

  return Array.from(groups.entries())
    .sort(([firstDay], [secondDay]) => firstDay - secondDay)
    .map(([day, dayItems]) => ({
      day,
      items: dayItems.sort((firstItem, secondItem) => firstItem.orderIndex - secondItem.orderIndex),
    }));
}

export function getHotelAnchor(items: ItineraryItem[]): HotelAnchor | null {
  const place = items
    .map((item) => item.place)
    .find((candidate) => typeof candidate?.lat === 'number' && typeof candidate?.lng === 'number');

  if (!place || typeof place.lat !== 'number' || typeof place.lng !== 'number') return null;

  return {
    lat: place.lat,
    lng: place.lng,
    name: place.name,
  };
}

export function createItineraryDraft(item: ItineraryItem): ItineraryDraft {
  return {
    day: item.day,
    placeId: item.placeId,
    note: item.note || '',
    cost: item.cost == null ? '' : String(item.cost),
    currency: item.currency || 'VND',
  };
}

export function createTripEditDraft(trip: TripSummary): TripEditDraft {
  return {
    title: trip.title,
    destination: trip.destination,
    startDate: formatDateInputValue(trip.startDate, { timeZone: 'utc' }),
    endDate: formatDateInputValue(trip.endDate, { timeZone: 'utc' }),
    isPublic: trip.isPublic,
    description: trip.description ?? '',
    coverImage: trip.coverImage ?? '',
  };
}
