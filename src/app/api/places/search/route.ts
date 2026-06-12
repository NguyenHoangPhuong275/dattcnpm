import { NextRequest } from 'next/server';
import { cacheGet, cacheSet } from '@/lib/redis';
import { getDb } from '@/lib/mongodb';
import { getAuthUserId } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { placesSearchSchema } from '@/lib/validations/place';
import { sendSuccess, sendError, handleApiError, AppError } from '@/lib/api-response';
import { searchTourismPlaces, provinceCenter } from '@/lib/vietnam-tourism';
import type { Place } from '@/database/schema';
import { LOCALITIES } from '@/lib/localities';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const USER_AGENT = 'LotusTravel/1.0 (contact@lotus-travel.example.com)';
const CACHE_TTL = 86400;

const LOCAL_SEARCH_FALLBACKS = [
  { slug: 'ha-noi', name: 'Hà Nội', type: 'province', lat: 21.0278, lng: 105.8342, address: 'Hà Nội, Việt Nam', tags: ['city', 'culture'] },
  { slug: 'da-lat', name: 'Đà Lạt', type: 'province', lat: 11.9404, lng: 108.4583, address: 'Lâm Đồng, Việt Nam', tags: ['nature', 'resort'] },
  { slug: 'hoi-an', name: 'Hội An', type: 'historic', lat: 15.8801, lng: 108.338, address: 'Quảng Nam, Việt Nam', tags: ['heritage', 'culture'] },
  { slug: 'da-nang', name: 'Đà Nẵng', type: 'province', lat: 16.0471, lng: 108.2068, address: 'Đà Nẵng, Việt Nam', tags: ['beach', 'city'] },
  { slug: 'ha-long', name: 'Hạ Long', type: 'tourism', lat: 20.9101, lng: 107.1839, address: 'Quảng Ninh, Việt Nam', tags: ['bay', 'nature'] },
  { slug: 'hue', name: 'Huế', type: 'historic', lat: 16.4637, lng: 107.5909, address: 'Thừa Thiên Huế, Việt Nam', tags: ['heritage', 'culture'] },
  { slug: 'nha-trang', name: 'Nha Trang', type: 'tourism', lat: 12.2388, lng: 109.1967, address: 'Khánh Hòa, Việt Nam', tags: ['beach', 'island'] },
  { slug: 'sa-pa', name: 'Sa Pa', type: 'tourism', lat: 22.3364, lng: 103.8438, address: 'Lào Cai, Việt Nam', tags: ['mountain', 'nature'] },
  { slug: 'phu-quoc', name: 'Phú Quốc', type: 'tourism', lat: 10.2899, lng: 103.984, address: 'Kiên Giang, Việt Nam', tags: ['island', 'beach'] },
  { slug: 'can-tho', name: 'Cần Thơ', type: 'province', lat: 10.0452, lng: 105.7469, address: 'Cần Thơ, Việt Nam', tags: ['river', 'food'] },
];

const CLEAN_LOCAL_SEARCH_FALLBACKS = LOCAL_SEARCH_FALLBACKS;

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

type PlaceDraft = Omit<Place, '_id' | 'createdAt' | 'updatedAt' | 'ratingAvg' | 'ratingCount'>;

interface RawPoi {
  id: string;
  name: string;
  type: string;
  amenity?: string;
  shop?: string;
  lat: number;
  lng: number;
}

interface OverpassSearchElement {
  id: number | string;
  lat?: number;
  lon?: number;
  center?: {
    lat?: number;
    lon?: number;
  };
  tags?: Record<string, string | undefined>;
}

interface OverpassSearchResponse {
  elements?: OverpassSearchElement[];
}

interface SearchCenter {
  mainLocationName: string;
  centerLat: number | null;
  centerLng: number | null;
}

