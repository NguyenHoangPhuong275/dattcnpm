'use client';

import { useEffect, useState } from 'react';
import { WeatherIcon } from '@/components/icons';
import { apiRequestStrictJson, isAbortError } from '@/lib/api-client';

interface HeaderWeatherData {
  temperature: number;
  weathercode: number;
  description: string;
}

interface WeatherEnvelope {
  success?: boolean;
  data?: { weather?: HeaderWeatherData | null };
}

const CITY_NAME = 'Hồ Chí Minh';
const CITY_LAT = 10.7769;
const CITY_LNG = 106.7009;
const CLIENT_CACHE_TTL_MS = 10 * 60 * 1000;

let cachedWeather: HeaderWeatherData | null = null;
let cachedAt = 0;

export default function HeaderWeather(): React.JSX.Element | null {
  const [weather, setWeather] = useState<HeaderWeatherData | null>(
    Date.now() - cachedAt < CLIENT_CACHE_TTL_MS ? cachedWeather : null,
  );

  useEffect(() => {
    if (Date.now() - cachedAt < CLIENT_CACHE_TTL_MS) return;

    const controller = new AbortController();
    apiRequestStrictJson<WeatherEnvelope>(
      `/api/weather?lat=${CITY_LAT}&lng=${CITY_LNG}`,
      { signal: controller.signal },
    )
      .then(({ response, data }) => {
        if (controller.signal.aborted) return;
        const next = response.ok && data.success ? data.data?.weather ?? null : null;
        cachedWeather = next;
        cachedAt = Date.now();
        setWeather(next);
      })
      .catch((error: unknown) => {
        if (isAbortError(error) || controller.signal.aborted) return;
        cachedAt = Date.now();
        setWeather(null);
      });

    return () => controller.abort();
  }, []);

  if (!weather || typeof weather.temperature !== 'number') return null;

  return (
    <div
      className="hidden shrink-0 items-center gap-2 md:flex"
      title={`${weather.description} · ${CITY_NAME}`}
      aria-label={`Thời tiết ${CITY_NAME}: ${Math.round(weather.temperature)} độ C, ${weather.description}`}
    >
      <WeatherIcon code={weather.weathercode} className="h-7 w-7 text-[var(--color-primary-dark)]" />
      <div className="leading-tight">
        <div className="text-sm font-bold text-[var(--color-text)]">{Math.round(weather.temperature)}°C</div>
        <div className="text-xs text-[var(--color-text-muted)]">{CITY_NAME}</div>
      </div>
    </div>
  );
}
