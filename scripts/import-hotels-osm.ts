import mongoose from 'mongoose';
import { normalizeVietnameseText } from '../src/lib/string';
import { loadEnv } from './load-env';

const COLLECTION = 'hotels';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const USER_AGENT = 'LotusTravel/1.0 (contact@lotus-travel.example.com)';
const DEFAULT_RADIUS_M = 15000;
const HOTEL_REGEX = '^(hotel|guest_house|hostel|resort|apartment|motel)$';

interface ProvinceHub {
  key: string;
  label: string;
  lat: number;
  lng: number;
}

const PROVINCE_HUBS: ProvinceHub[] = [
  { key: 'da nang', label: 'Đà Nẵng', lat: 16.0471, lng: 108.2068 },
  { key: 'quang ninh', label: 'Quảng Ninh', lat: 20.9506, lng: 107.0729 },
  { key: 'khanh hoa', label: 'Khánh Hòa', lat: 12.2388, lng: 109.1967 },
  { key: 'lam dong', label: 'Lâm Đồng', lat: 11.9404, lng: 108.4583 },
  { key: 'kien giang', label: 'Kiên Giang', lat: 10.227, lng: 103.967 },
  { key: 'lao cai', label: 'Lào Cai', lat: 22.3364, lng: 103.8438 },
  { key: 'quang nam', label: 'Quảng Nam', lat: 15.8801, lng: 108.338 },
  { key: 'thua thien hue', label: 'Thừa Thiên Huế', lat: 16.4637, lng: 107.5909 },
  { key: 'ha noi', label: 'Hà Nội', lat: 21.0278, lng: 105.8342 },
  { key: 'tp ho chi minh', label: 'TP. Hồ Chí Minh', lat: 10.7769, lng: 106.7009 },
];

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface HotelDoc {
  osmId: string;
  name: string;
  province: string;
  provinceKey: string;
  district: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  rating: number | null;
  priceLevel: 'budget' | 'mid' | 'luxury' | null;
  tags: string[];
  images: string[];
  phone: string | null;
  website: string | null;
  amenities: string[];
  location: { type: 'Point'; coordinates: [number, number] } | null;
  source: string;
}

