import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cacheGet, cacheSet } from '@/lib/redis';

const WeatherQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

const WEATHER_CACHE_TTL = 900;

function getWeatherDescription(code: number): string {
  if (code === 0) return 'Trời quang';
  if (code >= 1 && code <= 3) return 'Nhiều mây';
  if (code === 45 || code === 48) return 'Có sương mù';
  if (code >= 51 && code <= 55) return 'Mưa phùn';
  if (code >= 61 && code <= 65) return 'Có mưa';
  if (code >= 80 && code <= 82) return 'Mưa rào';
  if (code >= 95 && code <= 99) return 'Có dông bão';
  return 'Thời tiết ôn hòa';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = WeatherQuerySchema.safeParse({
      lat: searchParams.get('lat'),
      lng: searchParams.get('lng'),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { lat, lng } = parsed.data;
    const cacheKey = `weather:${lat.toFixed(4)}:${lng.toFixed(4)}`;

    const cached = await cacheGet(cacheKey);
    if (cached) {
      try {
        const parsedCached = JSON.parse(cached);
        return NextResponse.json({
          success: true,
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
      console.error('[Weather API] Open-Meteo error:', response.status);
      return NextResponse.json(
        { error: 'Không thể lấy dữ liệu thời tiết tại địa điểm này.' },
        { status: 502 }
      );
    }

    const data = await response.json();
    const current = data.current_weather;

    if (!current) {
      return NextResponse.json(
        { error: 'Không tìm thấy dữ liệu thời tiết hiện tại.' },
        { status: 404 }
      );
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

    return NextResponse.json({
      success: true,
      weather: weatherResult,
      cached: false,
    });
  } catch (error: any) {
    console.error('[Weather API] Error:', error);

    if (error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'Yêu cầu lấy thông tin thời tiết quá hạn.' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: 'Lỗi hệ thống khi tải thông tin thời tiết.' },
      { status: 500 }
    );
  }
}
