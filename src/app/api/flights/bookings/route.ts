import { NextRequest } from 'next/server';

import { getFlightScheduleById } from '@/data/vietnam-flights';
import { enforceRateLimit, parseJsonBody, requireAuthUser } from '@/lib/api-handler';
import { AppError, handleApiError, sendSuccess } from '@/lib/api-response';
import { getVietnamDateTimeParts, parseDateOnly } from '@/lib/date';
import { createAuditLog, getDb, type FlightBooking, type FlightBookingSegment } from '@/lib/db';
import { toFlightBookingResponse } from '@/lib/flight-bookings';
import { createFlightBookingSchema } from '@/lib/validations/flight-booking';

function toSegment(scheduleId: string, flightDate: string): FlightBookingSegment {
  const flight = getFlightScheduleById(scheduleId);
  if (!flight) {
    throw new AppError('NOT_FOUND', 'Không tìm thấy chuyến bay đã chọn', 404);
  }

  return {
    scheduleId: flight.id,
    flightNumber: flight.flightNumber,
    airlineCode: flight.airline,
    from: flight.from,
    to: flight.to,
    flightDate: parseDateOnly(flightDate)!,
    departureTime: flight.departureTime,
    arrivalTime: flight.arrivalTime,
    duration: flight.duration,
    pricePerPassenger: flight.basePrice,
  };
}

function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function getFlightTime(date: string, time: string): number {
  return parseDateOnly(date)!.getTime() + timeToMinutes(time) * 60_000;
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const user = await requireAuthUser(request);
    const userId = String(user._id);

    await enforceRateLimit({
      key: `rl:create-flight-booking:${userId}`,
      limit: 5,
      windowSeconds: 900,
      message: 'Bạn đang thao tác đặt vé quá nhanh. Vui lòng thử lại sau.',
    });

    const parsed = await parseJsonBody(request, createFlightBookingSchema);
    const outbound = toSegment(parsed.outboundFlightId, parsed.departDate);
    const returnFlight = parsed.returnFlightId && parsed.returnDate
      ? toSegment(parsed.returnFlightId, parsed.returnDate)
      : null;

    const now = getVietnamDateTimeParts();
    if (
      parsed.departDate < now.date
      || (parsed.departDate === now.date && outbound.departureTime <= now.time)
    ) {
      throw new AppError('VALIDATION_ERROR', 'Chuyến bay đã khởi hành hoặc ngày khởi hành đã qua', 400);
    }
    if (returnFlight) {
      if (parsed.returnDate! < parsed.departDate) {
        throw new AppError('VALIDATION_ERROR', 'Ngày về phải từ ngày khởi hành trở đi', 400);
      }
      if (returnFlight.from !== outbound.to || returnFlight.to !== outbound.from) {
        throw new AppError('VALIDATION_ERROR', 'Chuyến về không khớp với hành trình đã chọn', 400);
      }

      const outboundDeparture = getFlightTime(parsed.departDate, outbound.departureTime);
      let outboundArrival = getFlightTime(parsed.departDate, outbound.arrivalTime);
      if (outboundArrival <= outboundDeparture) outboundArrival += 86_400_000;
      const returnDeparture = getFlightTime(parsed.returnDate!, returnFlight.departureTime);
      if (returnDeparture <= outboundArrival) {
        throw new AppError('VALIDATION_ERROR', 'Chuyến về phải khởi hành sau khi chuyến đi đã hạ cánh', 400);
      }
    }

    const totalPrice = (outbound.pricePerPassenger + (returnFlight?.pricePerPassenger ?? 0)) * parsed.passengers;
    const db = await getDb();
    const booking = (await db.flightBookings.insertOne({
      userId,
      outbound,
      returnFlight,
      passengers: parsed.passengers,
      passengerNames: parsed.passengerNames,
      contactName: parsed.contactName,
      phone: parsed.phone,
      contactEmail: parsed.contactEmail,
      note: parsed.note || null,
      totalPrice,
      currency: 'VND',
      status: 'pending',
      paymentStatus: 'unpaid',
      paidAt: null,
      confirmedAt: null,
    })) as FlightBooking;

    await createAuditLog(userId, 'CREATE_FLIGHT_BOOKING', 'FLIGHT_BOOKING', String(booking._id), {
      outboundFlightId: outbound.scheduleId,
      returnFlightId: returnFlight?.scheduleId ?? null,
      passengers: parsed.passengers,
      totalPrice,
    }).catch(() => {});

    return sendSuccess(
      { booking: toFlightBookingResponse(booking) },
      'Đã ghi nhận yêu cầu đặt vé. Vui lòng hoàn tất thanh toán.',
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
