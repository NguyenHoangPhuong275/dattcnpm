import { NextRequest } from 'next/server';
import { getDb, type TripAccommodation, type TripBudget } from '@/lib/db';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { shareCodeSchema } from '@/lib/validations/trip';

interface RouteContext {
  params: Promise<{ code: string }>;
}

export async function GET(request: NextRequest, ctx: RouteContext): Promise<Response> {
  try {
    const ip = getClientIp(request);
    const rate = await checkRateLimit({
      key: `rl:view-trip-share:${ip}`,
      limit: 120,
      windowSeconds: 60,
    });
    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Bạn đang mở liên kết chia sẻ quá nhanh. Vui lòng thử lại sau.', 429);
    }

    const params = await ctx.params;
    const code = shareCodeSchema.parse(params.code);
    const db = await getDb();

    const share = await db.tripShares.findOne({ shareCode: code, isActive: true });

    if (!share) {
      throw new AppError('NOT_FOUND', 'Liên kết chia sẻ không tồn tại hoặc đã bị thu hồi', 404);
    }

    const now = new Date();
    if (share.expiresAt && new Date(share.expiresAt) < now) {
      throw new AppError('NOT_FOUND', 'Liên kết chia sẻ đã hết hạn', 404);
    }

    const trip = await db.trips.findById(share.tripId);
    if (!trip || trip.deletedAt) {
      throw new AppError('NOT_FOUND', 'Chuyến đi không tồn tại hoặc đã bị xóa', 404);
    }

    const [items, accommodations, budgets] = await Promise.all([
      db.itineraryItems.find({ tripId: share.tripId }),
      db.tripAccommodations.find({ tripId: share.tripId }) as Promise<TripAccommodation[]>,
      db.tripBudgets.find({ tripId: share.tripId }) as Promise<TripBudget[]>,
    ]);
    const placeIds = [...new Set(items.map((item) => String(item.placeId)).filter(Boolean))];
    const places = placeIds.length > 0
      ? await db.places.find(
          { _id: { $in: placeIds } },
          { projection: { name: 1, address: 1 } },
        )
      : [];
    const placesById = new Map(
      places.map((place) => [
        String(place._id),
        { name: place.name, address: place.address || null },
      ]),
    );

    const publicTrip = {
      _id: trip._id,
      title: trip.title,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      description: trip.description || null,
      coverImage: trip.coverImage || null,
      isPublic: !!trip.isPublic,
    };

    const publicItems = items.map((item) => ({
      _id: item._id,
      day: item.day,
      orderIndex: item.orderIndex ?? 0,
      note: item.note || '',
      placeId: String(item.placeId),
      place: placesById.get(String(item.placeId)) || null,
      startTime: item.startTime || null,
      endTime: item.endTime || null,
      cost: item.cost ?? null,
      currency: item.currency ?? null,
    }));

    // Chỉ đưa ra thông tin lưu trú công khai — không lộ mã đặt phòng/ghi chú riêng.
    const publicAccommodations = [...accommodations]
      .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())
      .map((item) => ({
        _id: item._id,
        hotelId: item.hotelId ? String(item.hotelId) : null,
        name: item.name,
        address: item.address || null,
        checkIn: item.checkIn,
        checkOut: item.checkOut,
      }));

    const budgetItems = [...budgets]
      .sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime())
      .map((item) => ({
        _id: item._id,
        category: item.category,
        amount: item.amount,
        currency: item.currency,
        note: item.note ?? null,
        type: item.type,
      }));
    const publicBudget = {
      items: budgetItems,
      totalPlanned: budgets.filter((i) => i.type === 'planned').reduce((sum, i) => sum + i.amount, 0),
      totalActual: budgets.filter((i) => i.type === 'actual').reduce((sum, i) => sum + i.amount, 0),
    };

    return sendSuccess({
      trip: publicTrip,
      items: publicItems,
      accommodations: publicAccommodations,
      budget: publicBudget,
      shareCode: code,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
