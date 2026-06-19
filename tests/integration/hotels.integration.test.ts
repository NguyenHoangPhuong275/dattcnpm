import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { getDb, disconnectMongo, disconnectRedis, getRedis } from '@/lib/db';
import { GET as hotelSearchGET } from '@/app/api/hotels/search/route';

const SOURCE = 'test-hotel';

function req(query: string) {
  return new Request(`http://localhost/api/hotels/search${query}`) as never;
}

async function flushHotelCache(): Promise<void> {
  const redis = getRedis();
  const keys = await redis.keys('hotels:search:*').catch(() => [] as string[]);
  if (keys.length) await redis.del(...keys).catch(() => 0);
}

beforeAll(async () => {
  const db = await getDb();
  await db.hotels.deleteMany({ source: SOURCE });
  await db.hotels.insertMany([
    { name: 'Mường Thanh Đà Nẵng', province: 'Đà Nẵng', provinceKey: 'da nang', district: 'Hải Châu', lat: 16.06, lng: 108.22, rating: 4, priceLevel: 'mid', source: SOURCE },
    { name: 'Furama Resort', province: 'Đà Nẵng', provinceKey: 'da nang', district: 'Ngũ Hành Sơn', lat: 16.03, lng: 108.25, rating: 5, priceLevel: 'luxury', source: SOURCE },
    { name: 'Vinpearl Hạ Long', province: 'Quảng Ninh', provinceKey: 'quang ninh', district: 'Hạ Long', lat: 20.94, lng: 107.08, rating: 4, priceLevel: 'luxury', source: SOURCE },
    { name: 'Khách sạn Sài Gòn', province: 'TP. Hồ Chí Minh', provinceKey: 'tp ho chi minh', district: 'Quận 1', lat: 10.77, lng: 106.7, rating: 3, priceLevel: 'budget', source: SOURCE },
  ]);
});

beforeEach(async () => {
  await flushHotelCache();
});

afterAll(async () => {
  const db = await getDb();
  await db.hotels.deleteMany({ source: SOURCE });
  await flushHotelCache();
  await disconnectMongo?.().catch(() => {});
  await disconnectRedis().catch(() => {});
});

describe('GET /api/hotels/search', () => {
  it('destination "Đà Nẵng" chỉ trả khách sạn Đà Nẵng', async () => {
    const res = await hotelSearchGET(req('?destination=' + encodeURIComponent('Đà Nẵng')));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.data.length).toBe(2);
    expect(body.data.data.every((h: { province: string }) => h.province === 'Đà Nẵng')).toBe(true);
    expect(body.data.matchedBy).toBe('province');
    expect(body.data.total).toBe(2);
    expect(body.data.page).toBe(1);
    expect(body.data.totalPages).toBe(1);
  });

  it('destination "Ha Long" match khu vực Hạ Long/Quảng Ninh', async () => {
    const res = await hotelSearchGET(req('?destination=Ha%20Long'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.data.length).toBe(1);
    expect(body.data.data[0].province).toBe('Quảng Ninh');
  });

  it('không có khách sạn phù hợp → trả empty result an toàn', async () => {
    const res = await hotelSearchGET(req('?destination=' + encodeURIComponent('Cà Mau')));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.data).toEqual([]);
    expect(body.data.total).toBe(0);
    expect(body.data.totalPages).toBe(0);
  });

  it('phân trang: limit=1 trả đúng meta và 1 kết quả/trang', async () => {
    const res1 = await hotelSearchGET(req('?destination=' + encodeURIComponent('Đà Nẵng') + '&limit=1&page=1'));
    const body1 = await res1.json();
    expect(body1.data.data.length).toBe(1);
    expect(body1.data.total).toBe(2);
    expect(body1.data.totalPages).toBe(2);
    expect(body1.data.page).toBe(1);

    const res2 = await hotelSearchGET(req('?destination=' + encodeURIComponent('Đà Nẵng') + '&limit=1&page=2'));
    const body2 = await res2.json();
    expect(body2.data.data.length).toBe(1);
    expect(body2.data.page).toBe(2);
    expect(body2.data.data[0].id).not.toBe(body1.data.data[0].id);
  });

  it('lọc theo priceLevel=luxury (Task 2.8) chỉ trả khách sạn cao cấp', async () => {
    const res = await hotelSearchGET(req('?destination=' + encodeURIComponent('Đà Nẵng') + '&priceLevel=luxury'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.data.length).toBe(1);
    expect(body.data.data[0].name).toBe('Furama Resort');
    expect(body.data.data.every((h: { priceLevel: string }) => h.priceLevel === 'luxury')).toBe(true);
  });

  it('lọc theo minRating=5 chỉ trả khách sạn từ 5 sao', async () => {
    const res = await hotelSearchGET(req('?destination=' + encodeURIComponent('Đà Nẵng') + '&minRating=5'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.data.length).toBe(1);
    expect(body.data.data.every((h: { rating: number }) => h.rating >= 5)).toBe(true);
  });

  it('priceLevel không hợp lệ → 400', async () => {
    const res = await hotelSearchGET(req('?destination=' + encodeURIComponent('Đà Nẵng') + '&priceLevel=xxx'));
    expect(res.status).toBe(400);
  });

  it('thiếu toàn bộ tham số → 400 validation', async () => {
    const res = await hotelSearchGET(req(''));
    expect(res.status).toBe(400);
  });

  it('không trả undefined/null/NaN trong field số', async () => {
    const res = await hotelSearchGET(req('?province=' + encodeURIComponent('Đà Nẵng')));
    const body = await res.json();
    expect(res.status).toBe(200);
    for (const hotel of body.data.data) {
      expect(hotel.name).toBeTruthy();
      expect(Number.isNaN(hotel.lat)).toBe(false);
      expect(hotel.rating === null || typeof hotel.rating === 'number').toBe(true);
    }
  });
});