const PRIORITY_LOCALITY_RESULTS: Array<PlaceDraft & { aliases: string[] }> = [
  {
    osmId: 'local:ha-noi',
    name: 'H\u00e0 N\u1ed9i',
    type: 'province',
    lat: 21.0278,
    lng: 105.8342,
    address: 'H\u00e0 N\u1ed9i, Vi\u1ec7t Nam',
    openingHours: null,
    images: null,
    osmTags: {},
    tags: ['city', 'culture'],
    aliases: ['ha noi', 'hanoi', 'thu do ha noi'],
  },
  {
    osmId: 'local:tp-ho-chi-minh',
    name: 'H\u1ed3 Ch\u00ed Minh',
    type: 'province',
    lat: 10.7769,
    lng: 106.7009,
    address: 'TP. H\u1ed3 Ch\u00ed Minh, Vi\u1ec7t Nam',
    openingHours: null,
    images: null,
    osmTags: {},
    tags: ['city', 'culture', 'food'],
    aliases: ['ho chi minh', 'tp ho chi minh', 'thanh pho ho chi minh', 'hcm', 'tphcm', 'sai gon', 'saigon', 'sai thanh'],
  },
  {
    osmId: 'local:da-lat',
    name: '\u0110\u00e0 L\u1ea1t',
    type: 'province',
    lat: 11.9404,
    lng: 108.4583,
    address: 'L\u00e2m \u0110\u1ed3ng, Vi\u1ec7t Nam',
    openingHours: null,
    images: null,
    osmTags: {},
    tags: ['nature', 'resort'],
    aliases: ['da lat', 'dalat', 'lam dong'],
  },
  {
    osmId: 'local:da-nang',
    name: '\u0110\u00e0 N\u1eb5ng',
    type: 'province',
    lat: 16.0471,
    lng: 108.2068,
    address: '\u0110\u00e0 N\u1eb5ng, Vi\u1ec7t Nam',
    openingHours: null,
    images: null,
    osmTags: {},
    tags: ['beach', 'city'],
    aliases: ['da nang', 'danang'],
  },
  {
    osmId: 'local:hoi-an',
    name: 'H\u1ed9i An',
    type: 'historic',
    lat: 15.8801,
    lng: 108.338,
    address: 'Qu\u1ea3ng Nam, Vi\u1ec7t Nam',
    openingHours: null,
    images: null,
    osmTags: {},
    tags: ['heritage', 'culture'],
    aliases: ['hoi an', 'hoian', 'quang nam'],
  },
];

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

function normalizeVietnameseSearch(value: string): string {
  return removeVietnameseTones(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/\u0110/g, 'D')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .trim()
    .toLowerCase();
}

function getPriorityLocalityResults(query: string): PlaceDraft[] {
  const normalized = normalizeVietnameseSearch(query);
  return PRIORITY_LOCALITY_RESULTS
    .filter((item) => item.aliases.some((alias) => alias === normalized || alias.includes(normalized) || normalized.includes(alias)))
    .map((item) => ({
      osmId: item.osmId,
      name: item.name,
      type: item.type,
      lat: item.lat,
      lng: item.lng,
      address: item.address,
      openingHours: item.openingHours,
      images: item.images,
      osmTags: item.osmTags,
      tags: item.tags,
    }));
}

function getLocalFallbackResults(query: string): PlaceDraft[] {
  const normalized = normalizeVietnameseSearch(query);
  const fallbackItems = CLEAN_LOCAL_SEARCH_FALLBACKS.length > 0 ? CLEAN_LOCAL_SEARCH_FALLBACKS : LOCAL_SEARCH_FALLBACKS;
  const fromClean = fallbackItems
    .filter((item) => {
      const haystack = normalizeVietnameseSearch(`${item.name} ${item.address} ${item.tags.join(' ')}`);
      return haystack.includes(normalized) || normalized.includes(normalizeVietnameseSearch(item.name));
    })
    .map((item) => ({
      osmId: `local:${item.slug}`,
      name: item.name,
      type: item.type,
      lat: item.lat,
      lng: item.lng,
      address: item.address,
      openingHours: null,
      images: null,
      osmTags: {},
      tags: item.tags,
    }));

  const fromLocalities = LOCALITIES
    .filter((loc) => {
      const nameNorm = normalizeVietnameseSearch(loc.name);
      const addrNorm = normalizeVietnameseSearch(loc.description || '');
      return nameNorm.includes(normalized) || normalized.includes(nameNorm) || addrNorm.includes(normalized);
    })
    .slice(0, 6)
    .map((loc) => {
      const center = provinceCenter(loc.name);
      return {
        osmId: `locality:${loc.slug}`,
        name: loc.name,
        type: 'province',
        lat: center.lat,
        lng: center.lng,
        address: `${loc.name}, Việt Nam`,
        openingHours: null,
        images: null,
        osmTags: {},
        tags: ['province', 'du lịch'],
      };
    });

  const merged = [...fromClean, ...fromLocalities];
  const seen = new Set<string>();
  return merged.filter((p) => {
    if (seen.has(p.name)) return false;
    seen.add(p.name);
    return true;
  }).slice(0, 8);
}

