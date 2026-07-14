import { NextRequest } from 'next/server';
import { getDb, normalizePagination, type Hotel, type HotelBooking } from '@/lib/db';
import { getAuthUserFull } from '@/lib/auth';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { toHotelBookingResponse } from '@/lib/hotel-bookings';
import type { HotelBookingListPage } from '@/types/booking';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Phiên đăng nhập không hợp lệ hoặc tài khoản đã bị khóa', 401);
    }
    const userId = String(user._id);

    const searchParams = new URL(request.url).searchParams;
    const { page, limit } = normalizePagination({
      page: Number(searchParams.get('page') ?? Number.NaN),
      limit: Number(searchParams.get('limit') ?? Number.NaN),
    });

    const db = await getDb();
    const bookings = await db.hotelBookings.findPaginated(
      { userId },
      { page, limit, sortBy: 'createdAt', sortOrder: -1 },
    );

    const hotelIds = [...new Set(bookings.data.map((booking) => String(booking.hotelId)))];
    const hotels = hotelIds.length
      ? ((await db.hotels.find({ _id: { $in: hotelIds } }, { projection: { _id: 1, name: 1 } })) as Pick<Hotel, '_id' | 'name'>[])
      : [];
    const hotelNameById = new Map(hotels.map((hotel) => [String(hotel._id), hotel.name]));

    const payload: HotelBookingListPage = {
      items: (bookings.data as HotelBooking[]).map((booking) => {
        const response = toHotelBookingResponse(booking, hotelNameById.get(String(booking.hotelId)) ?? null);
        return {
          ...response,
          checkIn: response.checkIn.toISOString(),
          checkOut: response.checkOut.toISOString(),
          createdAt: response.createdAt?.toISOString() ?? null,
        };
      }),
      pagination: {
        page: bookings.page,
        limit,
        total: bookings.total,
        totalPages: bookings.totalPages,
      },
    };

    return sendSuccess(payload);
  } catch (error) {
    return handleApiError(error);
  }
}
