import { NextRequest } from 'next/server';
import { cacheGet, cacheSet } from '@/lib/redis';
import { getDb } from '@/lib/mongodb';
import { getAuthUserId } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { PlacesSearchSchema } from '@/lib/validations/validation';
import { sendSuccess, sendError, handleApiError, AppError } from '@/lib/api-response';
import type { Place } from '@/database/schema';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const USER_AGENT = 'LOTUS-TRAVEL/1.0 (https://lotus-travel.example.com; contact@lotus-travel.example.com)';
const CACHE_TTL = 86400;

interface NominatimResult {
  place_id: number;
  osm_type?: string;
  osm_id?: number;
  lat: string;
  lon: string;
  display_name: string;
  type?: string;
  class?: string;
  address?: Record<string, string>;
}

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

function buildCacheKey(query: string): string {
  return `geo:search:${encodeURIComponent(normalizeQuery(query))}`;
}

async function recordSearchHistory(userId: string | null, query: string, resultCount: number, lat?: number | null, lng?: number | null) {
  if (!userId) return;
  try {
    const db = await getDb();
    await db.searchHistories.insertOne({
      userId,
      query,
      lat: lat ?? null,
      lng: lng ?? null,
      resultCount,
      metadata: null,
      createdAt: new Date(),
    });
    const histories = await db.searchHistories.find({ userId });
    histories
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(50)
      .forEach((item) => {
        db.searchHistories.deleteOne(item._id).catch(() => null);
      });
  } catch {}
}

function removeVietnameseTones(str: string): string {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
  str = str.replace(/Đ/g, 'D');
  str = str.replace(/\u0300|\u0301|\u0309|\u0303|\u0323/g, '');
  str = str.replace(/\u02C6|\u0306|\u031B/g, '');
  return str;
}

function getParentRegion(address?: Record<string, string>): string | null {
  if (!address) return null;
  let region = address.state || address.province || address.city || address.municipality;
  if (!region) return null;
  region = region.replace(/^(Tỉnh|Thành phố|Thị xã|Quận|Huyện)\s+/i, '');
  return region.trim();
}

function getParentRegionFromDisplayName(displayName: string): string | null {
  const parts = displayName.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    let region = parts[parts.length - 2];
    if (region && region.toLowerCase() !== 'việt nam') {
      region = region.replace(/^(Tỉnh|Thành phố|Thị xã|Quận|Huyện)\s+/i, '');
      return region;
    }
  }
  return null;
}

function getRegionName(result: NominatimResult): string {
  const region = getParentRegion(result.address) || getParentRegionFromDisplayName(result.display_name);
  return region || result.display_name.split(',')[0].trim();
}

function isValidTourismPOI(name: string, tagType?: string): boolean {
  const lower = (name || '').toLowerCase();
  const t = (tagType || '').toLowerCase();

  const badTourismTypes = ['hotel', 'guest_house', 'hostel', 'motel', 'resort', 'chalet', 'apartment', 'camp_site', 'caravan_site', 'wilderness_hut'];
  if (badTourismTypes.includes(t)) return false;

  const blacklist = [
    'cây xăng', 'trạm xăng', 'petrolimex', 'gas station', 'xăng dầu', 'dầu khí', 'xăng',
    'pharmacy', 'dược phẩm', 'euvipharm', 'atm', 'ngân hàng', 'bank',
    'hố bom', 'bomb crater', 'crater', 'hố bom bi',
    'trụ sở', 'office', 'company', 'công ty',
    'tòa án', 'courthouse', 'bệnh viện', 'hospital', 'trường học', 'school',
    'chợ', 'market', 'siêu thị', 'supermarket', 'nhà thuốc', 'clinic', 'phòng khám',
    'ủy ban', 'ubnd', 'post office', 'bưu điện', 'police', 'công an',
    'khách sạn', 'resort', 'motel', 'hostel', 'homestay', 'nhà nghỉ', 'căn hộ du lịch',
    'massage', 'xoa bóp', 'spa', 'massage parlor', 'nhà massage'
  ];
  return !blacklist.some(word => lower.includes(word));
}

