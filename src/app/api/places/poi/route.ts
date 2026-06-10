import { NextRequest } from 'next/server';
import { cacheGet, cacheSet } from '@/lib/redis';
import { PlacesPoiSchema } from '@/lib/validations/validation';
import { sendSuccess, sendError, handleApiError, AppError } from '@/lib/api-response';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const CACHE_TTL = 43200;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = PlacesPoiSchema.parse({
      lat: searchParams.get('lat'),
      lng: searchParams.get('lng'),
      radius: searchParams.get('radius') || undefined,
      type: searchParams.get('type') || undefined,
    });

    const lat = parsed.lat;
    const lng = parsed.lng;
    const radius = parsed.radius || 5000;
    const type = parsed.type || 'tourism';

    const cacheKey = `poi:${lat.toFixed(4)}:${lng.toFixed(4)}:${radius}:${type}`;

    const cached = await cacheGet(cacheKey);
    if (cached) {
      try {
        const parsedCached = JSON.parse(cached);
        return sendSuccess({
          results: parsedCached,
          cached: true,
        });
      } catch {
      }
    }

    let overpassQuery = '';
    if (type === 'food') {
      overpassQuery = `[out:json][timeout:25];(node["amenity"~"restaurant|cafe|fast_food|food_court"](around:${radius},${lat},${lng}););out body 15;`;
    } else {
      overpassQuery = `[out:json][timeout:25];(node["tourism"~"attraction|museum|viewpoint|theme_park|zoo|picnic_site|gallery|artwork"](around:${radius},${lat},${lng});node["historic"](around:${radius},${lat},${lng}););out body 15;`;
    }

    const response = await fetch(`${OVERPASS_URL}?data=${encodeURIComponent(overpassQuery)}`, {
      headers: {
        'User-Agent': 'LOTUS-TRAVEL/1.0',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new AppError('SERVICE_UNAVAILABLE', 'Không thể lấy dữ liệu địa điểm du lịch từ máy chủ bản đồ.', 502);
    }

    const data = await response.json();
    const elements = data.elements || [];

    const badTourismTypes = ['hotel', 'guest_house', 'hostel', 'motel', 'resort', 'chalet', 'apartment', 'camp_site'];
    const nameBlacklist = [
      'hố bom', 'bomb crater', 'crater', 'khách sạn', 'resort', 'motel', 'hostel', 'homestay',
      'massage', 'xoa bóp', 'cây xăng', 'trạm xăng', 'spa'
    ];

    const results = elements
      .filter((el: any) => el.tags && (el.tags.name || el.tags.name_vi))
      .map((el: any) => {
        const tags = el.tags || {};
        const name = tags.name_vi || tags.name;
        const placeType = tags.tourism || tags.historic || tags.amenity || 'attraction';

        const lowerName = name.toLowerCase();
        const t = (placeType || '').toLowerCase();
        const amenity = (tags.amenity || '').toLowerCase();
        const shop = (tags.shop || '').toLowerCase();

        if (badTourismTypes.includes(t)) return null;
        if (amenity === 'fuel' || amenity.includes('fuel') || amenity === 'massage') return null;
        if (shop === 'convenience') return null;
        if (nameBlacklist.some(w => lowerName.includes(w))) return null;

        const addrParts: string[] = [];
        if (tags['addr:housenumber']) addrParts.push(tags['addr:housenumber']);
        if (tags['addr:street']) addrParts.push(tags['addr:street']);
        if (tags['addr:subdistrict']) addrParts.push(tags['addr:subdistrict']);
        if (tags['addr:district']) addrParts.push(tags['addr:district']);
        if (tags['addr:city']) addrParts.push(tags['addr:city']);
        const address = addrParts.length > 0 ? addrParts.join(', ') : 'Xung quanh khu vực này';

        return {
          id: el.id.toString(),
          name,
          type: placeType,
          lat: el.lat,
          lng: el.lon,
          address,
        };
      })
      .filter(Boolean) as any[];

    await cacheSet(cacheKey, JSON.stringify(results), CACHE_TTL);

    return sendSuccess({
      results,
      cached: false,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      return sendError('SERVICE_UNAVAILABLE', 'Yêu cầu tới máy chủ bản đồ quá hạn. Vui lòng thử lại.', 504);
    }
    return handleApiError(err);
  }
}

