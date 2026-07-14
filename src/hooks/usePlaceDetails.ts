'use client';

import { useEffect, useState } from 'react';
import type { SearchResult } from '@/hooks/usePlaceSearch';
import { apiRequestStrictJson, isAbortError } from '@/lib/api-client';
import { normalizeText } from '@/lib/trip-utils';

export type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

export interface WeatherData {
  temperature: number;
  description: string;
  weathercode: number;
}

export interface PoiData {
  id: string;
  name: string;
  type: string;
  address: string;
  description?: string;
  rating?: string;
  image?: string;
  lat?: number;
  lng?: number;
}

export interface UsePlaceDetailsReturn {
  weather: WeatherData | null;
  pois: PoiData[];
  weatherStatus: FetchStatus;
  poisStatus: FetchStatus;
  weatherError: string | null;
  poisError: string | null;
  isWeatherLoading: boolean;
  isPoisLoading: boolean;
}

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
}

interface WeatherPayload {
  weather?: WeatherData;
}

interface PoiPayload {
  results?: PoiData[];
}

const LARGE_AREA_RADIUS = 50_000;
const DEFAULT_RADIUS = 10_000;
const LARGE_AREA_KEYWORDS = ['tinh', 'thanh pho', 'ha noi', 'ho chi minh', 'da nang', 'hai phong', 'can tho'];

function isLargeArea(place: SearchResult): boolean {
  const text = normalizeText(`${place.name} ${place.address || ''}`);
  return LARGE_AREA_KEYWORDS.some((keyword) => text.includes(keyword));
}

function getPlaceRegion(place: SearchResult): string {
  return place.address || place.name;
}

async function fetchWeather(lat: number, lng: number, signal: AbortSignal): Promise<WeatherData | null> {
  const { response, data: json } = await apiRequestStrictJson<ApiEnvelope<WeatherPayload> & WeatherPayload>(
    `/api/weather?lat=${lat}&lng=${lng}`,
    { signal }
  );
  const payload = json.data || json;

  if (!response.ok || json.success === false) return null;
  return payload.weather || null;
}

async function fetchPois(place: SearchResult, signal: AbortSignal): Promise<PoiData[]> {
  const params = new URLSearchParams({
    lat: String(place.lat),
    lng: String(place.lng),
    radius: String(isLargeArea(place) ? LARGE_AREA_RADIUS : DEFAULT_RADIUS),
    type: 'tourism',
    region: getPlaceRegion(place),
  });

  const { response, data: json } = await apiRequestStrictJson<ApiEnvelope<PoiPayload> & PoiPayload>(
    `/api/places/poi?${params.toString()}`,
    { signal }
  );
  const payload = json.data || json;

  if (!response.ok || json.success === false) return [];
  return Array.isArray(payload.results) ? payload.results : [];
}

export function usePlaceDetails(selectedPlace: SearchResult | null): UsePlaceDetailsReturn {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [pois, setPois] = useState<PoiData[]>([]);
  const [weatherStatus, setWeatherStatus] = useState<FetchStatus>('idle');
  const [poisStatus, setPoisStatus] = useState<FetchStatus>('idle');
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [poisError, setPoisError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedPlace) {
      setWeather(null);
      setPois([]);
      setWeatherStatus('idle');
      setPoisStatus('idle');
      setWeatherError(null);
      setPoisError(null);
      return;
    }

    const controller = new AbortController();

    setWeatherStatus('loading');
    setPoisStatus('loading');
    setWeatherError(null);
    setPoisError(null);

    fetchWeather(selectedPlace.lat, selectedPlace.lng, controller.signal)
      .then((nextWeather) => {
        if (controller.signal.aborted) return;
        setWeather(nextWeather);
        setWeatherStatus('success');
      })
      .catch((error: unknown) => {
        if (isAbortError(error) || controller.signal.aborted) return;
        setWeather(null);
        setWeatherError('Không thể tải thông tin thời tiết lúc này.');
        setWeatherStatus('error');
      });

    fetchPois(selectedPlace, controller.signal)
      .then((nextPois) => {
        if (controller.signal.aborted) return;
        setPois(nextPois);
        setPoisStatus('success');
      })
      .catch((error: unknown) => {
        if (isAbortError(error) || controller.signal.aborted) return;
        setPois([]);
        setPoisError('Không thể tải địa danh du lịch lúc này.');
        setPoisStatus('error');
      });

    return () => controller.abort();
  }, [selectedPlace]);

  return {
    weather,
    pois,
    weatherStatus,
    poisStatus,
    weatherError,
    poisError,
    isWeatherLoading: weatherStatus === 'loading',
    isPoisLoading: poisStatus === 'loading',
  };
}
