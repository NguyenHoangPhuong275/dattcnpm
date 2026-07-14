import type {
  NominatimResult,
  OverpassSearchElement,
  PlaceDraft,
  RawPoi,
  SavedPlace,
  SearchCenter,
} from '@/lib/place-search/types';
import { normalizeVietnameseText } from '@/lib/string';

function getParentRegion(address?: Record<string, string>): string | null {
  if (!address) return null;
  let region = address.state || address.province || address.city || address.municipality;
  if (!region) return null;
  region = region.replace(/^(Tỉnh|Thành phố|Thị xã|Quận|Huyện)\s+/i, '');
  return region.trim();
}

function getParentRegionFromDisplayName(displayName: string): string | null {
  const parts = displayName.split(',').map((part) => part.trim());
  if (parts.length < 2) return null;
  let region = parts[parts.length - 2];
  if (!region || region.toLowerCase() === 'việt nam') return null;
  region = region.replace(/^(Tỉnh|Thành phố|Thị xã|Quận|Huyện)\s+/i, '');
  return region;
}

function getRegionName(result: NominatimResult): string {
  const region = getParentRegion(result.address) || getParentRegionFromDisplayName(result.display_name);
  return region || result.display_name.split(',')[0].trim();
}

export function isValidTourismPoi(name: string, tagType?: string): boolean {
  const normalizedName = (name || '').toLowerCase();
  const normalizedType = (tagType || '').toLowerCase();
  const blockedTourismTypes = ['hotel', 'guest_house', 'hostel', 'motel', 'resort', 'chalet', 'apartment', 'camp_site', 'caravan_site', 'wilderness_hut'];
  if (blockedTourismTypes.includes(normalizedType)) return false;

  const blacklist = [
    'cây xăng', 'trạm xăng', 'petrolimex', 'gas station', 'xăng dầu', 'dầu khí', 'xăng',
    'pharmacy', 'dược phẩm', 'euvipharm', 'atm', 'ngân hàng', 'bank',
    'hố bom', 'bomb crater', 'crater', 'hố bom bi',
    'trụ sở', 'office', 'company', 'công ty',
    'tòa án', 'courthouse', 'bệnh viện', 'hospital', 'trường học', 'school',
    'chợ', 'market', 'siêu thị', 'supermarket', 'nhà thuốc', 'clinic', 'phòng khám',
    'ủy ban', 'ubnd', 'post office', 'bưu điện', 'police', 'công an',
    'khách sạn', 'resort', 'motel', 'hostel', 'homestay', 'nhà nghỉ', 'căn hộ du lịch',
    'massage', 'xoa bóp', 'spa', 'massage parlor', 'nhà massage',
  ];
  return !blacklist.some((word) => normalizedName.includes(word));
}

export function mapNominatimToPlace(result: NominatimResult): PlaceDraft {
  const lat = parseFloat(result.lat);
  const lng = parseFloat(result.lon);
  const regionName = getRegionName(result);
  const rawName = result.display_name.split(',')[0].trim();

  let type = result.type || result.class || 'location';
  if (result.class === 'amenity') type = 'amenity';
  if (result.class === 'tourism') type = 'tourism';
  if (result.class === 'place') type = 'place';
  if (result.class === 'historic') type = 'historic';

  if (
    ['administrative', 'boundary'].includes(result.class || '') ||
    ['administrative', 'province', 'city', 'town', 'village', 'district'].includes(type)
  ) {
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

export function buildNominatimParams(query: string): URLSearchParams {
  return new URLSearchParams({
    q: query,
    format: 'json',
    limit: '10',
    countrycodes: 'vn',
    addressdetails: '1',
    'accept-language': 'vi',
  });
}

export function mergeNominatimCandidates(primary: NominatimResult[], normalized: NominatimResult[]): NominatimResult[] {
  const seenOsmIds = new Set<string>();
  return [...primary, ...normalized].filter((item) => {
    const osmId = item.osm_id ? `${item.osm_type || 'node'}:${item.osm_id}` : `place:${item.place_id}`;
    if (seenOsmIds.has(osmId)) return false;
    seenOsmIds.add(osmId);
    return true;
  });
}

export function getSearchCenter(query: string, rawPlaces: NominatimResult[], parsedPlaces: PlaceDraft[]): SearchCenter {
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

export function filterNominatimTourismResults(results: NominatimResult[]): NominatimResult[] {
  return results.filter((item) => {
    const className = item.class || '';
    const type = item.type || '';
    const rawName = item.display_name.split(',')[0].trim();
    if (!isValidTourismPoi(rawName, type)) return false;
    if (className === 'tourism' || className === 'historic') return true;
    if (className === 'amenity' && type === 'place_of_worship') return true;
    return className === 'leisure' && ['park', 'nature_reserve', 'garden', 'beach_resort'].includes(type);
  });
}

export function isBlockedRawPoi(poi: RawPoi): boolean {
  const amenity = (poi.amenity || '').toLowerCase();
  const shop = (poi.shop || '').toLowerCase();
  const name = (poi.name || '').toLowerCase();
  if (amenity === 'fuel' || amenity.includes('fuel') || amenity === 'massage') return true;
  if (shop === 'convenience' || shop === 'supermarket' || shop === 'kiosk') return true;
  return name.includes('massage') || name.includes('xoa bóp') || name.includes('cây xăng') || name.includes('trạm xăng');
}

export function isNamedOverpassElement(element: OverpassSearchElement): boolean {
  return Boolean(element.tags && (element.tags.name || element.tags.name_vi));
}

export function mapOverpassElementToRawPoi(element: OverpassSearchElement): RawPoi | null {
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

export function sortRawPoisByLocationName(pois: RawPoi[], locationName: string): RawPoi[] {
  const normalizedLocation = locationName.toLowerCase();
  return [...pois].sort((a, b) => {
    const aHasLocation = a.name.toLowerCase().includes(normalizedLocation);
    const bHasLocation = b.name.toLowerCase().includes(normalizedLocation);
    if (aHasLocation && !bHasLocation) return -1;
    if (!aHasLocation && bHasLocation) return 1;
    return 0;
  });
}

export function isSearchResultAllowed(item: PlaceDraft): boolean {
  const type = (item.type || '').toLowerCase();
  const name = (item.name || '').toLowerCase();
  const blockedTypes = ['administrative', 'province', 'city', 'town', 'district', 'ward', 'place', 'suburb', 'hotel', 'guest_house', 'hostel', 'motel', 'resort'];
  if (blockedTypes.includes(type)) return false;
  if (name.includes('massage') || name.includes('xoa bóp') || name.includes('cây xăng') || name.includes('trạm xăng')) return false;
  return isValidTourismPoi(item.name || '', type);
}

export function sortTourismResults(results: PlaceDraft[], query: string, normalized: string): PlaceDraft[] {
  const normalizedFallback = normalizeVietnameseText(query);
  return [...results].sort((a, b) => {
    const aName = a.address ? `${a.name} ${a.address}`.toLowerCase() : a.name.toLowerCase();
    const bName = b.address ? `${b.name} ${b.address}`.toLowerCase() : b.name.toLowerCase();
    const aExact = normalizeVietnameseText(aName).includes(normalizedFallback) || aName.includes(normalized);
    const bExact = normalizeVietnameseText(bName).includes(normalizedFallback) || bName.includes(normalized);
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    return 0;
  });
}

export function toResultPayload(place: SavedPlace) {
  return {
    _id: place._id,
    name: place.name,
    type: place.type,
    lat: place.lat,
    lng: place.lng,
    address: place.address,
    osmId: place.osmId,
  };
}
