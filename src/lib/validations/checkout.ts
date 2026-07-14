import { z } from 'zod';

import { bookingContactSchema, hotelBookingSelectionSchema } from '@/lib/validations/booking';
import { objectIdSchema } from '@/lib/validations/common';
import { flightBookingSelectionSchema } from '@/lib/validations/flight-booking';

export const createTripCheckoutSchema = z.object({
  contact: bookingContactSchema,
  flight: flightBookingSelectionSchema.optional(),
  hotel: hotelBookingSelectionSchema.extend({
    hotelId: objectIdSchema,
  }).optional(),
}).superRefine((data, ctx) => {
  if (!data.flight && !data.hotel) {
    ctx.addIssue({
      code: 'custom',
      path: ['flight'],
      message: 'Vui lòng chọn ít nhất một dịch vụ để thanh toán',
    });
  }
});

export const payTripCheckoutSchema = z.object({
  flightBookingId: objectIdSchema.optional(),
  hotelBookingId: objectIdSchema.optional(),
}).superRefine((data, ctx) => {
  if (!data.flightBookingId && !data.hotelBookingId) {
    ctx.addIssue({
      code: 'custom',
      path: ['flightBookingId'],
      message: 'Không có đơn đặt dịch vụ để xác nhận thanh toán',
    });
  }
});

export type TripCheckoutInput = z.infer<typeof createTripCheckoutSchema>;
