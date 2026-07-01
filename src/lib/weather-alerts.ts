import { cacheGet, cacheSet, type WeatherAlertThresholds } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';
import { getWeatherDescription } from '@/lib/weather';
import { fetchJsonWithTimeout } from '@/lib/external/http';

type OpenMeteoDailyResponse = {
  daily?: {
    time?: string[];
    weathercode?: number[];
    precipitation_sum?: number[];
    precipitation_probability_max?: number[];
    temperature_2m_max?: (number | null)[];
    temperature_2m_min?: (number | null)[];
    windspeed_10m_max?: (number | null)[];
  };
};

export type DailyForecast = {
  date: string;
  weathercode: number;
  precipitationMm: number;
  precipitationProbability: number;
  tempMax: number | null;
  tempMin: number | null;
  windspeedKmh?: number | null;
};

const WEATHER_ALERT_THRESHOLDS = {
  rainProbability: 70,
  stormCodeMin: 95,
  extremeTempMax: 40,
  extremeTempMin: 5,
};

export function evaluateWeatherAlert(
  day: DailyForecast,
  thresholds?: WeatherAlertThresholds | null,
): { alert: boolean; reasons: string[] } {
  const maxRainProbability = thresholds?.maxRainProbability ?? WEATHER_ALERT_THRESHOLDS.rainProbability;
  const maxTemp = thresholds?.maxTemp ?? WEATHER_ALERT_THRESHOLDS.extremeTempMax;
  const minTemp = thresholds?.minTemp ?? WEATHER_ALERT_THRESHOLDS.extremeTempMin;
  const maxWindKmh = thresholds?.maxWindKmh ?? null;

  const reasons: string[] = [];
  if (day.precipitationProbability > maxRainProbability) {
    reasons.push(`Khả năng mưa cao (${day.precipitationProbability}%)`);
  }
  if (day.weathercode >= WEATHER_ALERT_THRESHOLDS.stormCodeMin) {
    reasons.push(`Cảnh báo ${getWeatherDescription(day.weathercode)}`);
  }
  if (day.tempMax !== null && day.tempMax >= maxTemp) {
    reasons.push(`Nắng nóng cực đoan (${day.tempMax}°C)`);
  }
  if (day.tempMin !== null && day.tempMin <= minTemp) {
    reasons.push(`Rét đậm (${day.tempMin}°C)`);
  }
  if (maxWindKmh !== null && day.windspeedKmh != null && day.windspeedKmh >= maxWindKmh) {
    reasons.push(`Gió mạnh (${Math.round(day.windspeedKmh)} km/h)`);
  }
  return { alert: reasons.length > 0, reasons };
}

const FORECAST_CACHE_TTL = 1800;

export async function fetchDailyForecast(lat: number, lng: number): Promise<DailyForecast[] | null> {
  const cacheKey = `weather:fc:${lat.toFixed(4)}:${lng.toFixed(4)}`;

  try {
    const cached = await cacheGet(cacheKey);
    if (cached) return JSON.parse(cached) as DailyForecast[];
  } catch {
  }

  const limiter = await checkRateLimit({
    key: `rl:weather-fetch:${lat.toFixed(4)}:${lng.toFixed(4)}`,
    limit: 1,
    windowSeconds: 600,
  }).catch(() => ({ limited: false }));
  if (limiter.limited) return null;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weathercode,precipitation_sum,precipitation_probability_max,temperature_2m_max,temperature_2m_min,windspeed_10m_max&forecast_days=7&timezone=Asia%2FHo_Chi_Minh`;
  const data = await fetchJsonWithTimeout<OpenMeteoDailyResponse>(url, { timeoutMs: 5000 });
  if (!data) return null;

  const daily = data.daily;
  const days: string[] = daily?.time ?? [];
  const forecast: DailyForecast[] = days.map((date, i) => ({
    date,
    weathercode: daily?.weathercode?.[i] ?? 0,
    precipitationMm: daily?.precipitation_sum?.[i] ?? 0,
    precipitationProbability: daily?.precipitation_probability_max?.[i] ?? 0,
    tempMax: daily?.temperature_2m_max?.[i] ?? null,
    tempMin: daily?.temperature_2m_min?.[i] ?? null,
    windspeedKmh: daily?.windspeed_10m_max?.[i] ?? null,
  }));

  try {
    await cacheSet(cacheKey, JSON.stringify(forecast), FORECAST_CACHE_TTL);
  } catch {
  }

  return forecast;
}
