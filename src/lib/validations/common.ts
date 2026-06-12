import { z } from 'zod';
import { Types } from 'mongoose';

export const objectIdSchema = z
  .string()
  .refine((val) => Types.ObjectId.isValid(val), {
    message: 'ID không hợp lệ',
  });

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const latLngSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export const optionalLatLngSchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional().nullable(),
  lng: z.coerce.number().min(-180).max(180).optional().nullable(),
});

export const dateStringSchema = z
  .string()
  .refine((val) => !val || !isNaN(new Date(val).getTime()), {
    message: 'Ngày không hợp lệ',
  })
  .optional()
  .nullable();

export const trimString = (min = 1, max = 200) =>
  z
    .string()
    .trim()
    .min(min, `Tối thiểu ${min} ký tự`)
    .max(max, `Tối đa ${max} ký tự`);

export const optionalTrimString = (max = 500) =>
  z
    .string()
    .trim()
    .max(max, `Tối đa ${max} ký tự`)
    .optional()
    .nullable()
    .transform((v) => (v === '' ? null : v));

export type ObjectIdInput = z.infer<typeof objectIdSchema>;
