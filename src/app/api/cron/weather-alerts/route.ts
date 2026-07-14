import { NextRequest } from 'next/server';
import { getDb, getRedis, type ItineraryItem, type Place, type Trip } from '@/lib/db';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { evaluateWeatherAlert, fetchDailyForecast } from '@/lib/weather-alerts';
import { getResend } from '@/lib/resend';
import { timingSafeEqualString } from '@/lib/crypto';

async function sendWeatherAlertEmail(tripTitle: string, dateKey: string, reasons: string[], ownerEmail: string | null): Promise<void> {
  if (process.env.NODE_ENV === 'test' || !process.env.API_KEY_RESEND) return;
  try {
    if (!ownerEmail) return;
    const reasonsHtml = reasons.map((reason) => `<li>${reason}</li>`).join('');
    await getResend().emails.send({
      from: 'LOTUS TRAVEL <no-reply@cybersafe.tokyo>',
      to: [ownerEmail],
      subject: `Cảnh báo thời tiết cho chuyến đi "${tripTitle}"`,
      html: `<p>Xin chào,</p><p>Chuyến đi <strong>"${tripTitle}"</strong> (ngày ${dateKey}) có cảnh báo thời tiết:</p><ul>${reasonsHtml}</ul><p>Vui lòng kiểm tra dự báo và chuẩn bị phù hợp trước khi khởi hành.</p><p>— LOTUS TRAVEL</p>`,
    });
  } catch {}
}

const UPCOMING_WINDOW_MS = 24 * 60 * 60 * 1000;
const ALERT_DEDUP_TTL_SECONDS = 24 * 60 * 60;
const CONCURRENCY_LIMIT = 8;

async function runWithConcurrency<T>(items: T[], limit: number, worker: (item: T) => Promise<void>): Promise<void> {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      await worker(items[index]);
    }
  });
  await Promise.all(runners);
}

function getCronSecret(): string {
  const secret =
    process.env.CRON_SECRET ||
    (process.env.NODE_ENV !== 'production' ? process.env.WEBHOOK_SECRET : undefined);
  if (!secret) {
    throw new AppError('INTERNAL_ERROR', 'Hệ thống chưa được cấu hình đầy đủ', 500);
  }
  return secret;
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const provided = request.headers.get('x-cron-secret');
    const secret = getCronSecret();
    if (!provided || !timingSafeEqualString(provided, secret)) {
      throw new AppError('UNAUTHORIZED', 'Thông tin xác thực tác vụ định kỳ không hợp lệ', 401);
    }

    const db = await getDb();
    const redis = getRedis();
    const now = new Date();
    const until = new Date(now.getTime() + UPCOMING_WINDOW_MS);

    const trips = (await db.trips.find({
      startDate: { $gte: now, $lte: until },
      deletedAt: null,
    })) as Trip[];

    let scanned = 0;
    let alertsSent = 0;
    let skippedNoLocation = 0;
    let skippedUnavailable = 0;

    const ownerIds = [...new Set(trips.map((t) => String(t.userId)).filter(Boolean))];
    const owners = ownerIds.length ? await db.users.find({ _id: { $in: ownerIds }, deletedAt: null }) : [];
    const ownerMap = new Map(owners.map((o) => [String(o._id), o]));

    const tripIds = trips.map((t) => String(t._id));
    const allItems = tripIds.length
      ? ((await db.itineraryItems.find({ tripId: { $in: tripIds } })) as ItineraryItem[])
      : [];
    const itemsByTrip = new Map<string, ItineraryItem[]>();
    for (const item of allItems) {
      const key = String(item.tripId);
      const list = itemsByTrip.get(key);
      if (list) list.push(item);
      else itemsByTrip.set(key, [item]);
    }
    const allPlaceIds = [...new Set(allItems.map((i) => String(i.placeId)).filter(Boolean))];
    const allPlaces = allPlaceIds.length
      ? ((await db.places.find({ _id: { $in: allPlaceIds } })) as Place[])
      : [];
    const placeById = new Map(allPlaces.map((p) => [String(p._id), p]));

    const forecastCache = new Map<string, Promise<Awaited<ReturnType<typeof fetchDailyForecast>>>>();
    const getForecast = (lat: number, lng: number) => {
      const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
      let pending = forecastCache.get(key);
      if (!pending) {
        pending = fetchDailyForecast(lat, lng);
        forecastCache.set(key, pending);
      }
      return pending;
    };

    const processTrip = async (trip: Trip): Promise<void> => {
      scanned++;
      try {
        const tripId = String(trip._id);

        const items = itemsByTrip.get(tripId) ?? [];
        const located = items
          .map((i) => placeById.get(String(i.placeId)))
          .find((p): p is Place => !!p && typeof p.lat === 'number' && typeof p.lng === 'number');
        if (!located) {
          skippedNoLocation++;
          return;
        }

        const forecast = await getForecast(located.lat, located.lng);
        if (!forecast) {
          skippedUnavailable++;
          return;
        }

        const startDateKey = new Date(trip.startDate).toISOString().slice(0, 10);
        const day = forecast.find((d) => d.date === startDateKey);
        if (!day) return;

        const owner = ownerMap.get(String(trip.userId)) ?? null;
        const { alert, reasons } = evaluateWeatherAlert(day, owner?.weatherAlerts ?? null);
        if (!alert) return;

        const dedupKey = `weather_alert_sent:${tripId}:${startDateKey}`;
        const already = await redis.get(dedupKey).catch(() => null);
        if (already) return;

        await db.notifications.insertOne({
          userId: trip.userId,
          title: 'Cảnh báo thời tiết cho chuyến đi',
          content: `Chuyến đi "${trip.title}" (${startDateKey}): ${reasons.join('; ')}`,
          type: 'WEATHER_ALERT',
          isRead: false,
          metadata: { tripId, date: startDateKey, reasons },
          createdAt: now,
        });

        await sendWeatherAlertEmail(trip.title, startDateKey, reasons, owner?.email ?? null);

        await redis.set(dedupKey, '1', 'EX', ALERT_DEDUP_TTL_SECONDS).catch(() => null);
        alertsSent++;
      } catch {}
    };

    await runWithConcurrency(trips, CONCURRENCY_LIMIT, processTrip);

    return sendSuccess({ scanned, alertsSent, skippedNoLocation, skippedUnavailable });
  } catch (error) {
    return handleApiError(error);
  }
}
