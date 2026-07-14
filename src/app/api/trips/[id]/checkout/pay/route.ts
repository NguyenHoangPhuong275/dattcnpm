import { NextRequest } from 'next/server';

import { enforceRateLimit, parseJsonBody, requireAuthUser, resolveObjectIdParam } from '@/lib/api-handler';
import { AppError, handleApiError, sendSuccess } from '@/lib/api-response';
import { createAuditLog, getDb, type FlightBooking, type HotelBooking } from '@/lib/db';
import { getTripForMemberView } from '@/lib/trip-permission';
import { payTripCheckoutSchema } from '@/lib/validations/checkout';

type RouteCtx = {
  params: Promise<{ id: string }>;
};

function validateFlightBooking(
  booking: FlightBooking | null,
  userId: string,
  tripId: string,
): FlightBooking {
  if (
    !booking
    || String(booking.userId) !== userId
    || String(booking.tripId ?? '') !== tripId
  ) {
    throw new AppError('NOT_FOUND', 'Không tìm thấy đơn đặt vé máy bay', 404);
  }
  if (booking.status === 'cancelled') {
    throw new AppError('BAD_REQUEST', 'Đơn đặt vé đã bị hủy, không thể thanh toán', 400);
  }
  if (booking.paymentStatus === 'paid') {
    throw new AppError('CONFLICT', 'Đơn đặt vé này đã được thanh toán', 409);
  }
  return booking;
}

function validateHotelBooking(
  booking: HotelBooking | null,
  userId: string,
  tripId: string,
): HotelBooking {
  if (
    !booking
    || String(booking.userId) !== userId
    || String(booking.tripId ?? '') !== tripId
  ) {
    throw new AppError('NOT_FOUND', 'Không tìm thấy đơn đặt phòng khách sạn', 404);
  }
  if (booking.status === 'cancelled') {
    throw new AppError('BAD_REQUEST', 'Đặt phòng đã bị hủy, không thể thanh toán', 400);
  }
  if (booking.paymentStatus === 'paid') {
    throw new AppError('CONFLICT', 'Đặt phòng này đã được thanh toán', 409);
  }
  return booking;
}

export async function POST(request: NextRequest, ctx: RouteCtx): Promise<Response> {
  try {
    const user = await requireAuthUser(request);
    const userId = String(user._id);
    const tripId = await resolveObjectIdParam(ctx);

    await enforceRateLimit({
      key: `rl:pay-checkout-wizard:${userId}`,
      limit: 10,
      windowSeconds: 60,
      message: 'Bạn đang thao tác quá nhanh. Vui lòng thử lại sau.',
    });

    await getTripForMemberView(tripId, userId);
    const parsed = await parseJsonBody(request, payTripCheckoutSchema);
    const db = await getDb();
    const [flightBooking, hotelBooking] = await Promise.all([
      parsed.flightBookingId
        ? db.flightBookings.findById(parsed.flightBookingId) as Promise<FlightBooking | undefined>
        : Promise.resolve(undefined),
      parsed.hotelBookingId
        ? db.hotelBookings.findById(parsed.hotelBookingId) as Promise<HotelBooking | undefined>
        : Promise.resolve(undefined),
    ]);

    const validFlightBooking = parsed.flightBookingId
      ? validateFlightBooking(flightBooking ?? null, userId, tripId)
      : null;
    const validHotelBooking = parsed.hotelBookingId
      ? validateHotelBooking(hotelBooking ?? null, userId, tripId)
      : null;
    const paidAt = new Date();
    let updatedFlight: FlightBooking | null = null;
    let updatedHotel: HotelBooking | null = null;

    try {
      if (validFlightBooking && parsed.flightBookingId) {
        updatedFlight = (await db.flightBookings.findOneAndUpdate({
          _id: parsed.flightBookingId,
          userId,
          tripId,
          status: { $ne: 'cancelled' },
          paymentStatus: { $ne: 'paid' },
        }, {
          $set: { paymentStatus: 'paid', paidAt },
        })) as FlightBooking | null;
        if (!updatedFlight) {
          throw new AppError('CONFLICT', 'Trạng thái đơn đặt vé vừa thay đổi. Vui lòng tải lại thông tin', 409);
        }
      }

      if (validHotelBooking && parsed.hotelBookingId) {
        updatedHotel = (await db.hotelBookings.findOneAndUpdate({
          _id: parsed.hotelBookingId,
          userId,
          tripId,
          status: { $ne: 'cancelled' },
          paymentStatus: { $ne: 'paid' },
        }, {
          $set: { paymentStatus: 'paid', paidAt },
        })) as HotelBooking | null;
        if (!updatedHotel) {
          throw new AppError('CONFLICT', 'Trạng thái đặt phòng vừa thay đổi. Vui lòng tải lại thông tin', 409);
        }
      }
    } catch (error) {
      await Promise.allSettled([
        ...(updatedFlight && parsed.flightBookingId ? [
          db.flightBookings.findOneAndUpdate({
            _id: parsed.flightBookingId,
            userId,
            tripId,
            paymentStatus: 'paid',
            paidAt,
          }, {
            $set: { paymentStatus: 'unpaid', paidAt: null },
          }),
        ] : []),
        ...(updatedHotel && parsed.hotelBookingId ? [
          db.hotelBookings.findOneAndUpdate({
            _id: parsed.hotelBookingId,
            userId,
            tripId,
            paymentStatus: 'paid',
            paidAt,
          }, {
            $set: { paymentStatus: 'unpaid', paidAt: null },
          }),
        ] : []),
      ]);
      throw error;
    }

    await Promise.allSettled([
      ...(updatedFlight && parsed.flightBookingId ? [
        createAuditLog(userId, 'PAY_FLIGHT_BOOKING', 'FLIGHT_BOOKING', parsed.flightBookingId, {
          tripId,
          amount: validFlightBooking?.totalPrice,
        }),
      ] : []),
      ...(updatedHotel && parsed.hotelBookingId ? [
        createAuditLog(userId, 'PAY_HOTEL_BOOKING', 'HOTEL_BOOKING', parsed.hotelBookingId, {
          tripId,
          hotelId: String(validHotelBooking?.hotelId ?? ''),
          amount: validHotelBooking?.totalPrice,
        }),
      ] : []),
    ]);

    return sendSuccess(
      {
        ...(updatedFlight ? { flightBookingId: String(updatedFlight._id) } : {}),
        ...(updatedHotel ? { hotelBookingId: String(updatedHotel._id) } : {}),
        paymentStatus: 'paid' as const,
        paidAt,
      },
      'Đã ghi nhận thanh toán. Yêu cầu đang chờ quản trị viên xác nhận',
    );
  } catch (error) {
    return handleApiError(error);
  }
}
