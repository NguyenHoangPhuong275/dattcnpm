import { z } from 'zod';

import { isValidDateOnly } from '@/lib/date';

const VN_PHONE_REGEX = /^(0|\+84)\d{9,10}$/;

const bookingDateField = z
  .string()
  .min(1, 'Vui lòng chọn ngày')
  .refine(isValidDateOnly, { message: 'Ngày không hợp lệ' });

export const bookingContactSchema = z.object({
  contactName: z.string().trim().min(2, 'Vui lòng nhập tên người liên hệ').max(100, 'Họ tên quá dài'),
  phone: z
    .string()
    .trim()
    .regex(VN_PHONE_REGEX, 'Số điện thoại không hợp lệ (VD: 0912345678 hoặc +84912345678)'),
  contactEmail: z.string().trim().toLowerCase().email('Email không đúng định dạng'),
  note: z.string().trim().max(500, 'Ghi chú tối đa 500 ký tự').optional(),
});

export const BOOKING_GUEST_TITLES = ['Ông', 'Bà'] as const;

export const hotelBookingSelectionSchema = z.object({
  roomCode: z.string().min(1, 'Vui lòng chọn loại phòng'),
  checkIn: bookingDateField,
  checkOut: bookingDateField,
  guests: z.coerce.number().int().min(1, 'Tối thiểu 1 khách').max(8, 'Tối đa 8 khách'),
  guestTitle: z.enum(BOOKING_GUEST_TITLES, { message: 'Vui lòng chọn danh xưng' }),
  guestName: z.string().trim().min(2, 'Vui lòng nhập họ tên').max(100, 'Họ tên quá dài'),
});

export const createHotelBookingSchema = hotelBookingSelectionSchema.extend({
  phone: bookingContactSchema.shape.phone,
  contactEmail: bookingContactSchema.shape.contactEmail,
  note: bookingContactSchema.shape.note,
});
