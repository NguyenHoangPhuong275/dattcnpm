import { getAirlineByCode, getAirportByCode } from '@/data/vietnam-flights';
import { buildBookingPayment } from '@/lib/payment';
import type { FlightBooking, FlightBookingSegment } from '@/lib/db';

export function getFlightBookingCode(bookingId: string): string {
  return `LT-FL-${bookingId.slice(-6).toUpperCase()}`;
}

export function getFlightBookingPaymentReference(bookingId: string): string {
  return `LT-TT-VB-${bookingId.slice(-6).toUpperCase()}`;
}

export function formatFlightSegment(segment: FlightBookingSegment) {
  const airline = getAirlineByCode(segment.airlineCode);
  const fromAirport = getAirportByCode(segment.from);
  const toAirport = getAirportByCode(segment.to);

  return {
    ...segment,
    flightDate: segment.flightDate,
    airlineName: airline?.name ?? segment.airlineCode,
    fromCity: fromAirport?.city ?? segment.from,
    toCity: toAirport?.city ?? segment.to,
  };
}

export function toFlightBookingResponse(booking: FlightBooking, isAdmin = false) {
  const id = String(booking._id);
  const realCode = getFlightBookingCode(id);
  const code = (isAdmin || (booking.status === 'confirmed' && booking.paymentStatus === 'paid'))
    ? realCode
    : null;
  return {
    id,
    code,
    outbound: formatFlightSegment(booking.outbound),
    returnFlight: booking.returnFlight ? formatFlightSegment(booking.returnFlight) : null,
    passengers: booking.passengers,
    passengerNames: booking.passengerNames,
    contactName: booking.contactName,
    phone: booking.phone,
    contactEmail: booking.contactEmail,
    note: booking.note ?? null,
    totalPrice: booking.totalPrice,
    currency: booking.currency,
    status: booking.status,
    paymentStatus: booking.paymentStatus ?? 'unpaid',
    paidAt: booking.paidAt ?? null,
    confirmedAt: booking.confirmedAt ?? null,
    createdAt: booking.createdAt,
    payment: buildBookingPayment(booking.totalPrice, getFlightBookingPaymentReference(id)),
  };
}
