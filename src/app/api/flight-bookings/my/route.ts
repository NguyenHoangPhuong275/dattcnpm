import { NextRequest } from 'next/server';

import { AppError, handleApiError, sendSuccess } from '@/lib/api-response';
import { getAuthUserFull } from '@/lib/auth';
import { getDb, normalizePagination, type FlightBooking } from '@/lib/db';
import { toFlightBookingResponse } from '@/lib/flight-bookings';
import type { FlightBookingListPage } from '@/types/booking';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Phiên đăng nhập không hợp lệ hoặc tài khoản đã bị khóa', 401);
    }

    const searchParams = new URL(request.url).searchParams;
    const { page, limit } = normalizePagination({
      page: Number(searchParams.get('page') ?? Number.NaN),
      limit: Number(searchParams.get('limit') ?? Number.NaN),
    });

    const db = await getDb();
    const bookings = await db.flightBookings.findPaginated(
      { userId: String(user._id) },
      { page, limit, sortBy: 'createdAt', sortOrder: -1 },
    );

    const payload: FlightBookingListPage = {
      items: (bookings.data as FlightBooking[]).map((booking) => {
        const response = toFlightBookingResponse(booking);
        return {
          ...response,
          outbound: {
            ...response.outbound,
            flightDate: response.outbound.flightDate.toISOString(),
          },
          returnFlight: response.returnFlight
            ? {
                ...response.returnFlight,
                flightDate: response.returnFlight.flightDate.toISOString(),
              }
            : null,
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
