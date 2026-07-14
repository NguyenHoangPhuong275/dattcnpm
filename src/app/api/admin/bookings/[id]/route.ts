import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAuditLog, getDb, type Hotel, type HotelBooking, type FlightBooking } from '@/lib/db';
import { getAuthUserFull } from '@/lib/auth';
import { hasAdminSession } from '@/lib/admin-auth';
import { objectIdSchema } from '@/lib/validations/common';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendBookingEmail, toHotelBookingResponse } from '@/lib/hotel-bookings';
import { toFlightBookingResponse } from '@/lib/flight-bookings';
import { getAirlineByCode, getAirportByCode } from '@/data/vietnam-flights';

type RouteCtx = {
  params: Promise<{ id: string }>;
};

const updateBookingSchema = z.object({
  status: z.enum(['confirmed', 'cancelled']),
});

type BookingDecision = z.infer<typeof updateBookingSchema>['status'];

function ensureTransitionAllowed(
  booking: Pick<HotelBooking | FlightBooking, 'status' | 'paymentStatus' | 'paidAt'>,
  decision: BookingDecision,
): void {
  if (booking.status !== 'pending') {
    throw new AppError('CONFLICT', 'Đặt chỗ này đã được xử lý trước đó', 409);
  }

  if (decision === 'confirmed' && !booking.paidAt) {
    throw new AppError('CONFLICT', 'Chỉ có thể xác nhận sau khi khách đã thông báo thanh toán', 409);
  }
}

function getHotelDecisionMessage(
  decision: BookingDecision,
  emailResult: 'sent' | 'skipped' | 'failed',
): string {
  if (emailResult === 'sent') {
    return decision === 'confirmed'
      ? 'Đã xác nhận đặt phòng và gửi email cho khách'
      : 'Đã hủy yêu cầu và gửi email thông báo cho khách';
  }
  return decision === 'confirmed'
    ? 'Đã xác nhận đặt phòng. Email thông báo chưa được gửi'
    : 'Đã hủy yêu cầu. Email thông báo chưa được gửi';
}

