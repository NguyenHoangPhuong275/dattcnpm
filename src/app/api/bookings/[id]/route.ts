import { NextRequest } from 'next/server';
import { getDb, type Hotel, type HotelBooking } from '@/lib/db';
import { getAuthUserFull } from '@/lib/auth';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { toHotelBookingResponse } from '@/lib/hotel-bookings';
import { objectIdSchema } from '@/lib/validations/common';

type RouteCtx = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, ctx: RouteCtx): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Phiên đăng nhập không hợp lệ hoặc tài khoản đã bị khóa', 401);
    }
    const userId = String(user._id);

    const { id } = await ctx.params;
    objectIdSchema.parse(id);

    const db = await getDb();
    const booking = (await db.hotelBookings.findById(id)) as HotelBooking | null;
    if (!booking) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy thông tin đặt phòng', 404);
    }

    if (String(booking.userId) !== userId) {
      throw new AppError('FORBIDDEN', 'Bạn không có quyền truy cập thông tin đặt phòng này', 403);
    }

    const hotel = (await db.hotels.findById(String(booking.hotelId))) as Hotel | null;
    const response = toHotelBookingResponse(booking, hotel?.name ?? null);
    
    return sendSuccess({
      ...response,
      checkIn: response.checkIn.toISOString(),
      checkOut: response.checkOut.toISOString(),
      createdAt: response.createdAt?.toISOString() ?? null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
