import { NextRequest } from 'next/server';

import { sendSuccess, sendError, handleApiError, AppError } from '@/lib/api-response';
import { getAuthUserId } from '@/lib/auth';
import { getDb, cacheGet, cacheSet } from '@/lib/db';
import { fetchJsonWithTimeout } from '@/lib/external/http';
import {
  buildPlaceSearchCacheKey,
  getLocalFallbackResults,
  getPriorityLocalityResults,
  normalizePlaceSearchQuery,
  normalizeVietnameseSearch,
  parseCachedSearchPayload,
} from '@/lib/place-search/query';
import {
  buildNominatimParams,
  filterNominatimTourismResults,
  getSearchCenter,
  isBlockedRawPoi,
  isNamedOverpassElement,
  isSearchResultAllowed,
  isValidTourismPoi,
  mapNominatimToPlace,
  mapOverpassElementToRawPoi,
  mergeNominatimCandidates,
  sortRawPoisByLocationName,
  sortTourismResults,
  toResultPayload,
} from '@/lib/place-search/transformers';
import type {
  NominatimResult,
  OverpassSearchResponse,
  PlaceDraft,
  RawPoi,
  SavedPlace,
} from '@/lib/place-search/types';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { pruneSearchHistory } from '@/lib/search-history';
import { placesSearchSchema } from '@/lib/validations/place';
import { searchTourismPlaces } from '@/lib/vietnam-tourism';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const USER_AGENT = 'LotusTravel/1.0 (contact@lotus-travel.example.com)';
const CACHE_TTL = 86400;

async function recordSearchHistory(
  userId: string | null,
  query: string,
  resultCount: number,
  lat?: number | null,
  lng?: number | null,
): Promise<void> {
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
    await pruneSearchHistory(db, userId);
  } catch {
    return;
  }
}

async function fetchNominatim(query: string): Promise<NominatimResult[]> {
  const params = buildNominatimParams(query);
  const data = await fetchJsonWithTimeout<NominatimResult[]>(`${NOMINATIM_URL}?${params.toString()}`, {
    timeoutMs: 8000,
    headers: { 'User-Agent': USER_AGENT },
  });
  return Array.isArray(data) ? data : [];
}

async function fetchNominatimCandidates(query: string): Promise<NominatimResult[]> {
  const [primary, normalized] = await Promise.all([
    fetchNominatim(query).catch(() => []),
    fetchNominatim(normalizeVietnameseSearch(query)).catch(() => []),
  ]);
  return mergeNominatimCandidates(primary, normalized);
}

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
    const normalized = normalizePlaceSearchQuery(q);
    const cacheKey = buildPlaceSearchCacheKey(q);

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
      const payload = savedCuratedResults.map(toResultPayload);

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
      const payload = savedPriorityResults.map(toResultPayload);

      await cacheSet(cacheKey, JSON.stringify(payload), CACHE_TTL);
      await recordSearchHistory(userId, q, payload.length, payload[0]?.lat ?? null, payload[0]?.lng ?? null);

      return sendSuccess({
        results: payload,
        cached: false,
      });
    }

    const cached = await cacheGet(cacheKey);
    if (cached) {
      const cachedPayload = parseCachedSearchPayload(cached);
      if (cachedPayload.status === 'hit') {
        const { results } = cachedPayload;
        await recordSearchHistory(userId, q, results.length, results[0]?.lat ?? null, results[0]?.lng ?? null);
        return sendSuccess({
          results,
          cached: true,
        });
      }
      if (cachedPayload.status === 'malformed') {
        await cacheSet(cacheKey, JSON.stringify([]), 1);
      }
    }

    const uniqueRaw = await fetchNominatimCandidates(q);
    const parsedPlaces = filterNominatimTourismResults(uniqueRaw).map(mapNominatimToPlace);
    const center = getSearchCenter(q, uniqueRaw, parsedPlaces);
    const { centerLat, centerLng, mainLocationName } = center;
    const additionalPois: PlaceDraft[] = [];

    if (centerLat && centerLng) {
      const poiCacheKey = `poi:live:${centerLat.toFixed(4)}:${centerLng.toFixed(4)}:60000:v3`;
      let rawPois: RawPoi[] = [];
      const cachedPois = await cacheGet(poiCacheKey);

      if (cachedPois) {
        try {
          rawPois = JSON.parse(cachedPois);
        } catch {
          rawPois = [];
        }
      } else {
        const overpassQuery = `[out:json][timeout:20];(node["tourism"](around:50000,${centerLat},${centerLng});way["tourism"](around:50000,${centerLat},${centerLng});node["historic"](around:50000,${centerLat},${centerLng});way["historic"](around:50000,${centerLat},${centerLng});node["amenity"="place_of_worship"](around:50000,${centerLat},${centerLng}););out center 50;`;
        const data = await fetchJsonWithTimeout<OverpassSearchResponse>(
          `${OVERPASS_URL}?data=${encodeURIComponent(overpassQuery)}`,
          { timeoutMs: 12000, headers: { 'User-Agent': USER_AGENT } },
        );
        if (data) {
          const elements = Array.isArray(data.elements) ? data.elements : [];
          rawPois = elements
            .filter(isNamedOverpassElement)
            .map(mapOverpassElementToRawPoi)
            .filter((poi): poi is RawPoi => poi !== null);
          await cacheSet(poiCacheKey, JSON.stringify(rawPois), 43200);
        }
      }

      for (const poi of sortRawPoisByLocationName(rawPois, mainLocationName)) {
        if (isBlockedRawPoi(poi)) continue;
        if (!isValidTourismPoi(poi.name, poi.type)) continue;
        if (additionalPois.length >= 30) break;

        additionalPois.push({
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

      if (additionalPois.length === 0 && parsedPlaces.length > 0) {
        for (const place of parsedPlaces.slice(0, 12)) {
          if (!isValidTourismPoi(place.name || '', place.type)) continue;
          additionalPois.push(place);
          if (additionalPois.length >= 12) break;
        }
      }
    }

    let tourismResults = additionalPois.length > 0 ? [...additionalPois] : [...parsedPlaces];
    tourismResults = tourismResults.filter(isSearchResultAllowed);

    if (tourismResults.length === 0) {
      tourismResults = getLocalFallbackResults(q);
    }

    const slicedResults = sortTourismResults(tourismResults, q, normalized).slice(0, 12);
    const savedPayload = await savePlaces(slicedResults);
    const cachePayload = savedPayload.map(toResultPayload);

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
