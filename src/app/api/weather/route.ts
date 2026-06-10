import { NextRequest } from 'next/server';
import { cacheGet, cacheSet } from '@/lib/redis';
import { getWeatherDescription } from '@/lib/weather';
import { WeatherSchema } from '@/lib/validations/validation';
import { sendSuccess, sendError, handleApiError, AppError } from '@/lib/api-response';

const WEATHER_CACHE_TTL = 900;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = WeatherSchema.parse({
      lat: searchParams.get('lat'),
      lng: searchParams.get('lng'),
    });

    const { lat, lng } = parsed;
    const cacheKey = `weather:${lat.toFixed(4)}:${lng.toFixed(4)}`;

    const cached = await cacheGet(cacheKey);
    if (cached) {
      try {
        const parsedCached = JSON.parse(cached);
        return sendSuccess({
          weather: parsedCached,
          cached: true,
        });
      } catch {
      }
    }

    const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`;
    const response = await fetch(openMeteoUrl, {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new AppError('SERVICE_UNAVAILABLE', 'Không thể lấy dữ liệu thời tiết tại địa điểm này.', 502);
    }

    const data = await response.json();
    const current = data.current_weather;

    if (!current) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy dữ liệu thời tiết hiện tại.', 404);
    }

    const weatherResult = {
      temperature: current.temperature,
      windspeed: current.windspeed,
      winddirection: current.winddirection,
      weathercode: current.weathercode,
      description: getWeatherDescription(current.weathercode),
      time: current.time,
    };

    await cacheSet(cacheKey, JSON.stringify(weatherResult), WEATHER_CACHE_TTL);

    return sendSuccess({
      weather: weatherResult,
      cached: false,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return sendError('SERVICE_UNAVAILABLE', 'Yêu cầu lấy thông tin thời tiết quá hạn.', [], 504);
    }
    return handleApiError(error);
  }
}