export async function PATCH(request: NextRequest, ctx: RouteCtx): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    const isEnvironmentAdmin = await hasAdminSession(request);
    if (!user && !isEnvironmentAdmin) {
      throw new AppError('UNAUTHORIZED', 'Phiên đăng nhập không hợp lệ hoặc tài khoản đã bị khóa', 401);
    }
    if (user && user.role !== 'ADMIN' && !isEnvironmentAdmin) {
      throw new AppError('FORBIDDEN', 'Chỉ quản trị viên mới có quyền truy cập', 403);
    }
    const auditActorId = user?.role === 'ADMIN' ? String(user._id) : null;
    const rateLimitActor = auditActorId ?? 'environment-admin';

    const rate = await checkRateLimit({
      key: `rl:resolve-booking:${rateLimitActor}`,
      limit: 60,
      windowSeconds: 60,
    });
    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Bạn đang xử lý đặt chỗ quá nhanh. Vui lòng thử lại sau.', 429);
    }

    const { id } = await ctx.params;
    objectIdSchema.parse(id);

    const body = await request.json().catch(() => ({}));
    const parsed = updateBookingSchema.parse(body);

    const db = await getDb();
    const update = {
      status: parsed.status,
      paymentStatus: parsed.status === 'confirmed' ? 'paid' : 'unpaid',
      confirmedAt: parsed.status === 'confirmed' ? new Date() : null,
    };
    const actorType = auditActorId ? 'user-admin' : 'environment-admin';
    const hotelBooking = (await db.hotelBookings.findById(id)) as HotelBooking | null;

    if (hotelBooking) {
      ensureTransitionAllowed(hotelBooking, parsed.status);
      const updated = (await db.hotelBookings.findOneAndUpdate(
        { _id: id, status: 'pending' },
        { $set: update },
      )) as HotelBooking | null;
      if (!updated) {
        throw new AppError('CONFLICT', 'Trạng thái đặt phòng vừa thay đổi. Vui lòng tải lại thông tin', 409);
      }

      if (parsed.status === 'confirmed' && hotelBooking.tripId) {
        const hotel = (await db.hotels.findById(String(hotelBooking.hotelId))) as Hotel | null;
        await db.tripAccommodations.insertOne({
          tripId: String(hotelBooking.tripId),
          hotelId: String(hotelBooking.hotelId),
          name: hotel?.name || hotelBooking.roomName,
          address: hotel?.address || null,
          checkIn: hotelBooking.checkIn,
          checkOut: hotelBooking.checkOut,
          cost: hotelBooking.totalPrice,
          currency: 'VND',
          bookingRef: String(hotelBooking._id),
        });
      }

      const hotel = (await db.hotels.findById(String(hotelBooking.hotelId))) as Hotel | null;
      const emailResult = await sendBookingEmail(
        updated,
        hotel?.name ?? 'khách sạn',
        parsed.status === 'confirmed' ? 'confirmed' : 'cancelled',
      );

      await createAuditLog(
        auditActorId,
        parsed.status === 'confirmed' ? 'CONFIRM_HOTEL_BOOKING' : 'CANCEL_HOTEL_BOOKING',
        'HOTEL_BOOKING',
        id,
        {
          hotelId: String(hotelBooking.hotelId),
          emailResult,
          actorType,
        },
      ).catch(() => {});

      return sendSuccess(
        {
          booking: {
            type: 'room',
            ...toHotelBookingResponse(updated, hotel?.name ?? null, true),
            contactName: `${updated.guestTitle} ${updated.guestName}`.trim(),
          },
          emailSent: emailResult === 'sent',
        },
        getHotelDecisionMessage(parsed.status, emailResult),
      );
    }

    const flightBooking = (await db.flightBookings.findById(id)) as FlightBooking | null;
    if (!flightBooking) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy thông tin đặt chỗ', 404);
    }
    ensureTransitionAllowed(flightBooking, parsed.status);

    const updated = (await db.flightBookings.findOneAndUpdate(
      { _id: id, status: 'pending' },
      { $set: update },
    )) as FlightBooking | null;
    if (!updated) {
      throw new AppError('CONFLICT', 'Trạng thái đơn đặt vé vừa thay đổi. Vui lòng tải lại thông tin', 409);
    }

    await createAuditLog(
      auditActorId,
      parsed.status === 'confirmed' ? 'CONFIRM_FLIGHT_BOOKING' : 'CANCEL_FLIGHT_BOOKING',
      'FLIGHT_BOOKING',
      id,
      { totalPrice: updated.totalPrice, actorType },
    ).catch(() => {});

    const item = toFlightBookingResponse(updated, true);
    const outboundAirline = getAirlineByCode(item.outbound.airlineCode)?.name || item.outbound.airlineCode;
    const outboundFrom = getAirportByCode(item.outbound.from)?.city || item.outbound.from;
    const outboundTo = getAirportByCode(item.outbound.to)?.city || item.outbound.to;
    const outboundSummary = `${outboundAirline} (${item.outbound.flightNumber}): ${outboundFrom} ➔ ${outboundTo} (${item.outbound.departureTime})`;

    let returnSummary = '';
    if (item.returnFlight) {
      const returnAirline = getAirlineByCode(item.returnFlight.airlineCode)?.name || item.returnFlight.airlineCode;
      const returnFrom = getAirportByCode(item.returnFlight.from)?.city || item.returnFlight.from;
      const returnTo = getAirportByCode(item.returnFlight.to)?.city || item.returnFlight.to;
      returnSummary = `${returnAirline} (${item.returnFlight.flightNumber}): ${returnFrom} ➔ ${returnTo} (${item.returnFlight.departureTime})`;
    }

    return sendSuccess(
      {
        booking: {
          type: 'flight',
          id: item.id,
          code: item.code,
          status: item.status,
          paymentStatus: item.paymentStatus,
          confirmedAt: item.confirmedAt,
          totalPrice: item.totalPrice,
          contactName: item.contactName,
          phone: item.phone,
          contactEmail: item.contactEmail,
          note: item.note,
          createdAt: item.createdAt,
          outboundSummary,
          returnSummary: returnSummary || null,
          passengers: item.passengers,
          passengerNames: item.passengerNames,
        },
        emailSent: false,
      },
      parsed.status === 'confirmed' ? 'Đã xác nhận yêu cầu đặt vé máy bay' : 'Đã hủy yêu cầu đặt vé máy bay',
    );
  } catch (error) {
    return handleApiError(error);
  }
}
