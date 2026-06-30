import { NextRequest } from 'next/server';
import { cacheGet, cacheSet } from '@/lib/db';
import { getWeatherDescription } from '@/lib/weather';
import { weatherSchema } from '@/lib/validations/place';
import { sendSuccess, handleApiError } from '@/lib/api-response';
import { fetchJsonWithTimeout } from '@/lib/external/http';

const WEATHER_CACHE_TTL = 1800;
const WEATHER_FETCH_TIMEOUT_MS = 5000;

type OpenMeteoResponse = {
  current_weather?: {
    temperature: number;
    windspeed: number;
    winddirection: number;
    weathercode: number;
    time: string;
  };
  daily?: {
    time?: string[];
    weathercode?: number[];
    precipitation_sum?: number[];
  };
};

function weatherUnavailable(): Response {
  return sendSuccess({ weather: null, cached: false, available: false });
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = weatherSchema.parse({
      lat: searchParams.get('lat'),
      lng: searchParams.get('lng'),
    });

    const { lat, lng } = parsed;
    const cacheKey = `weather:${lat.toFixed(4)}:${lng.toFixed(4)}`;

    const cached = await cacheGet(cacheKey);
    if (cached) {
      try {
        return sendSuccess({ weather: JSON.parse(cached), cached: true, available: true });
      } catch {
      }
    }

    const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&daily=weathercode,precipitation_sum&forecast_days=7&timezone=Asia%2FHo_Chi_Minh`;

    const data = await fetchJsonWithTimeout<OpenMeteoResponse>(openMeteoUrl, {
      timeoutMs: WEATHER_FETCH_TIMEOUT_MS,
    });
    if (!data) return weatherUnavailable();

    const current = data.current_weather;
    if (!current) {
      return weatherUnavailable();
    }

    const dailyTimes = data.daily?.time ?? [];
    const dailyCodes = data.daily?.weathercode ?? [];
    const dailyPrecip = data.daily?.precipitation_sum ?? [];
    const weatherResult = {
      temperature: current.temperature,
      windspeed: current.windspeed,
      winddirection: current.winddirection,
      weathercode: current.weathercode,
      description: getWeatherDescription(current.weathercode),
      time: current.time,
      forecast: dailyTimes.map((date, i) => ({
        date,
        weathercode: dailyCodes[i],
        precipitationMm: dailyPrecip[i] || 0,
        isBadWeather: (dailyCodes[i] >= 61) || ((dailyPrecip[i] || 0) > 10),
      })),
    };

    await cacheSet(cacheKey, JSON.stringify(weatherResult), WEATHER_CACHE_TTL);

    return sendSuccess({ weather: weatherResult, cached: false, available: true });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

