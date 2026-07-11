import { describe, expect, it } from 'vitest';

import { HOME_NEWS } from '@/data/home';
import { LOCALITY_DISCOVERY, LOCALITY_NEWS } from '@/data/localities';
import { TRAVEL_REFERENCES } from '@/data/travel-references';
import {
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
    for (const item of HOME_NEWS) {
      expect(TRAVEL_REFERENCES[item.referenceSlug]).toBeDefined();
      expect(getTravelReferenceHref(item.referenceSlug)).not.toContain('?q=');
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
    expect(getPlannerDestinationHref('Hồ Gươm')).toBe(`/?q=${encodeURIComponent('Hồ Gươm')}#planner`);
  });

  it('trả null an toàn khi slug tham khảo không tồn tại', () => {
    expect(getTravelReferencePageData('khong-ton-tai')).toBeNull();
  });
});
