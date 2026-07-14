import { NextRequest } from 'next/server';
import { getDb, type Hotel, type HotelBooking, type FlightBooking } from '@/lib/db';
import { isAdminRequest } from '@/lib/admin-authorization';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { toHotelBookingResponse } from '@/lib/hotel-bookings';
import { toFlightBookingResponse } from '@/lib/flight-bookings';
import { getAirlineByCode, getAirportByCode } from '@/data/vietnam-flights';

const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled'] as const;
const ADMIN_BOOKINGS_LIMIT = 100;

interface AdminBookingItem {
  type: 'room' | 'flight';
  createdAt?: Date | null;
  [key: string]: unknown;
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
    if (!(await isAdminRequest(request))) {
      throw new AppError('FORBIDDEN', 'Chỉ quản trị viên mới có quyền truy cập', 403);
    }

    const searchParams = new URL(request.url).searchParams;
    const statusParam = searchParams.get('status');
    const typeParam = searchParams.get('type') || 'all';

    const filter: Record<string, unknown> = {};
    if (statusParam && (BOOKING_STATUSES as readonly string[]).includes(statusParam)) {
      filter.status = statusParam;
    }

    const db = await getDb();
    let hotelBookingsList: AdminBookingItem[] = [];
    let flightBookingsList: AdminBookingItem[] = [];

    if (typeParam === 'all' || typeParam === 'room') {
      const bookings = (await db.hotelBookings.find(filter, {
        sortBy: 'createdAt',
        sortOrder: -1,
        limit: ADMIN_BOOKINGS_LIMIT,
      })) as HotelBooking[];

      const hotelIds = [...new Set(bookings.map((booking) => String(booking.hotelId)))];
      const hotels = hotelIds.length
        ? ((await db.hotels.find({ _id: { $in: hotelIds } }, { projection: { _id: 1, name: 1 } })) as Pick<Hotel, '_id' | 'name'>[])
        : [];
      const hotelNameById = new Map(hotels.map((hotel) => [String(hotel._id), hotel.name]));

      hotelBookingsList = bookings.map((booking) => {
        const item = toHotelBookingResponse(booking, hotelNameById.get(String(booking.hotelId)) ?? null, true);
        return {
          type: 'room' as const,
          ...item,
          contactName: `${item.guestTitle} ${item.guestName}`.trim(),
        };
      });
    }

    if (typeParam === 'all' || typeParam === 'flight') {
      const bookings = (await db.flightBookings.find(filter, {
        sortBy: 'createdAt',
        sortOrder: -1,
        limit: ADMIN_BOOKINGS_LIMIT,
      })) as FlightBooking[];

      flightBookingsList = bookings.map((booking) => {
        const item = toFlightBookingResponse(booking, true);
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

        return {
          type: 'flight' as const,
          id: item.id,
          code: item.code,
          status: item.status,
          paymentStatus: item.paymentStatus,
          paidAt: item.paidAt,
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
        };
      });
    }

    const allBookings = [...hotelBookingsList, ...flightBookingsList].sort((a, b) => {
      const dateA = a.createdAt?.getTime() ?? 0;
      const dateB = b.createdAt?.getTime() ?? 0;
      return dateB - dateA;
    });

    return sendSuccess(allBookings.slice(0, ADMIN_BOOKINGS_LIMIT));
  } catch (error) {
    return handleApiError(error);
  }
}
