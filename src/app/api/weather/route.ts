import { NextRequest } from 'next/server';
import { cacheGet, cacheSet } from '@/lib/redis';
import { getWeatherDescription } from '@/lib/weather';
import { weatherSchema } from '@/lib/validations/place';
import { sendSuccess, sendError, handleApiError, AppError } from '@/lib/api-response';

const WEATHER_CACHE_TTL = 900;

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
        const parsedCached = JSON.parse(cached);
        return sendSuccess({
          weather: parsedCached,
          cached: true,
        });
      } catch (error) {
        console.error('Lỗi phân tích cú pháp thời tiết từ cache:', error);
      }
    }

    const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&daily=weathercode,precipitation_sum&forecast_days=7&timezone=Asia%2FHo_Chi_Minh`;
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
      forecast: (data.daily?.time || []).map((date: string, i: number) => ({
        date,
        weathercode: data.daily.weathercode[i],
        precipitationMm: data.daily.precipitation_sum[i] || 0,
        isBadWeather: (data.daily.weathercode[i] >= 61) || ((data.daily.precipitation_sum[i] || 0) > 10),
      })),
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

