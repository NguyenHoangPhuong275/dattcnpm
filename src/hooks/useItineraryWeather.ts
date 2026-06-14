'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api-client';
import { getWeatherWarning } from '@/lib/weather';

interface WeatherWarningMap {
  [activityDate: string]: { description: string } | null;
}

interface ForecastDay {
  date: string;
  weathercode: number;
  precipitationMm: number;
}

export function useItineraryWeather(
  lat: number | null,
  lng: number | null,
  activityDates: string[]
): { warnings: WeatherWarningMap; isLoading: boolean } {
  const [warnings, setWarnings] = useState<WeatherWarningMap>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!lat || !lng || activityDates.length === 0) {
      setWarnings({});
      return;
    }

    const controller = new AbortController();
    const fetchWeather = async () => {
      setIsLoading(true);
      try {
        const res = await apiRequest<{ weather: { forecast?: ForecastDay[] } }>(
          `/api/weather?lat=${lat}&lng=${lng}`
        );
        const forecast = res.data?.weather?.forecast || [];
        const map: WeatherWarningMap = {};
        activityDates.forEach((date) => {
          map[date] = getWeatherWarning(date, forecast);
        });
        if (!controller.signal.aborted) {
          setWarnings(map);
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') console.error('Lỗi khi lấy thông tin thời tiết:', err);
        if (!controller.signal.aborted) {
          setWarnings({});
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchWeather();

    return () => controller.abort();
  }, [lat, lng, activityDates]);

  return { warnings, isLoading };
}
