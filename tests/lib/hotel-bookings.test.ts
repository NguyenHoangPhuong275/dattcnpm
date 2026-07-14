import { describe, expect, it } from 'vitest';

import type { HotelBooking } from '@/lib/db';
import {
  buildBookingEmailContent,
  getHotelBookingPaymentReference,
  toHotelBookingResponse,
} from '@/lib/hotel-bookings';
import { createHotelBookingSchema } from '@/lib/validations/booking';

const booking = {
  _id: '507f1f77bcf86cd799439011',
  hotelId: '507f1f77bcf86cd799439012',
  userId: '507f1f77bcf86cd799439013',
  roomCode: 'standard',
  roomName: 'Phòng Standard',
  checkIn: new Date('2030-03-10T00:00:00.000Z'),
  checkOut: new Date('2030-03-12T00:00:00.000Z'),
  nights: 2,
  guests: 2,
  guestTitle: 'Ông',
  guestName: 'Nguyễn Văn A',
  phone: '0912345678',
  contactEmail: 'khach@example.com',
  pricePerNight: 1_000_000,
  totalPrice: 2_000_000,
  currency: 'VND',
  status: 'pending',
  paymentStatus: 'unpaid',
  createdAt: new Date(),
  updatedAt: new Date(),
} satisfies HotelBooking;

const validInput = {
  roomCode: 'standard',
  checkIn: '2030-03-10',
  checkOut: '2030-03-12',
  guests: 2,
  guestTitle: 'Ông',
  guestName: 'Nguyễn Văn A',
  phone: '0912345678',
  contactEmail: 'khach@example.com',
};

describe('hotel booking domain', () => {
  it('từ chối ngày lịch không tồn tại', () => {
    expect(createHotelBookingSchema.safeParse({
      ...validInput,
      checkIn: '2030-02-31',
    }).success).toBe(false);
  });

  it('dùng mã tham chiếu thanh toán riêng với mã nhận phòng', () => {
    const response = toHotelBookingResponse(booking);
    expect(response.code).toBeNull();
    expect(response.payment.content).toBe(getHotelBookingPaymentReference(booking._id));
    expect(response.payment.content).toBe('LT-TT-439011');
    expect(response.payment.content).not.toBe('LT-439011');
  });

  it('không đưa mã nhận phòng vào email ghi nhận hoặc email hủy', () => {
    const received = buildBookingEmailContent(booking, 'Khách sạn Lotus', 'received');
    const cancelled = buildBookingEmailContent({ ...booking, status: 'cancelled' }, 'Khách sạn Lotus', 'cancelled');

    expect(received.subject).not.toContain('LT-439011');
    expect(received.html).not.toContain('LT-439011');
    expect(cancelled.subject).not.toContain('LT-439011');
    expect(cancelled.html).not.toContain('LT-439011');
  });

  it('chỉ đưa mã nhận phòng vào email sau khi đã thanh toán và xác nhận', () => {
    const unpaid = buildBookingEmailContent({ ...booking, status: 'confirmed' }, 'Khách sạn Lotus', 'confirmed');
    const confirmed = buildBookingEmailContent(
      { ...booking, status: 'confirmed', paymentStatus: 'paid' },
      'Khách sạn Lotus',
      'confirmed',
    );

    expect(unpaid.subject).not.toContain('LT-439011');
    expect(unpaid.html).not.toContain('LT-439011');
    expect(confirmed.subject).toContain('LT-439011');
    expect(confirmed.html).toContain('LT-439011');
  });
});
