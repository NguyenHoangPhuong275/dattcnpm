import { NextRequest } from 'next/server';

import { AppError, handleApiError, sendSuccess } from '@/lib/api-response';
import { enforceRateLimit, requireAuthUser, resolveObjectIdParam } from '@/lib/api-handler';
import { createAuditLog, getDb, type FlightBooking } from '@/lib/db';
import { toFlightBookingResponse } from '@/lib/flight-bookings';

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, ctx: RouteCtx): Promise<Response> {
  try {
    const user = await requireAuthUser(request);
    const userId = String(user._id);

    await enforceRateLimit({
      key: `rl:pay-flight-booking:${userId}`,
      limit: 20,
      windowSeconds: 900,
      message: 'Bạn đang thao tác quá nhanh. Vui lòng thử lại sau.',
    });

    const id = await resolveObjectIdParam(ctx);
    const db = await getDb();
    const booking = (await db.flightBookings.findById(id)) as FlightBooking | null;

    if (!booking || String(booking.userId) !== userId) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy đơn đặt vé', 404);
    }
    if (booking.status === 'cancelled') {
      throw new AppError('BAD_REQUEST', 'Đơn đặt vé đã bị hủy, không thể thanh toán', 400);
    }
    if (booking.paymentStatus === 'paid') {
      throw new AppError('CONFLICT', 'Đơn đặt vé này đã được thanh toán', 409);
    }

    const paidAt = new Date();
    const updated = (await db.flightBookings.findOneAndUpdate({
      _id: id,
      userId,
      status: { $ne: 'cancelled' },
      paymentStatus: { $ne: 'paid' },
    }, {
      $set: {
        paymentStatus: 'paid',
        paidAt,
      },
    })) as FlightBooking | null;
    if (!updated) {
      throw new AppError('CONFLICT', 'Trạng thái đơn đặt vé vừa thay đổi. Vui lòng tải lại thông tin', 409);
    }

    await createAuditLog(userId, 'PAY_FLIGHT_BOOKING', 'FLIGHT_BOOKING', id, {
      amount: booking.totalPrice,
    }).catch(() => {});

    return sendSuccess(toFlightBookingResponse(updated), 'Đã ghi nhận thanh toán. Yêu cầu đang chờ xác nhận');
  } catch (error) {
    return handleApiError(error);
  }
}
