import { describe, expect, it } from 'vitest';

import { getTourismDestinationById } from '@/lib/vietnam-tourism';

describe('tourism destination lookup', () => {
  it('trả đúng địa điểm theo mã tĩnh', () => {
    expect(getTourismDestinationById('ha-noi-ho-guom')).toMatchObject({
      id: 'ha-noi-ho-guom',
      name: 'Hồ Gươm',
      province: 'Hà Nội',
    });
  });

  it('trả null khi mã địa điểm không tồn tại', () => {
    expect(getTourismDestinationById('dia-diem-khong-ton-tai')).toBeNull();
  });
});
