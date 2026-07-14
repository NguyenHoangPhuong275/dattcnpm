import { describe, expect, it } from 'vitest';

import {
  getHotelAnchor,
  getTripDetailPermissions,
  groupItineraryItems,
} from '@/components/profile/trip-detail/helpers';
import type { ItineraryItem } from '@/components/profile/trip-detail/types';

function makeItem(overrides: Partial<ItineraryItem> = {}): ItineraryItem {
  return {
    _id: 'item-default',
    day: 1,
    orderIndex: 0,
    note: '',
    placeId: 'place-default',
    ...overrides,
  };
}

describe('trip detail permissions', () => {
  it('preserves the access matrix', () => {
    expect(getTripDetailPermissions()).toEqual({
      access: 'NONE',
      isOwner: false,
      canEdit: false,
      canViewPrivate: false,
    });
    expect(getTripDetailPermissions('PUBLIC')).toEqual({
      access: 'PUBLIC',
      isOwner: false,
      canEdit: false,
      canViewPrivate: false,
    });
    expect(getTripDetailPermissions('READ')).toEqual({
      access: 'READ',
      isOwner: false,
      canEdit: false,
      canViewPrivate: true,
    });
    expect(getTripDetailPermissions('EDIT')).toEqual({
      access: 'EDIT',
      isOwner: false,
      canEdit: true,
      canViewPrivate: true,
    });
    expect(getTripDetailPermissions('OWNER')).toEqual({
      access: 'OWNER',
      isOwner: true,
      canEdit: true,
      canViewPrivate: true,
    });
  });
});

describe('groupItineraryItems', () => {
  it('sorts days and each day by order index without reordering the input array', () => {
    const items = [
      makeItem({ _id: 'day-2', day: 2, orderIndex: 0 }),
      makeItem({ _id: 'day-1-later', day: 1, orderIndex: 3 }),
      makeItem({ _id: 'day-1-first', day: 1, orderIndex: 1 }),
    ];
    const originalOrder = items.map((item) => item._id);

    const groups = groupItineraryItems(items);

    expect(groups.map((group) => group.day)).toEqual([1, 2]);
    expect(groups[0].items.map((item) => item._id)).toEqual(['day-1-first', 'day-1-later']);
    expect(groups[1].items.map((item) => item._id)).toEqual(['day-2']);
    expect(items.map((item) => item._id)).toEqual(originalOrder);
  });
});

describe('getHotelAnchor', () => {
  it('uses the first itinerary place with numeric coordinates', () => {
    const items = [
      makeItem({
        _id: 'missing-coordinates',
        place: { _id: 'place-1', name: 'Thiếu tọa độ', lat: null, lng: 106 },
      }),
      makeItem({
        _id: 'first-valid',
        place: { _id: 'place-2', name: 'Điểm neo', lat: 10.75, lng: 106.67 },
      }),
      makeItem({
        _id: 'second-valid',
        place: { _id: 'place-3', name: 'Điểm sau', lat: 21.03, lng: 105.85 },
      }),
    ];

    expect(getHotelAnchor(items)).toEqual({ lat: 10.75, lng: 106.67, name: 'Điểm neo' });
  });

  it('returns null when no itinerary place has complete coordinates', () => {
    const items = [
      makeItem({ place: null }),
      makeItem({ place: { _id: 'place-1', name: 'Thiếu kinh độ', lat: 10.75, lng: null } }),
    ];

    expect(getHotelAnchor(items)).toBeNull();
  });
});