function buildCacheKey(query: string): string {
  return `geo:search:${encodeURIComponent(normalizeQuery(query))}`;
}

async function recordSearchHistory(userId: string | null, query: string, resultCount: number, lat?: number | null, lng?: number | null): Promise<void> {
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
        db.searchHistories.deleteOne(item._id).catch((err) => {
          console.error('Lỗi khi xóa lịch sử tìm kiếm thừa:', err);
          return null;
        });
      });
  } catch (error) {
    console.error('Lỗi khi ghi lại lịch sử tìm kiếm:', error);
    return;
  }
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

function mapNominatimToPlace(result: NominatimResult): PlaceDraft {
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

function buildNominatimParams(query: string): URLSearchParams {
  return new URLSearchParams({
    q: query,
    format: 'json',
    limit: '10',
    countrycodes: 'vn',
    addressdetails: '1',
    'accept-language': 'vi',
  });
}

async function fetchNominatim(query: string): Promise<NominatimResult[]> {
  const params = buildNominatimParams(query);
  const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

async function fetchNominatimCandidates(query: string): Promise<NominatimResult[]> {
  const [primary, normalized] = await Promise.all([
    fetchNominatim(query).catch(() => []),
    fetchNominatim(normalizeVietnameseSearch(query)).catch(() => []),
  ]);

  const seenOsmIds = new Set<string>();
  return [...primary, ...normalized].filter((item) => {
    const osmId = item.osm_id ? `${item.osm_type || 'node'}:${item.osm_id}` : `place:${item.place_id}`;
    if (seenOsmIds.has(osmId)) return false;
    seenOsmIds.add(osmId);
    return true;
  });
}

function getSearchCenter(query: string, rawPlaces: NominatimResult[], parsedPlaces: PlaceDraft[]): SearchCenter {
  if (rawPlaces.length > 0) {
    const top = rawPlaces[0];
    return {
      mainLocationName: top.display_name.split(',')[0].trim() || query,
      centerLat: parseFloat(top.lat),
      centerLng: parseFloat(top.lon),
    };
  }

  if (parsedPlaces.length > 0) {
    return {
      mainLocationName: parsedPlaces[0].name,
      centerLat: parsedPlaces[0].lat,
      centerLng: parsedPlaces[0].lng,
    };
  }

  return {
    mainLocationName: query,
    centerLat: null,
    centerLng: null,
  };
}

function filterNominatimTourismResults(results: NominatimResult[]): NominatimResult[] {
  return results.filter((item) => {
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
}

function isBlockedRawPoi(poi: RawPoi): boolean {
  const amenity = (poi.amenity || '').toLowerCase();
  const shop = (poi.shop || '').toLowerCase();
  const pname = (poi.name || '').toLowerCase();

  if (amenity === 'fuel' || amenity.includes('fuel') || amenity === 'massage') return true;
  if (shop === 'convenience' || shop === 'supermarket' || shop === 'kiosk') return true;
  return pname.includes('massage') || pname.includes('xoa bóp') || pname.includes('cây xăng') || pname.includes('trạm xăng');
}

function isNamedOverpassElement(element: OverpassSearchElement): boolean {
  return Boolean(element.tags && (element.tags.name || element.tags.name_vi));
}

function mapOverpassElementToRawPoi(element: OverpassSearchElement): RawPoi | null {
  const tags = element.tags || {};
  const name = tags.name_vi || tags.name;
  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;

  if (!name || lat === undefined || lng === undefined) return null;

  return {
    id: String(element.id),
    name,
    type: tags.tourism || tags.historic || 'attraction',
    amenity: tags.amenity,
    shop: tags.shop,
    lat,
    lng,
  };
}

function sortRawPoisByLocationName(pois: RawPoi[], locationName: string): RawPoi[] {
  const normalizedLocation = locationName.toLowerCase();
  return [...pois].sort((a, b) => {
    const aHasLocation = a.name.toLowerCase().includes(normalizedLocation);
    const bHasLocation = b.name.toLowerCase().includes(normalizedLocation);
    if (aHasLocation && !bHasLocation) return -1;
    if (!aHasLocation && bHasLocation) return 1;
    return 0;
  });
}

function isSearchResultAllowed(item: PlaceDraft): boolean {
  const type = (item.type || '').toLowerCase();
  const iname = (item.name || '').toLowerCase();
  const badTypes = ['administrative', 'province', 'city', 'town', 'district', 'ward', 'place', 'suburb', 'hotel', 'guest_house', 'hostel', 'motel', 'resort'];
  if (badTypes.includes(type)) return false;
  if (iname.includes('massage') || iname.includes('xoa bóp') || iname.includes('cây xăng') || iname.includes('trạm xăng')) return false;
  return isValidTourismPOI(item.name || '', type);
}

function sortTourismResults(results: PlaceDraft[], query: string, normalized: string): PlaceDraft[] {
  const normalizedFallback = normalizeVietnameseSearch(query);
  return [...results].sort((a, b) => {
    const aName = a.address ? `${a.name} ${a.address}`.toLowerCase() : a.name.toLowerCase();
    const bName = b.address ? `${b.name} ${b.address}`.toLowerCase() : b.name.toLowerCase();
    const aExact = normalizeVietnameseSearch(aName).includes(normalizedFallback) || aName.includes(normalized);
    const bExact = normalizeVietnameseSearch(bName).includes(normalizedFallback) || bName.includes(normalized);
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    return 0;
  });
}

type SavedPlace = PlaceDraft & { _id: string; createdAt: Date; updatedAt: Date };

async function savePlaces(places: PlaceDraft[]): Promise<SavedPlace[]> {
  const db = await getDb();
  return Promise.all(places.map(async (item) => {
    const existing = await db.places.findOne({ osmId: item.osmId });
    if (existing) {
      const updated = await db.places.updateOne(existing._id, {
        name: item.name,
        address: item.address,
        type: item.type,
      });
      return (updated ?? existing) as SavedPlace;
    }

    try {
      const now = new Date();
      const inserted = await db.places.insertOne({
        ...item,
        ratingAvg: 0,
        ratingCount: 0,
        createdAt: now,
        updatedAt: now,
      } as unknown as Record<string, unknown>);
      return inserted as SavedPlace;
    } catch (error) {
      const duplicate = await db.places.findOne({ osmId: item.osmId });
      if (duplicate) return duplicate as SavedPlace;
      throw error;
    }
  }));
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const query = request.nextUrl.searchParams.get('q');

    const validation = placesSearchSchema.parse({ q: query });
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

    const curatedResults = searchTourismPlaces(q);
    if (curatedResults.length > 0) {
      const savedCuratedResults = await savePlaces(curatedResults.map((item) => ({
        osmId: item.osmId,
        name: item.name,
        type: item.type,
        lat: item.lat,
        lng: item.lng,
        address: item.address,
        openingHours: null,
        images: null,
        osmTags: {},
        tags: item.tags,
      })));
      const payload = savedCuratedResults.map((place) => ({
        _id: place._id,
        name: place.name,
        type: place.type,
        lat: place.lat,
        lng: place.lng,
        address: place.address,
        osmId: place.osmId,
      }));

      await cacheSet(cacheKey, JSON.stringify(payload), CACHE_TTL);
      await recordSearchHistory(userId, q, payload.length, payload[0]?.lat ?? null, payload[0]?.lng ?? null);

      return sendSuccess({
        results: payload,
        cached: false,
      });
    }

    const priorityResults = getPriorityLocalityResults(q);
    if (priorityResults.length > 0) {
      const savedPriorityResults = await savePlaces(priorityResults);
      const payload = savedPriorityResults.map((place) => ({
        _id: place._id,
        name: place.name,
        type: place.type,
        lat: place.lat,
        lng: place.lng,
        address: place.address,
        osmId: place.osmId,
      }));

      await cacheSet(cacheKey, JSON.stringify(payload), CACHE_TTL);
      await recordSearchHistory(userId, q, payload.length, payload[0]?.lat ?? null, payload[0]?.lng ?? null);

      return sendSuccess({
        results: payload,
        cached: false,
      });
    }

    const cached = await cacheGet(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as Place[];
        if (parsed.length > 0) {
          await recordSearchHistory(userId, q, parsed.length, parsed[0]?.lat ?? null, parsed[0]?.lng ?? null);
          return sendSuccess({
            results: parsed,
            cached: true
          });
        }
      } catch (error) {
        console.error('Lỗi phân tích cú pháp cache tìm kiếm địa điểm:', error);
        await cacheSet(cacheKey, JSON.stringify([]), 1);
      }
    }

    const uniqueRaw = await fetchNominatimCandidates(q);

    const parsedPlaces = filterNominatimTourismResults(uniqueRaw).map(r => mapNominatimToPlace(r));
    const center = getSearchCenter(q, uniqueRaw, parsedPlaces);
    const { centerLat, centerLng, mainLocationName } = center;

    const additionalPOIs: Omit<Place, '_id' | 'createdAt' | 'updatedAt' | 'ratingAvg' | 'ratingCount'>[] = [];

    if (centerLat && centerLng) {
      const poiCacheKey = `poi:live:${centerLat.toFixed(4)}:${centerLng.toFixed(4)}:60000:v3`;
      let rawPois: RawPoi[] = [];
      const cachedPois = await cacheGet(poiCacheKey);

      if (cachedPois) {
        try {
          rawPois = JSON.parse(cachedPois);
        } catch (error) {
          console.error('Lỗi phân tích cú pháp POI từ cache:', error);
          rawPois = [];
        }
      } else {
        const overpassQuery = `[out:json][timeout:20];(node["tourism"](around:50000,${centerLat},${centerLng});way["tourism"](around:50000,${centerLat},${centerLng});node["historic"](around:50000,${centerLat},${centerLng});way["historic"](around:50000,${centerLat},${centerLng});node["amenity"="place_of_worship"](around:50000,${centerLat},${centerLng}););out center 50;`;
        try {
          const res = await fetch(`${OVERPASS_URL}?data=${encodeURIComponent(overpassQuery)}`, {
            headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
            signal: AbortSignal.timeout(12000),
          });
          if (res.ok) {
            const data = await res.json() as OverpassSearchResponse;
            const elements = Array.isArray(data.elements) ? data.elements : [];
            rawPois = elements
              .filter(isNamedOverpassElement)
              .map(mapOverpassElementToRawPoi)
              .filter((poi): poi is RawPoi => poi !== null);
            await cacheSet(poiCacheKey, JSON.stringify(rawPois), 43200);
          }
        } catch (error) {
          console.error('Lỗi khi fetch địa điểm từ Overpass:', error);
        }
      }

      for (const poi of sortRawPoisByLocationName(rawPois, mainLocationName)) {
        if (isBlockedRawPoi(poi)) continue;
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
          additionalPOIs.push(p);
          if (additionalPOIs.length >= 12) break;
        }
      }
    }

    let tourismResults = additionalPOIs.length > 0 ? [...additionalPOIs] : [...parsedPlaces];

    tourismResults = tourismResults.filter(item => {
      if (!isSearchResultAllowed(item)) return false;
      const type = (item.type || '').toLowerCase();
      const iname = (item.name || '').toLowerCase();
      const badTypes = ['administrative', 'province', 'city', 'town', 'district', 'ward', 'place', 'suburb', 'hotel', 'guest_house', 'hostel', 'motel', 'resort'];
      if (badTypes.includes(type)) return false;
      if (iname.includes('massage') || iname.includes('xoa bóp') || iname.includes('cây xăng') || iname.includes('trạm xăng')) return false;
      if (!isValidTourismPOI(item.name || '', type)) return false;
      return true;
    });

    if (tourismResults.length === 0) {
      tourismResults = getLocalFallbackResults(q);
    }

    const slicedResults = sortTourismResults(tourismResults, q, normalized).slice(0, 12);

    const savedPayload = await savePlaces(slicedResults);

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


