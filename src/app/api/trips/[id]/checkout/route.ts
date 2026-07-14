import { NextRequest } from 'next/server';

import { getFlightScheduleById } from '@/data/vietnam-flights';
import { enforceRateLimit, parseJsonBody, requireAuthUser, resolveObjectIdParam } from '@/lib/api-handler';
import { AppError, handleApiError, sendSuccess } from '@/lib/api-response';
import { differenceInCalendarDays, getVietnamDateTimeParts, parseDateOnly } from '@/lib/date';
import {
  createAuditLog,
  getDb,
  type FlightBooking,
  type FlightBookingSegment,
  type Hotel,
  type HotelBooking,
} from '@/lib/db';
import { getFlightBookingPaymentReference } from '@/lib/flight-bookings';
import { getHotelBookingPaymentReference } from '@/lib/hotel-bookings';
import { getHotelRoom } from '@/lib/hotel-rooms';
import { buildBookingPayment } from '@/lib/payment';
import { getTripForMemberView } from '@/lib/trip-permission';
import { createTripCheckoutSchema, type TripCheckoutInput } from '@/lib/validations/checkout';

type RouteCtx = {
  params: Promise<{ id: string }>;
};

type PreparedFlightBooking = {
  document: Record<string, unknown>;
  totalPrice: number;
  outboundFlightId: string;
  returnFlightId: string | null;
};

type PreparedHotelBooking = {
  document: Record<string, unknown>;
  totalPrice: number;
  hotelId: string;
  roomCode: string;
  nights: number;
};

const MAX_HOTEL_NIGHTS = 30;

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

function prepareFlightBooking(
  userId: string,
  tripId: string,
  flight: NonNullable<TripCheckoutInput['flight']>,
  contact: TripCheckoutInput['contact'],
): PreparedFlightBooking {
  const outbound = toSegment(flight.outboundFlightId, flight.departDate);
  const returnFlight = flight.returnFlightId && flight.returnDate
    ? toSegment(flight.returnFlightId, flight.returnDate)
    : null;
  const now = getVietnamDateTimeParts();

  if (
    flight.departDate < now.date
    || (flight.departDate === now.date && outbound.departureTime <= now.time)
  ) {
    throw new AppError('VALIDATION_ERROR', 'Chuyến bay đã khởi hành hoặc ngày khởi hành đã qua', 400);
  }

  if (returnFlight && flight.returnDate) {
    if (flight.returnDate < flight.departDate) {
      throw new AppError('VALIDATION_ERROR', 'Ngày về phải từ ngày khởi hành trở đi', 400);
    }
    if (returnFlight.from !== outbound.to || returnFlight.to !== outbound.from) {
      throw new AppError('VALIDATION_ERROR', 'Chuyến về không khớp với hành trình đã chọn', 400);
    }

    const outboundDeparture = getFlightTime(flight.departDate, outbound.departureTime);
    let outboundArrival = getFlightTime(flight.departDate, outbound.arrivalTime);
    if (outboundArrival <= outboundDeparture) outboundArrival += 86_400_000;
    if (getFlightTime(flight.returnDate, returnFlight.departureTime) <= outboundArrival) {
      throw new AppError('VALIDATION_ERROR', 'Chuyến về phải khởi hành sau khi chuyến đi đã hạ cánh', 400);
    }
  }

  const totalPrice = (
    outbound.pricePerPassenger + (returnFlight?.pricePerPassenger ?? 0)
  ) * flight.passengers;

  return {
    document: {
      userId,
      tripId,
      outbound,
      returnFlight,
      passengers: flight.passengers,
      passengerNames: flight.passengerNames,
      contactName: contact.contactName,
      phone: contact.phone,
      contactEmail: contact.contactEmail,
      note: contact.note || null,
      totalPrice,
      currency: 'VND',
      status: 'pending',
      paymentStatus: 'unpaid',
      paidAt: null,
      confirmedAt: null,
    },
    totalPrice,
    outboundFlightId: outbound.scheduleId,
    returnFlightId: returnFlight?.scheduleId ?? null,
  };
}

