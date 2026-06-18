import { NextRequest } from 'next/server';
import { getDb, type ItineraryItem, type Place } from '@/lib/db';
import { getAuthUserFull } from '@/lib/auth';
import { getTripForView } from '@/lib/trip-permission';
import { objectIdSchema } from '@/lib/validations/common';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { evaluateWeatherAlert, fetchDailyForecast } from '@/lib/weather-alerts';

type RouteCtx = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, ctx: RouteCtx): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials or user is locked', 401);
    }
    const userId = String(user._id);

    const { id } = await ctx.params;
    objectIdSchema.parse(id);

    const trip = await getTripForView(id, userId);

    const db = await getDb();
    const items = (await db.itineraryItems.find({ tripId: id })) as ItineraryItem[];
    const placeIds = [...new Set(items.map((i) => String(i.placeId)).filter(Boolean))];
    const places = placeIds.length ? ((await db.places.find({ _id: { $in: placeIds } })) as Place[]) : [];
    const located = places.find((p) => typeof p.lat === 'number' && typeof p.lng === 'number');

    if (!located) {
      return sendSuccess({ warning: 'Lịch trình chưa có địa điểm có toạ độ để dự báo thời tiết.', forecast: [] });
    }

    const forecast = await fetchDailyForecast(located.lat, located.lng);
    if (!forecast) {
      return sendSuccess({ warning: 'weather unavailable', forecast: [] });
    }

    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const days = forecast
      .filter((d) => {
        const t = new Date(d.date).getTime();
        return t >= new Date(start.toISOString().slice(0, 10)).getTime() && t <= new Date(end.toISOString().slice(0, 10)).getTime();
      })
      .map((d) => ({ ...d, ...evaluateWeatherAlert(d) }));

    return sendSuccess({
      location: { lat: located.lat, lng: located.lng, name: located.name },
      forecast: days.length > 0 ? days : forecast.map((d) => ({ ...d, ...evaluateWeatherAlert(d) })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
