import { NextRequest } from 'next/server';
import { getDb, getRedis, getUserById, type ItineraryItem, type Place, type Trip } from '@/lib/db';
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
  } catch (error) {
    console.error('Lỗi khi gửi email cảnh báo thời tiết:', error instanceof Error ? error.message : 'unknown');
  }
}

const UPCOMING_WINDOW_MS = 24 * 60 * 60 * 1000;
const ALERT_DEDUP_TTL_SECONDS = 24 * 60 * 60;

function getCronSecret(): string {
  const secret =
    process.env.CRON_SECRET ||
    (process.env.NODE_ENV !== 'production' ? process.env.WEBHOOK_SECRET : undefined);
  if (!secret) {
    throw new AppError('INTERNAL_ERROR', 'CRON_SECRET is not configured', 500);
  }
  return secret;
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const provided = request.headers.get('x-cron-secret');
    const secret = getCronSecret();
    if (!provided || !timingSafeEqualString(provided, secret)) {
      throw new AppError('UNAUTHORIZED', 'Unauthorized cron access', 401);
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

    for (const trip of trips) {
      scanned++;
      const tripId = String(trip._id);

      const items = (await db.itineraryItems.find({ tripId })) as ItineraryItem[];
      const placeIds = [...new Set(items.map((i) => String(i.placeId)).filter(Boolean))];
      const places = placeIds.length ? ((await db.places.find({ _id: { $in: placeIds } })) as Place[]) : [];
      const located = places.find((p) => typeof p.lat === 'number' && typeof p.lng === 'number');
      if (!located) {
        skippedNoLocation++;
        continue;
      }

      const forecast = await fetchDailyForecast(located.lat, located.lng);
      if (!forecast) {
        skippedUnavailable++;
        continue;
      }

      const startDateKey = new Date(trip.startDate).toISOString().slice(0, 10);
      const day = forecast.find((d) => d.date === startDateKey);
      if (!day) continue;

      const owner = await getUserById(String(trip.userId));
      const { alert, reasons } = evaluateWeatherAlert(day, owner?.weatherAlerts ?? null);
      if (!alert) continue;

      const dedupKey = `weather_alert_sent:${tripId}:${startDateKey}`;
      const already = await redis.get(dedupKey).catch(() => null);
      if (already) continue;

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
    }

    return sendSuccess({ scanned, alertsSent, skippedNoLocation, skippedUnavailable });
  } catch (error) {
    return handleApiError(error);
  }
}
