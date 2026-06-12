import { NextRequest } from 'next/server';
import { cacheGet, cacheSet } from '@/lib/redis';
import { sendSuccess, handleApiError } from '@/lib/api-response';
import { placesPoiSchema } from '@/lib/validations/place';
import { getTourismDestinationsByRegion } from '@/lib/vietnam-tourism';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const CACHE_TTL = 43200;

type PoiResult = {
  id: string;
  name: string;
  type: string;
  address: string;
  lat?: number;
  lng?: number;
  description?: string;
  rating?: string;
  image?: string;
};

type OverpassElement = {
  id: number | string;
  lat?: number;
  lon?: number;
  tags?: Record<string, string | undefined>;
};

function getCuratedPoiResults(region?: string): PoiResult[] {
  if (!region) return [];

  const results = getTourismDestinationsByRegion(region);
  if (results.length === 0) {
    const regionName = region.split(',')[0].trim();
    return [{
      id: `province-${regionName.toLowerCase().replace(/\s+/g, '-')}`,
      name: `Điểm đến tại ${regionName}`,
      type: 'du lịch',
      address: region,
      description: `Các địa điểm du lịch nổi bật tại ${regionName}`,
      rating: '4.5/5',
      image: '',
    }];
  }

  return results.slice(0, 12).map((item) => ({
    id: item.id,
    name: item.name,
    type: item.keywords[0] || 'du lịch',
    address: item.province,
    description: item.description,
    rating: item.rating,
    image: item.image,
  }));
}

function buildOverpassQuery(type: string, radius: number, lat: number, lng: number): string {
  if (type === 'food') {
    return `[out:json][timeout:25];(node["amenity"~"restaurant|cafe|fast_food|food_court"](around:${radius},${lat},${lng}););out body 15;`;
  }

  return `[out:json][timeout:25];(node["tourism"~"attraction|museum|viewpoint|theme_park|zoo|picnic_site|gallery|artwork"](around:${radius},${lat},${lng});node["historic"](around:${radius},${lat},${lng}););out body 15;`;
}

async function fetchOverpassElements(query: string): Promise<OverpassElement[]> {
  try {
    const response = await fetch(`${OVERPASS_URL}?data=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'LOTUS-TRAVEL/1.0 (https://lotus-travel.example.com; contact@lotus-travel.example.com)',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) return [];

    const data = await response.json();
    return Array.isArray(data.elements) ? data.elements : [];
  } catch {
    return [];
  }
}

function mapOverpassElements(elements: OverpassElement[]): PoiResult[] {
  const badTourismTypes = new Set(['hotel', 'guest_house', 'hostel', 'motel', 'resort', 'chalet', 'apartment', 'camp_site']);
  const nameBlacklist = ['hố bom', 'bomb crater', 'crater', 'khách sạn', 'resort', 'motel', 'hostel', 'homestay', 'massage', 'xoa bóp', 'cây xăng', 'trạm xăng', 'spa'];

  return elements
    .map((element): PoiResult | null => {
      const tags = element.tags || {};
      const name = tags.name_vi || tags.name;
      if (!name) return null;

      const placeType = tags.tourism || tags.historic || tags.amenity || 'attraction';
      const normalizedName = name.toLowerCase();
      const normalizedType = placeType.toLowerCase();
      const amenity = (tags.amenity || '').toLowerCase();
      const shop = (tags.shop || '').toLowerCase();

      if (badTourismTypes.has(normalizedType)) return null;
      if (amenity === 'fuel' || amenity.includes('fuel') || amenity === 'massage') return null;
      if (shop === 'convenience') return null;
      if (nameBlacklist.some((word) => normalizedName.includes(word))) return null;

      const addressParts = [
        tags['addr:housenumber'],
        tags['addr:street'],
        tags['addr:subdistrict'],
        tags['addr:district'],
        tags['addr:city'],
      ].filter(Boolean);

      return {
        id: String(element.id),
        name,
        type: placeType,
        lat: element.lat ?? undefined,
        lng: element.lon ?? undefined,
        address: addressParts.length > 0 ? addressParts.join(', ') : 'Xung quanh khu vực này',
      };
    })
    .filter((item): item is PoiResult => item !== null);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const parsed = placesPoiSchema.parse({
      lat: searchParams.get('lat'),
      lng: searchParams.get('lng'),
      radius: searchParams.get('radius') || undefined,
      type: searchParams.get('type') || undefined,
      region: searchParams.get('region') || undefined,
    });

    const curatedResults = getCuratedPoiResults(parsed.region);
    if (curatedResults.length > 0) {
      return sendSuccess({
        results: curatedResults,
        cached: false,
        source: 'curated',
      });
    }

    const radius = parsed.radius || 5000;
    const type = parsed.type || 'tourism';
    const cacheKey = `poi:${parsed.lat.toFixed(4)}:${parsed.lng.toFixed(4)}:${radius}:${type}`;
    const cached = await cacheGet(cacheKey);

    if (cached) {
      try {
        return sendSuccess({
          results: JSON.parse(cached),
          cached: true,
        });
      } catch {
      }
    }

    const query = buildOverpassQuery(type, radius, parsed.lat, parsed.lng);
    const results = mapOverpassElements(await fetchOverpassElements(query));

    await cacheSet(cacheKey, JSON.stringify(results), CACHE_TTL);

    return sendSuccess({
      results,
      cached: false,
      source: 'overpass',
    });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
