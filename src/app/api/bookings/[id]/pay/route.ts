import { NextRequest } from 'next/server';

import { getDb, createAuditLog, type Hotel, type HotelBooking } from '@/lib/db';
import { enforceRateLimit, requireAuthUser, resolveObjectIdParam } from '@/lib/api-handler';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { toHotelBookingResponse } from '@/lib/hotel-bookings';

type RouteCtx = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, ctx: RouteCtx): Promise<Response> {
  try {
    const user = await requireAuthUser(request);
    const userId = String(user._id);

    await enforceRateLimit({
      key: `rl:pay-booking:${userId}`,
      limit: 20,
      windowSeconds: 900,
      message: 'Bạn đang thao tác quá nhanh. Vui lòng thử lại sau.',
    });

    const id = await resolveObjectIdParam(ctx);

    const db = await getDb();
    const booking = (await db.hotelBookings.findById(id)) as HotelBooking | null;
    if (!booking || String(booking.userId) !== userId) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy đặt phòng', 404);
    }
    if (booking.status === 'cancelled') {
      throw new AppError('BAD_REQUEST', 'Đặt phòng đã bị hủy, không thể thanh toán', 400);
    }
    if (booking.paymentStatus === 'paid') {
      throw new AppError('CONFLICT', 'Đặt phòng này đã được thanh toán', 409);
    }

    const updated = (await db.hotelBookings.findOneAndUpdate({
      _id: id,
      userId,
      status: { $ne: 'cancelled' },
      paymentStatus: { $ne: 'paid' },
    }, {
      $set: { paymentStatus: 'paid', paidAt: new Date() },
    })) as HotelBooking | null;
    if (!updated) {
      throw new AppError('CONFLICT', 'Trạng thái đặt phòng vừa thay đổi. Vui lòng tải lại thông tin', 409);
    }

    const hotel = (await db.hotels.findById(String(booking.hotelId))) as Hotel | null;

    await createAuditLog(userId, 'PAY_HOTEL_BOOKING', 'HOTEL_BOOKING', id, {
      hotelId: String(booking.hotelId),
      amount: booking.totalPrice,
    }).catch(() => {});

    return sendSuccess(toHotelBookingResponse(updated, hotel?.name ?? null), 'Đã ghi nhận thanh toán');
  } catch (error) {
    return handleApiError(error);
  }
}
