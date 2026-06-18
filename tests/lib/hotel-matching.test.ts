import { describe, it, expect } from 'vitest';
import { matchHotels, scoreHotel, normalizeLocation, resolveHotelProvinceFilterKey, type HotelLike } from '@/lib/hotel-matching';

const hotels: HotelLike[] = [
  { name: 'Khách sạn Mường Thanh Đà Nẵng', province: 'Đà Nẵng', provinceKey: 'da nang', district: 'Hải Châu', lat: 16.06, lng: 108.22, rating: 4 },
  { name: 'Furama Resort', province: 'Đà Nẵng', provinceKey: 'da nang', district: 'Ngũ Hành Sơn', lat: 16.03, lng: 108.25, rating: 5 },
  { name: 'Vinpearl Hạ Long', province: 'Quảng Ninh', provinceKey: 'quang ninh', district: 'Hạ Long', lat: 20.94, lng: 107.08, rating: 4 },
  { name: 'Khách sạn Sài Gòn', province: 'TP. Hồ Chí Minh', provinceKey: 'tp ho chi minh', district: 'Quận 1', lat: 10.77, lng: 106.7, rating: 3 },
  { name: 'Nhà nghỉ ven biển', province: null, provinceKey: null, district: null, lat: null, lng: null, rating: null },
];

describe('normalizeLocation', () => {
  it('bỏ dấu, lowercase, chuẩn hóa khoảng trắng', () => {
    expect(normalizeLocation('  Đà   Nẵng ')).toBe('da nang');
    expect(normalizeLocation('Thừa Thiên Huế')).toBe('thua thien hue');
  });

  it('an toàn với null/undefined', () => {
    expect(normalizeLocation(undefined)).toBe('');
    expect(normalizeLocation(null)).toBe('');
  });
});

describe('matchHotels — theo khu vực', () => {
  it('destination "Đà Nẵng" chỉ trả khách sạn Đà Nẵng', () => {
    const result = matchHotels(hotels, { destination: 'Đà Nẵng' });
    expect(result.length).toBe(2);
    expect(result.every((h) => h.provinceKey === 'da nang')).toBe(true);
    expect(result.some((h) => h.provinceKey === 'tp ho chi minh')).toBe(false);
  });

  it('destination "Ha Long" (không dấu) match khu vực Hạ Long/Quảng Ninh', () => {
    const result = matchHotels(hotels, { destination: 'Ha Long' });
    expect(result.length).toBe(1);
    expect(result[0].provinceKey).toBe('quang ninh');
  });

  it('destination "Hạ Long" (có dấu) cũng map về Quảng Ninh', () => {
    const result = matchHotels(hotels, { destination: 'Hạ Long' });
    expect(result.map((h) => h.provinceKey)).toEqual(['quang ninh']);
  });

  it('không có khách sạn phù hợp → trả mảng rỗng an toàn', () => {
    const result = matchHotels(hotels, { destination: 'Cà Mau' });
    expect(result).toEqual([]);
  });

  it('input thiếu/undefined không crash', () => {
    expect(matchHotels([], {})).toEqual([]);
    expect(matchHotels(hotels, {})).toBeInstanceOf(Array);
    expect(() => scoreHotel({ name: 'X' }, {})).not.toThrow();
  });

  it('không loại khách sạn thiếu thông tin tỉnh khi match theo keyword', () => {
    const result = matchHotels(hotels, { destination: 'ven biển' });
    expect(result.some((h) => h.name === 'Nhà nghỉ ven biển')).toBe(true);
  });
});

describe('scoring theo tọa độ và điểm đến chính', () => {
  it('lat/lng gần khách sạn cho score cao hơn lat/lng xa', () => {
    const near = scoreHotel(hotels[0], { destination: 'Đà Nẵng', lat: 16.061, lng: 108.221 });
    const far = scoreHotel(hotels[1], { destination: 'Đà Nẵng', lat: 16.061, lng: 108.221 });
    expect(near).not.toBeNull();
    expect(far).not.toBeNull();
    expect(near as number).toBeGreaterThan(far as number);
  });

  it('thiếu lat/lng không crash, vẫn match theo tỉnh', () => {
    const result = matchHotels(hotels, { destination: 'Đà Nẵng', lat: null, lng: null });
    expect(result.length).toBe(2);
  });

  it('province rõ ràng + tọa độ vẫn không trả sai tỉnh', () => {
    const result = matchHotels(hotels, { destination: 'Đà Nẵng', lat: 10.77, lng: 106.7 });
    expect(result.every((h) => h.provinceKey === 'da nang')).toBe(true);
  });

  it('nhiều điểm đến: ưu tiên điểm đầu tiên (Đà Nẵng, Hội An)', () => {
    const result = matchHotels(hotels, { destination: 'Đà Nẵng, Hội An' });
    expect(result.length).toBe(2);
    expect(result.every((h) => h.provinceKey === 'da nang')).toBe(true);
  });

  it('không tách nhầm tỉnh có gạch nối (Bà Rịa - Vũng Tàu)', () => {
    expect(resolveHotelProvinceFilterKey({ destination: 'Bà Rịa - Vũng Tàu' })).toBe('ba ria vung tau');
  });
});

describe('resolveHotelProvinceFilterKey', () => {
  it('Đà Nẵng → da nang (tỉnh hợp lệ)', () => {
    expect(resolveHotelProvinceFilterKey({ destination: 'Đà Nẵng' })).toBe('da nang');
  });

  it('Hạ Long → quang ninh (area → tỉnh)', () => {
    expect(resolveHotelProvinceFilterKey({ destination: 'Hạ Long' })).toBe('quang ninh');
  });

  it('khu vực không xác định → null (không hard-filter)', () => {
    expect(resolveHotelProvinceFilterKey({ destination: 'Một nơi lạ' })).toBeNull();
  });
});
