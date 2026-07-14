import { z } from 'zod';
import { Types } from 'mongoose';

export const objectIdSchema = z
  .string({
    error: (issue) => issue.input === undefined ? 'ID là bắt buộc' : 'ID phải là chuỗi',
  })
  .refine((val) => Types.ObjectId.isValid(val), {
    message: 'ID không hợp lệ',
  });

export const latLngSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export const dateStringSchema = z
  .string({ error: 'Ngày phải là chuỗi hợp lệ' })
  .refine((val) => !val || !isNaN(new Date(val).getTime()), {
    message: 'Ngày không hợp lệ',
  })
  .optional()
  .nullable();

export const trimString = (min = 1, max = 200, requiredMessage = 'Trường này là bắt buộc') =>
  z
    .string({
      error: (issue) => issue.input === undefined ? requiredMessage : 'Dữ liệu phải là chuỗi',
    })
    .trim()
    .min(min, `Tối thiểu ${min} ký tự`)
    .max(max, `Tối đa ${max} ký tự`);

export const optionalTrimString = (max = 500) =>
  z
    .string({ error: 'Dữ liệu phải là chuỗi' })
    .trim()
    .max(max, `Tối đa ${max} ký tự`)
    .optional()
    .nullable()
    .transform((v) => (v === '' ? null : v));

export const optionalPhoneString = z
  .string({ error: 'Số điện thoại phải là chuỗi' })
  .trim()
  .refine((v) => /^\+?[0-9]{8,15}$/.test(v.replace(/[\s().-]/g, '')), {
    message: 'Số điện thoại không hợp lệ (8-15 chữ số, có thể bắt đầu bằng dấu +)',
  })
  .or(z.literal(''))
  .transform((v) => (v ? v : null))
  .optional()
  .nullable();

export type ObjectIdInput = z.infer<typeof objectIdSchema>;
