import { describe, expect, it } from 'vitest';

import {
  getTourismDestinationById,
  provinceCenter,
  tourismDestinationToSearchPlace,
} from '@/lib/vietnam-tourism';

describe('tọa độ tỉnh của dữ liệu du lịch', () => {
  it('dùng tâm Quảng Ninh cho cả tên có dấu và không dấu', () => {
    const accented = provinceCenter('Quảng Ninh');
    const plain = provinceCenter('Quang Ninh');
    const destination = getTourismDestinationById('quang-ninh-ong-thien-cung');

    expect(accented).toMatchObject({ lat: 21.0064, lng: 107.2925 });
    expect(plain).toEqual(accented);
    expect(accented).not.toMatchObject({ lat: 16.0471, lng: 108.2068 });
    expect(destination).not.toBeNull();
    expect(tourismDestinationToSearchPlace(destination!)).toMatchObject({
      lat: 21.0064,
      lng: 107.2925,
    });
  });
});
