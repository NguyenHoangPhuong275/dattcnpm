import { z } from 'zod';

import { isValidDateOnly } from '@/lib/date';
import { bookingContactSchema } from '@/lib/validations/booking';

const flightDateSchema = z
  .string()
  .min(1, 'Vui lòng chọn ngày bay')
  .refine(isValidDateOnly, {
    message: 'Ngày bay không hợp lệ',
  });

const flightBookingSelectionFields = {
  outboundFlightId: z.string().trim().min(1, 'Vui lòng chọn chuyến đi'),
  returnFlightId: z.string().trim().min(1, 'Vui lòng chọn chuyến về').optional(),
  departDate: flightDateSchema,
  returnDate: flightDateSchema.optional(),
  passengers: z.coerce.number().int().min(1, 'Tối thiểu 1 hành khách').max(9, 'Tối đa 9 hành khách'),
  passengerNames: z
    .array(z.string().trim().min(2, 'Vui lòng nhập đầy đủ họ tên hành khách').max(100, 'Họ tên quá dài'))
    .min(1, 'Vui lòng nhập thông tin hành khách')
    .max(9, 'Tối đa 9 hành khách'),
};

function validateFlightSelection(
  data: z.infer<z.ZodObject<typeof flightBookingSelectionFields>>,
  ctx: z.RefinementCtx,
): void {
  if (data.passengerNames.length !== data.passengers) {
    ctx.addIssue({
      code: 'custom',
      path: ['passengerNames'],
      message: `Cần nhập đủ thông tin cho ${data.passengers} hành khách`,
    });
  }
  if (Boolean(data.returnFlightId) !== Boolean(data.returnDate)) {
    ctx.addIssue({
      code: 'custom',
      path: ['returnFlightId'],
      message: 'Chuyến về và ngày về phải được chọn cùng nhau',
    });
  }
}

export const flightBookingSelectionSchema = z
  .object(flightBookingSelectionFields)
  .superRefine(validateFlightSelection);

export const createFlightBookingSchema = z
  .object({
    ...flightBookingSelectionFields,
    ...bookingContactSchema.shape,
  })
  .superRefine(validateFlightSelection);

export type CreateFlightBookingInput = z.infer<typeof createFlightBookingSchema>;
