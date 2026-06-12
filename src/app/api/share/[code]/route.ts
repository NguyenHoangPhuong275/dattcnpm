import { NextRequest } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';

interface RouteContext {
  params: Promise<{ code: string }>;
}

export async function GET(request: NextRequest, ctx: RouteContext) {
  try {
    const { code } = await ctx.params;
    const db = await getDb();

    const shares = await db.tripShares.find({ shareCode: code, isActive: true });
    const share = shares[0];

    if (!share) {
      throw new AppError('NOT_FOUND', 'Liên kết chia sẻ không tồn tại hoặc đã bị thu hồi', 404);
    }

    const now = new Date();
    if (share.expiresAt && new Date(share.expiresAt) < now) {
      throw new AppError('NOT_FOUND', 'Liên kết chia sẻ đã hết hạn', 404);
    }

    const trip = await db.trips.findById(share.tripId);
    if (!trip) {
      throw new AppError('NOT_FOUND', 'Chuyến đi không tồn tại', 404);
    }

    const items = await db.itineraryItems.find({ tripId: share.tripId });

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
      orderIndex: item.orderIndex || 0,
      note: item.note || '',
      placeId: item.placeId,
      startTime: item.startTime || null,
      endTime: item.endTime || null,
      cost: item.cost || null,
      currency: item.currency || null,
    }));

    return sendSuccess({
      trip: publicTrip,
      items: publicItems,
      shareCode: code,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