function clampInt(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

function parseArgs(): { doImport: boolean; provinceKey: string | null; radius: number; limit: number | null } {
  const args = process.argv.slice(2);
  const provinceArg = args.find((a) => a.startsWith('--province='));
  const radiusArg = args.find((a) => a.startsWith('--radius='));
  const limitArg = args.find((a) => a.startsWith('--limit='));
  return {
    doImport: args.includes('--import'),
    provinceKey: provinceArg ? normalizeVietnameseText(provinceArg.split('=')[1]) : null,
    radius: radiusArg ? clampInt(Number(radiusArg.split('=')[1]), 1000, 100000, DEFAULT_RADIUS_M) : DEFAULT_RADIUS_M,
    limit: limitArg ? clampInt(Number(limitArg.split('=')[1]), 1, 5000, 5000) : null,
  };
}

function priceLevelFromStars(stars: number | null): 'budget' | 'mid' | 'luxury' | null {
  if (stars === null) return null;
  if (stars >= 4) return 'luxury';
  if (stars === 3) return 'mid';
  return 'budget';
}

function commonsFileUrl(fileName: string): string {
  const clean = fileName.replace(/^File:/i, '').trim().replace(/ /g, '_');
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(clean)}`;
}

function extractImages(tags: Record<string, string>): string[] {
  const images: string[] = [];
  const commons = tags['wikimedia_commons'];
  if (commons && /^File:/i.test(commons)) {
    images.push(commonsFileUrl(commons));
  }
  const image = tags['image'];
  if (image) {
    if (/^https?:\/\//i.test(image)) {
      images.push(image.replace(/^http:\/\//i, 'https://'));
    } else if (/^File:/i.test(image)) {
      images.push(commonsFileUrl(image));
    }
  }
  return [...new Set(images)];
}

function extractContact(tags: Record<string, string>): { phone: string | null; website: string | null } {
  const phone = tags['phone'] || tags['contact:phone'] || tags['contact:mobile'] || null;
  const website = tags['website'] || tags['contact:website'] || tags['url'] || null;
  return { phone: phone?.trim() || null, website: website?.trim() || null };
}

function extractAmenities(tags: Record<string, string>): string[] {
  const amenities: string[] = [];
  const yes = (value?: string): boolean => value === 'yes' || value === 'wlan' || value === 'wifi' || value === 'included' || value === 'free';
  if (yes(tags['internet_access']) || yes(tags['internet_access:wlan']) || yes(tags['wifi'])) amenities.push('wifi');
  if (yes(tags['air_conditioning'])) amenities.push('ac');
  if (yes(tags['swimming_pool']) || tags['leisure'] === 'swimming_pool') amenities.push('pool');
  if (yes(tags['parking']) || tags['parking'] === 'surface' || tags['parking'] === 'underground') amenities.push('parking');
  if (yes(tags['restaurant'])) amenities.push('restaurant');
  if (yes(tags['bar'])) amenities.push('bar');
  if (yes(tags['breakfast'])) amenities.push('breakfast');
  if (yes(tags['wheelchair'])) amenities.push('wheelchair');
  return [...new Set(amenities)];
}

function buildAddress(tags: Record<string, string>): string | null {
  const parts = [tags['addr:housenumber'], tags['addr:street'], tags['addr:ward'], tags['addr:district'], tags['addr:city']]
    .filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

async function fetchHotels(hub: ProvinceHub, radius: number): Promise<HotelDoc[]> {
  const query = `[out:json][timeout:60];(nwr["tourism"~"${HOTEL_REGEX}"](around:${radius},${hub.lat},${hub.lng}););out center tags;`;
  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': USER_AGENT },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!response.ok) {
    throw new Error(`Overpass trả về ${response.status} cho ${hub.label}`);
  }
  const data = (await response.json()) as { elements?: OverpassElement[] };
  const elements = data.elements ?? [];
  const docs: HotelDoc[] = [];
  for (const el of elements) {
    const tags = el.tags ?? {};
    const name = tags.name;
    if (!name) continue;
    const lat = typeof el.lat === 'number' ? el.lat : el.center?.lat ?? null;
    const lng = typeof el.lon === 'number' ? el.lon : el.center?.lon ?? null;
    const stars = tags.stars && /^\d+$/.test(tags.stars) ? Number(tags.stars) : null;
    const { phone, website } = extractContact(tags);
    docs.push({
      osmId: `${el.type}/${el.id}`,
      name,
      province: hub.label,
      provinceKey: hub.key,
      district: tags['addr:district'] || tags['addr:city'] || tags['addr:suburb'] || null,
      address: buildAddress(tags),
      lat,
      lng,
      rating: stars,
      priceLevel: priceLevelFromStars(stars),
      tags: [tags.tourism || 'hotel'],
      images: extractImages(tags),
      phone,
      website,
      amenities: extractAmenities(tags),
      location: typeof lat === 'number' && typeof lng === 'number' ? { type: 'Point', coordinates: [lng, lat] } : null,
      source: 'osm',
    });
  }
  return docs;
}

async function main(): Promise<void> {
  loadEnv();
  const { doImport, provinceKey, radius, limit } = parseArgs();
  const hubs = provinceKey ? PROVINCE_HUBS.filter((h) => h.key === provinceKey) : PROVINCE_HUBS;
  if (hubs.length === 0) {
    console.error(`Không tìm thấy hub cho tỉnh "${provinceKey}". Các key hợp lệ: ${PROVINCE_HUBS.map((h) => h.key).join(', ')}`);
    process.exitCode = 2;
    return;
  }

  console.log(`Import khách sạn từ OpenStreetMap Overpass (${doImport ? 'GHI DB' : 'DRY-RUN'}), bán kính ${radius}m${limit ? `, giới hạn ${limit}/tỉnh` : ''}.`);

  const collected: HotelDoc[] = [];
  const perProvince: Array<{ label: string; count: number }> = [];
  let errorCount = 0;
  for (const hub of hubs) {
    try {
      const docs = await fetchHotels(hub, radius);
      const limited = limit ? docs.slice(0, limit) : docs;
      console.log(`- ${hub.label}: ${limited.length} khách sạn có tên.`);
      perProvince.push({ label: hub.label, count: limited.length });
      collected.push(...limited);
    } catch (error) {
      errorCount++;
      console.error(`- ${hub.label}: lỗi`, error instanceof Error ? error.message : String(error));
    }
    await new Promise((resolve) => setTimeout(resolve, 4000));
  }

  const byOsmId = new Map(collected.map((doc) => [doc.osmId, doc]));
  const unique = [...byOsmId.values()];
  const missingDistrict = unique.filter((doc) => !doc.district).length;
  const missingCoords = unique.filter((doc) => doc.lat === null || doc.lng === null).length;
  const missingRating = unique.filter((doc) => doc.rating === null).length;
  const withImages = unique.filter((doc) => doc.images.length > 0).length;

  console.log('--- Tổng kết coverage ---');
  console.log(`Khách sạn lấy được (có tên/hợp lệ): ${collected.length}`);
  console.log(`Sau loại trùng osmId: ${unique.length}`);
  console.log(`Thiếu district: ${missingDistrict} | Thiếu tọa độ: ${missingCoords} | Thiếu rating: ${missingRating} | Có ảnh: ${withImages}`);
  console.log(`Số tỉnh lỗi: ${errorCount}`);

  if (!doImport) {
    console.log('DRY-RUN: không ghi DB. Thêm --import để ghi vào collection hotels.');
    console.log('Ví dụ 3 bản ghi:', JSON.stringify(unique.slice(0, 3), null, 2));
    process.exitCode = 0;
    return;
  }

  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('Thiếu MONGODB_URI. Hủy import.');
    process.exitCode = 2;
    return;
  }

  await mongoose.connect(uri);
  try {
    const coll = mongoose.connection.collection(COLLECTION);
    const now = new Date();
    const ops = unique.map((doc) => ({
      updateOne: {
        filter: { osmId: doc.osmId },
        update: {
          $set: { ...doc, updatedAt: now },
          $setOnInsert: { createdAt: now },
        },
        upsert: true,
      },
    }));
    if (ops.length === 0) {
      console.log('Không có dữ liệu để ghi.');
      process.exitCode = 0;
      return;
    }
    const result = await coll.bulkWrite(ops);
    console.log(`Đã ghi: ${result.upsertedCount} mới, ${result.modifiedCount} cập nhật.`);
    process.exitCode = 0;
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error('Import thất bại:', error instanceof Error ? error.message : String(error));
  process.exitCode = 2;
});
