import { describe, expect, it } from 'vitest';

import { LOCALITY_DISCOVERY, LOCALITY_NEWS } from '@/data/localities';
import { TRAVEL_REFERENCES, TRAVEL_REFERENCE_SLUGS } from '@/data/travel-references';
import {
  getDestinationDetailHref,
  getLatestTravelReferences,
  getPlannerDestinationHref,
  getTravelReferenceHref,
  getTravelReferencePageData,
} from '@/lib/travel-references';

describe('travel references navigation', () => {
  it('ánh xạ tin tức địa phương tới đúng khu vực trong ảnh', () => {
    const expectedRegions = ['Quảng Nam', 'Hà Giang', 'Quảng Ninh', 'Thừa Thiên Huế'];

    expect(LOCALITY_NEWS.map((item) => TRAVEL_REFERENCES[item.referenceSlug].region)).toEqual(expectedRegions);
    for (const item of LOCALITY_NEWS) {
      const href = getTravelReferenceHref(item.referenceSlug);
      expect(href).toBe(`/travel-references/${item.referenceSlug}`);
      expect(href.startsWith('#')).toBe(false);
      expect(getTravelReferencePageData(item.referenceSlug)?.destinations.length).toBeGreaterThan(0);
    }
  });

  it('mọi tin tức trang chủ đều mở cẩm nang riêng', () => {
    const articles = getLatestTravelReferences(6);
    expect(articles.length).toBeGreaterThan(0);
    for (const item of articles) {
      expect(TRAVEL_REFERENCES[item.slug]).toBeDefined();
      expect(getTravelReferenceHref(item.slug)).not.toContain('?q=');
    }
  });

  it('tin mới nhất được xếp trước và mọi bài có phân loại + ngày đăng hợp lệ', () => {
    const articles = getLatestTravelReferences(TRAVEL_REFERENCE_SLUGS.length);
    expect(articles).toHaveLength(TRAVEL_REFERENCE_SLUGS.length);
    for (let i = 1; i < articles.length; i++) {
      expect(articles[i - 1].publishedAt >= articles[i].publishedAt).toBe(true);
    }
    for (const slug of TRAVEL_REFERENCE_SLUGS) {
      const reference = TRAVEL_REFERENCES[slug];
      expect(reference.category.length).toBeGreaterThan(0);
      expect(Number.isNaN(new Date(`${reference.publishedAt}T00:00:00`).getTime())).toBe(false);
    }
  });

  it('khám phá thêm dẫn tới danh sách tham khảo của địa phương, không đẩy về planner', () => {
    expect(LOCALITY_DISCOVERY.map((item) => item.action)).toEqual([
      { type: 'places', theme: 'van-hoa' },
      { type: 'places', theme: 'thien-nhien' },
      { type: 'hotels' },
    ]);
  });

  it('planner href chỉ dùng cho nút hành động trong danh sách tham khảo', () => {
    expect(getPlannerDestinationHref('Hồ Gươm')).toBe(`/?q=${encodeURIComponent('Hồ Gươm')}&select=1#planner`);
  });

  it('href xem chi tiết mở route tĩnh của địa điểm', () => {
    expect(getDestinationDetailHref('ha-noi-ho-guom')).toBe('/destinations/ha-noi-ho-guom');
  });

  it('trả null an toàn khi slug tham khảo không tồn tại', () => {
    expect(getTravelReferencePageData('khong-ton-tai')).toBeNull();
  });
});