async function prepareHotelBooking(
  db: Awaited<ReturnType<typeof getDb>>,
  userId: string,
  tripId: string,
  hotelInput: NonNullable<TripCheckoutInput['hotel']>,
  contact: TripCheckoutInput['contact'],
): Promise<PreparedHotelBooking> {
  const hotel = (await db.hotels.findById(hotelInput.hotelId)) as Hotel | null;
  if (!hotel) {
    throw new AppError('NOT_FOUND', 'Không tìm thấy khách sạn', 404);
  }

  const room = getHotelRoom(
    {
      id: hotelInput.hotelId,
      priceLevel: hotel.priceLevel ?? null,
      rating: hotel.rating ?? null,
    },
    hotelInput.roomCode,
  );
  if (!room) {
    throw new AppError('VALIDATION_ERROR', 'Loại phòng không tồn tại ở khách sạn này', 400);
  }
  if (hotelInput.guests > room.capacity) {
    throw new AppError('VALIDATION_ERROR', `${room.name} tối đa ${room.capacity} khách`, 400);
  }

  const today = getVietnamDateTimeParts().date;
  if (hotelInput.checkIn < today) {
    throw new AppError('VALIDATION_ERROR', 'Ngày nhận phòng không được ở quá khứ', 400);
  }

  const nights = differenceInCalendarDays(hotelInput.checkIn, hotelInput.checkOut)!;
  if (nights <= 0) {
    throw new AppError('VALIDATION_ERROR', 'Ngày trả phòng phải sau ngày nhận phòng', 400);
  }
  if (nights > MAX_HOTEL_NIGHTS) {
    throw new AppError('VALIDATION_ERROR', `Chỉ hỗ trợ đặt tối đa ${MAX_HOTEL_NIGHTS} đêm`, 400);
  }

  const totalPrice = room.pricePerNight * nights;
  return {
    document: {
      hotelId: hotelInput.hotelId,
      userId,
      tripId,
      roomCode: room.code,
      roomName: room.name,
      checkIn: parseDateOnly(hotelInput.checkIn)!,
      checkOut: parseDateOnly(hotelInput.checkOut)!,
      nights,
      guests: hotelInput.guests,
      guestTitle: hotelInput.guestTitle,
      guestName: hotelInput.guestName,
      phone: contact.phone,
      contactEmail: contact.contactEmail,
      note: contact.note || null,
      pricePerNight: room.pricePerNight,
      totalPrice,
      currency: 'VND',
      status: 'pending',
      paymentStatus: 'unpaid',
      paidAt: null,
      confirmedAt: null,
    },
    totalPrice,
    hotelId: hotelInput.hotelId,
    roomCode: room.code,
    nights,
  };
}

export async function POST(request: NextRequest, ctx: RouteCtx): Promise<Response> {
  try {
    const user = await requireAuthUser(request);
    const userId = String(user._id);
    const tripId = await resolveObjectIdParam(ctx);

    await enforceRateLimit({
      key: `rl:checkout-wizard:${userId}`,
      limit: 10,
      windowSeconds: 60,
      message: 'Bạn đang thao tác quá nhanh. Vui lòng thử lại sau.',
    });

    await getTripForMemberView(tripId, userId);
    const parsed = await parseJsonBody(request, createTripCheckoutSchema);
    const db = await getDb();
    const preparedFlight = parsed.flight
      ? prepareFlightBooking(userId, tripId, parsed.flight, parsed.contact)
      : null;
    const preparedHotel = parsed.hotel
      ? await prepareHotelBooking(db, userId, tripId, parsed.hotel, parsed.contact)
      : null;

    let flightBooking: FlightBooking | null = null;
    let hotelBooking: HotelBooking | null = null;
    try {
      if (preparedFlight) {
        flightBooking = (await db.flightBookings.insertOne(preparedFlight.document)) as FlightBooking;
      }
      if (preparedHotel) {
        hotelBooking = (await db.hotelBookings.insertOne(preparedHotel.document)) as HotelBooking;
      }
    } catch (error) {
      await Promise.allSettled([
        ...(flightBooking ? [db.flightBookings.deleteOne(flightBooking._id)] : []),
        ...(hotelBooking ? [db.hotelBookings.deleteOne(hotelBooking._id)] : []),
      ]);
      throw error;
    }

    const flightBookingId = flightBooking ? String(flightBooking._id) : undefined;
    const hotelBookingId = hotelBooking ? String(hotelBooking._id) : undefined;
    const paymentReferences = [
      flightBookingId ? getFlightBookingPaymentReference(flightBookingId) : null,
      hotelBookingId ? getHotelBookingPaymentReference(hotelBookingId) : null,
    ].filter((reference): reference is string => Boolean(reference));
    const totalPrice = (preparedFlight?.totalPrice ?? 0) + (preparedHotel?.totalPrice ?? 0);
    const payment = buildBookingPayment(totalPrice, paymentReferences.join(' '));

    await Promise.allSettled([
      ...(flightBookingId && preparedFlight ? [
        createAuditLog(userId, 'CREATE_FLIGHT_BOOKING', 'FLIGHT_BOOKING', flightBookingId, {
          tripId,
          outboundFlightId: preparedFlight.outboundFlightId,
          returnFlightId: preparedFlight.returnFlightId,
          passengers: parsed.flight?.passengers,
          totalPrice: preparedFlight.totalPrice,
        }),
      ] : []),
      ...(hotelBookingId && preparedHotel ? [
        createAuditLog(userId, 'CREATE_HOTEL_BOOKING', 'HOTEL_BOOKING', hotelBookingId, {
          tripId,
          hotelId: preparedHotel.hotelId,
          roomCode: preparedHotel.roomCode,
          nights: preparedHotel.nights,
          totalPrice: preparedHotel.totalPrice,
        }),
      ] : []),
    ]);

    return sendSuccess({
      ...(flightBookingId ? { flightBookingId } : {}),
      ...(hotelBookingId ? { hotelBookingId } : {}),
      totalPrice,
      payment,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
