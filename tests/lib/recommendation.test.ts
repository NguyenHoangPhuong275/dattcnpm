import { describe, expect, it } from 'vitest';

import { hasPreferences, rankPlaces, scorePlace } from '@/lib/recommendation';

describe('recommendation', () => {
  it('dùng được sở thích tiếng Việt đã lưu trước đây', () => {
    expect(scorePlace(
      { tags: ['beach'], type: 'tourism' },
      { interests: ['Biển'] },
    )).toBe(2);
    expect(scorePlace(
      { tags: ['resort'], type: 'tourism' },
      { interests: ['Spa & Nghỉ dưỡng'], travelStyles: ['Relax'] },
    )).toBe(3);
  });

  it('so khớp điểm đến yêu thích không phụ thuộc dấu và chữ hoa', () => {
    expect(scorePlace(
      { name: 'Thành phố Đà Lạt', address: 'Lâm Đồng', tags: [] },
      { preferredDestinations: ['DA LAT'] },
    )).toBe(3);
    expect(hasPreferences({ preferredDestinations: ['Đà Lạt'] })).toBe(true);
  });

  it('tương thích mức chi tiêu cũ và mới', () => {
    expect(scorePlace(
      { tags: [], priceLevel: 'low' },
      { budgetLevel: 'Tiết kiệm' },
    )).toBe(1);
    expect(scorePlace(
      { tags: [], priceLevel: 'luxury' },
      { budgetLevel: 'high' },
    )).toBe(1);
  });

  it('xếp địa điểm khớp hồ sơ thực tế lên trước độ phổ biến', () => {
    const places = [
      { id: 'history', name: 'Di tích', tags: ['history'], ratingAvg: 5, ratingCount: 100 },
      { id: 'beach', name: 'Bãi biển', tags: ['beach'], ratingAvg: 4, ratingCount: 1 },
    ];
    const ranked = rankPlaces(places, { interests: ['Biển'] });
    expect(ranked.map((place) => place.id)).toEqual(['beach', 'history']);
  });
});
