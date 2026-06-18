import { z } from 'zod';
import { optionalTrimString, trimString } from './common';

const isoDate = z.string().refine((v) => !isNaN(new Date(v).getTime()), { message: 'Ngày không hợp lệ' });

export const ACCOMMODATION_CURRENCIES = ['VND', 'USD', 'EUR', 'THB', 'JPY', 'KRW', 'SGD'] as const;

const currencyField = z.enum(ACCOMMODATION_CURRENCIES, { message: 'Loại tiền tệ không hợp lệ' });

export const createAccommodationSchema = z
  .object({
    name: trimString(1, 200),
    address: optionalTrimString(300),
    checkIn: isoDate,
    checkOut: isoDate,
    bookingCode: optionalTrimString(100),
    note: optionalTrimString(500),
    currency: currencyField.default('VND'),
  })
  .refine((data) => new Date(data.checkOut).getTime() > new Date(data.checkIn).getTime(), {
    message: 'Ngày trả phòng phải sau ngày nhận phòng',
    path: ['checkOut'],
  });

export const updateAccommodationSchema = z
  .object({
    name: trimString(1, 200).optional(),
    address: optionalTrimString(300),
    checkIn: isoDate.optional(),
    checkOut: isoDate.optional(),
    bookingCode: optionalTrimString(100),
    note: optionalTrimString(500),
    currency: currencyField.optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'Không có trường hợp lệ để cập nhật',
  })
  .refine(
    (data) =>
      !(data.checkIn && data.checkOut) ||
      new Date(data.checkOut).getTime() > new Date(data.checkIn).getTime(),
    { message: 'Ngày trả phòng phải sau ngày nhận phòng', path: ['checkOut'] }
  );

export type CreateAccommodationInput = z.infer<typeof createAccommodationSchema>;
export type UpdateAccommodationInput = z.infer<typeof updateAccommodationSchema>;
