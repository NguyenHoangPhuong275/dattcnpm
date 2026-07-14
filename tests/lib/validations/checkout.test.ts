import { describe, expect, it } from 'vitest';

import { createTripCheckoutSchema, payTripCheckoutSchema } from '@/lib/validations/checkout';

const hotelId = '507f1f77bcf86cd799439011';
const bookingId = '507f1f77bcf86cd799439012';

const contact = {
  contactName: 'Nguyễn Văn A',
  phone: '0912345678',
  contactEmail: 'USER@EXAMPLE.COM',
};

describe('trip checkout validation', () => {
  it('requires a valid contact and at least one service', () => {
    expect(() => createTripCheckoutSchema.parse({ contact })).toThrow();
    expect(() => createTripCheckoutSchema.parse({
      contact: { ...contact, phone: '123' },
      hotel: {
        hotelId,
        roomCode: 'standard',
        checkIn: '2026-08-10',
        checkOut: '2026-08-12',
        guests: 2,
        guestTitle: 'Ông',
        guestName: 'Nguyễn Văn A',
      },
    })).toThrow();
  });

  it('reuses hotel and flight booking constraints', () => {
    expect(() => createTripCheckoutSchema.parse({
      contact,
      flight: {
        outboundFlightId: 'FL-SGN-HAN-01',
        departDate: '2026-08-10',
        passengers: 2,
        passengerNames: ['Nguyễn Văn A'],
      },
    })).toThrow();

    const parsed = createTripCheckoutSchema.parse({
      contact,
      hotel: {
        hotelId,
        roomCode: 'standard',
        checkIn: '2026-08-10',
        checkOut: '2026-08-12',
        guests: 2,
        guestTitle: 'Ông',
        guestName: 'Nguyễn Văn A',
      },
    });
    expect(parsed.contact.contactEmail).toBe('user@example.com');
  });
});

describe('trip checkout payment validation', () => {
  it('rejects an empty body and invalid booking identifiers', () => {
    expect(() => payTripCheckoutSchema.parse({})).toThrow();
    expect(() => payTripCheckoutSchema.parse({ flightBookingId: 'invalid' })).toThrow();
  });

  it('accepts either booking identifier', () => {
    expect(payTripCheckoutSchema.parse({ hotelBookingId: bookingId })).toEqual({ hotelBookingId: bookingId });
    expect(payTripCheckoutSchema.parse({ flightBookingId: bookingId })).toEqual({ flightBookingId: bookingId });
  });
});