function mapNominatimToPlace(result: NominatimResult): Omit<Place, '_id' | 'createdAt' | 'updatedAt' | 'ratingAvg' | 'ratingCount'> {
  const lat = parseFloat(result.lat);
  const lng = parseFloat(result.lon);
  const regionName = getRegionName(result);
  const rawName = result.display_name.split(',')[0].trim();

  let type = result.type || result.class || 'location';
  if (result.class === 'amenity') type = 'amenity';
  if (result.class === 'tourism') type = 'tourism';
  if (result.class === 'place') type = 'place';
  if (result.class === 'historic') type = 'historic';

  if (['administrative', 'boundary'].includes(result.class || '') || 
      ['administrative', 'province', 'city', 'town', 'village', 'district'].includes(type)) {
    type = 'province';
  }

  const osmId = result.osm_id 
    ? `${result.osm_type || 'node'}:${result.osm_id}` 
    : `place:${result.place_id}`;

  const isAdministrative = type === 'province';

  return {
    osmId,
    name: isAdministrative ? rawName : regionName,
    type,
    lat,
    lng,
    address: isAdministrative ? null : rawName,
    openingHours: null,
    images: null,
    osmTags: {
      class: result.class,
      type: result.type,
      ...result.address,
    },
    tags: [type],
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    const validation = PlacesSearchSchema.parse({ q: query });
    const { q } = validation;
    const normalized = normalizeQuery(q);
    const cacheKey = buildCacheKey(q);

    const userId = await getAuthUserId(request);
    const rateIdentity = userId || getClientIp(request);
    const rate = await checkRateLimit({
      key: `rl:search:${rateIdentity}`,
      limit: 80,
      windowSeconds: 60,
    });
    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Quá nhiều yêu cầu tìm kiếm. Vui lòng thử lại sau.', 429);
    }

    const cached = await cacheGet(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as Place[];
        await recordSearchHistory(userId, q, parsed.length, parsed[0]?.lat ?? null, parsed[0]?.lng ?? null);
        return sendSuccess({ 
          results: parsed,
          cached: true 
        });
      } catch {}
    }

    const nomParams1 = new URLSearchParams({
      q: q,
      format: 'json',
      limit: '10',
      countrycodes: 'vn',
      addressdetails: '1',
      'accept-language': 'vi',
    });

    const nomParams2 = new URLSearchParams({
      q: removeVietnameseTones(q),
      format: 'json',
      limit: '10',
      countrycodes: 'vn',
      addressdetails: '1',
      'accept-language': 'vi',
    });

    const [res1, res2] = await Promise.all([
      fetch(`${NOMINATIM_URL}?${nomParams1.toString()}`, {
        headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      }).then(res => res.ok ? res.json() : []).catch(() => []),
      fetch(`${NOMINATIM_URL}?${nomParams2.toString()}`, {
        headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      }).then(res => res.ok ? res.json() : []).catch(() => [])
    ]);

    const combinedRaw = [...res1, ...res2];
    const seenOsmIds = new Set<string>();
    const uniqueRaw: NominatimResult[] = [];

    for (const item of combinedRaw) {
      const osmId = item.osm_id ? `${item.osm_type || 'node'}:${item.osm_id}` : `place:${item.place_id}`;
      if (!seenOsmIds.has(osmId)) {
        seenOsmIds.add(osmId);
        uniqueRaw.push(item);
      }
    }

    let mainLocationName = q;
    let centerLat: number | null = null;
    let centerLng: number | null = null;

    if (uniqueRaw.length > 0) {
      const top = uniqueRaw[0];
      mainLocationName = top.display_name.split(',')[0].trim() || q;
      centerLat = parseFloat(top.lat);
      centerLng = parseFloat(top.lon);
    }

    const filteredRaw = uniqueRaw.filter(item => {
      const cls = item.class || '';
      const typ = item.type || '';
      const rawName = item.display_name.split(',')[0].trim();
      if (!isValidTourismPOI(rawName, typ)) return false;

      if (cls === 'tourism') return true;
      if (cls === 'historic') return true;
      if (cls === 'amenity' && typ === 'place_of_worship') return true;
      if (cls === 'leisure' && ['park', 'nature_reserve', 'garden', 'beach_resort'].includes(typ)) return true;
      return false;
    });

    const parsedPlaces = filteredRaw.map(r => mapNominatimToPlace(r));

    if (!centerLat && parsedPlaces.length > 0) {
      mainLocationName = parsedPlaces[0].name;
      centerLat = parsedPlaces[0].lat;
      centerLng = parsedPlaces[0].lng;
    }

    const additionalPOIs: Omit<Place, '_id' | 'createdAt' | 'updatedAt' | 'ratingAvg' | 'ratingCount'>[] = [];

    if (centerLat && centerLng) {
      const poiCacheKey = `poi:live:${centerLat.toFixed(4)}:${centerLng.toFixed(4)}:60000:v2`;
      let rawPois: any[] = [];
      const cachedPois = await cacheGet(poiCacheKey);

      if (cachedPois) {
        try { rawPois = JSON.parse(cachedPois); } catch {}
      } else {
        const overpassQuery = `[out:json][timeout:20];(node["tourism"(around:50000,${centerLat},${centerLng});way["tourism"(around:50000,${centerLat},${centerLng});node["historic"(around:50000,${centerLat},${centerLng});way["historic"(around:50000,${centerLat},${centerLng});node["amenity"="place_of_worship"](around:50000,${centerLat},${centerLng}););out center 50;`;
        try {
          const res = await fetch(`${OVERPASS_URL}?data=${encodeURIComponent(overpassQuery)}`, {
            headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
            signal: AbortSignal.timeout(12000),
          });
          if (res.ok) {
            const data = await res.json();
            const elements = data.elements || [];
            rawPois = elements
              .filter((el: any) => el.tags && (el.tags.name || el.tags.name_vi))
              .map((el: any) => {
                const tags = el.tags || {};
                return {
                  id: el.id.toString(),
                  name: tags.name_vi || tags.name,
                  type: tags.tourism || tags.historic || 'attraction',
                  amenity: tags.amenity,
                  shop: tags.shop,
                  lat: el.lat || (el.center && el.center.lat),
                  lng: el.lon || (el.center && el.center.lon),
                };
              });
            await cacheSet(poiCacheKey, JSON.stringify(rawPois), 43200);
          }
        } catch {
        }
      }

      const provLower = mainLocationName.toLowerCase();
      rawPois.sort((a: any, b: any) => {
        const aHasProv = a.name.toLowerCase().includes(provLower);
        const bHasProv = b.name.toLowerCase().includes(provLower);
        if (aHasProv && !bHasProv) return -1;
        if (!aHasProv && bHasProv) return 1;
        return 0;
      });

      for (const poi of rawPois) {
        const amenity = (poi.amenity || '').toLowerCase();
        const shop = (poi.shop || '').toLowerCase();
        const pname = (poi.name || '').toLowerCase();

        if (amenity === 'fuel' || amenity.includes('fuel') || amenity === 'massage') continue;
        if (shop === 'convenience' || shop === 'supermarket' || shop === 'kiosk') continue;
        if (pname.includes('massage') || pname.includes('xoa bóp') || pname.includes('cây xăng') || pname.includes('trạm xăng')) continue;

        if (!isValidTourismPOI(poi.name, poi.type)) continue;
        if (additionalPOIs.length >= 30) break;

        additionalPOIs.push({
          osmId: `node:${poi.id}`,
          name: poi.name,
          type: poi.type,
          lat: poi.lat,
          lng: poi.lng,
          address: mainLocationName,
          openingHours: null,
          images: null,
          osmTags: {},
          tags: [poi.type],
        });
      }

      if (additionalPOIs.length === 0 && parsedPlaces.length > 0) {
        for (const p of parsedPlaces.slice(0, 12)) {
          if (!isValidTourismPOI(p.name || '', p.type)) continue;
          additionalPOIs.push(p as any);
          if (additionalPOIs.length >= 12) break;
        }
      }
    }

    let tourismResults = additionalPOIs.length > 0 ? [...additionalPOIs] : [...parsedPlaces];

    tourismResults = tourismResults.filter(item => {
      const type = (item.type || '').toLowerCase();
      const iname = (item.name || '').toLowerCase();
      const badTypes = ['administrative', 'province', 'city', 'town', 'district', 'ward', 'place', 'suburb', 'hotel', 'guest_house', 'hostel', 'motel', 'resort'];
      if (badTypes.includes(type)) return false;
      if (iname.includes('massage') || iname.includes('xoa bóp') || iname.includes('cây xăng') || iname.includes('trạm xăng')) return false;
      if (!isValidTourismPOI(item.name || '', type)) return false;
      return true;
    });

    tourismResults.sort((a: any, b: any) => {
      const aName = a.address ? `${a.name} ${a.address}`.toLowerCase() : a.name.toLowerCase();
      const bName = b.address ? `${b.name} ${b.address}`.toLowerCase() : b.name.toLowerCase();
      const aExact = aName.includes(normalized) || aName.includes(removeVietnameseTones(q));
      const bExact = bName.includes(normalized) || bName.includes(removeVietnameseTones(q));
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      return 0;
    });

    const slicedResults = tourismResults.slice(0, 12);

    const db = await getDb();
    const savePromises = slicedResults.map(async (item) => {
      const existing = await db.places.findOne({ osmId: item.osmId });
      if (existing) {
        return await db.places.updateOne(existing._id, {
          name: item.name,
          address: item.address,
          type: item.type,
        }) ?? existing;
      } else {
        const now = new Date();
        return await db.places.insertOne({
          ...item,
          ratingAvg: 0,
          ratingCount: 0,
          createdAt: now,
          updatedAt: now,
        } as any);
      }
    });
    const savedPayload = await Promise.all(savePromises);

    const cachePayload = savedPayload.map(p => ({
      _id: p._id,
      name: p.name,
      type: p.type,
      lat: p.lat,
      lng: p.lng,
      address: p.address,
      osmId: p.osmId,
    }));

    await cacheSet(cacheKey, JSON.stringify(cachePayload), CACHE_TTL);

    await recordSearchHistory(userId, q, cachePayload.length, centerLat, centerLng);

    return sendSuccess({
      results: cachePayload,
      cached: false,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      return sendError('SERVICE_UNAVAILABLE', 'Tìm kiếm mất quá lâu. Vui lòng thử lại.', 504);
    }
    return handleApiError(err);
  }
}


