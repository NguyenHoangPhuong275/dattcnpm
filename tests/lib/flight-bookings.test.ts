import { describe, expect, it } from 'vitest';

import { getAirlineByCode, getAirportByCode, getFlightScheduleById } from '@/data/vietnam-flights';
import type { FlightBooking } from '@/lib/db';
import {
  getFlightBookingCode,
  getFlightBookingPaymentReference,
  toFlightBookingResponse,
} from '@/lib/flight-bookings';
import { createFlightBookingSchema } from '@/lib/validations/flight-booking';

const validInput = {
  outboundFlightId: 'FL-SGN-HAN-01',
  returnFlightId: 'FL-HAN-SGN-01',
  departDate: '2030-01-10',
  returnDate: '2030-01-15',
  passengers: 2,
  passengerNames: ['Nguyễn Văn A', 'Trần Thị B'],
  contactName: 'Nguyễn Văn A',
  phone: '0912345678',
  contactEmail: 'khach@example.com',
};

describe('flight booking domain', () => {
  it('tra cứu hãng, sân bay và lịch bay ổn định theo mã', () => {
    expect(getAirlineByCode('vn')?.name).toBe('Vietnam Airlines');
    expect(getAirportByCode('sgn')?.city).toBe('Hồ Chí Minh');
    expect(getFlightScheduleById('FL-SGN-HAN-01')?.flightNumber).toBe('VN 204');
    expect(getFlightScheduleById('khong-ton-tai')).toBeNull();
  });

  it('chỉ chấp nhận đủ họ tên cho đúng số hành khách', () => {
    expect(createFlightBookingSchema.safeParse(validInput).success).toBe(true);
    expect(createFlightBookingSchema.safeParse({
      ...validInput,
      passengerNames: ['Nguyễn Văn A'],
    }).success).toBe(false);
  });

  it('không cho gửi chuyến về nếu thiếu ngày về và ngược lại', () => {
    expect(createFlightBookingSchema.safeParse({
      ...validInput,
      returnDate: undefined,
    }).success).toBe(false);
    expect(createFlightBookingSchema.safeParse({
      ...validInput,
      returnFlightId: undefined,
    }).success).toBe(false);
  });

  it('từ chối ngày lịch không tồn tại thay vì để JavaScript tự chuẩn hóa', () => {
    expect(createFlightBookingSchema.safeParse({
      ...validInput,
      departDate: '2030-02-31',
    }).success).toBe(false);
  });

  it('tạo response đúng dữ liệu bay và chỉ cấp mã sau khi hoàn tất xác nhận', () => {
    const booking = {
      _id: '507f1f77bcf86cd799439011',
      userId: '507f1f77bcf86cd799439012',
      outbound: {
        scheduleId: 'FL-SGN-HAN-01',
        flightNumber: 'VN 204',
        airlineCode: 'VN',
        from: 'SGN',
        to: 'HAN',
        flightDate: new Date('2030-01-10T00:00:00'),
        departureTime: '06:00',
        arrivalTime: '08:15',
        duration: '2h 15m',
        pricePerPassenger: 1_890_000,
      },
      returnFlight: null,
      passengers: 2,
      passengerNames: ['Nguyễn Văn A', 'Trần Thị B'],
      contactName: 'Nguyễn Văn A',
      phone: '0912345678',
      contactEmail: 'khach@example.com',
      totalPrice: 3_780_000,
      currency: 'VND',
      status: 'pending',
      paymentStatus: 'unpaid',
      createdAt: new Date(),
      updatedAt: new Date(),
    } satisfies FlightBooking;

    const response = toFlightBookingResponse(booking);
    expect(getFlightBookingCode(booking._id)).toBe('LT-FL-439011');
    expect(response.outbound.airlineName).toBe('Vietnam Airlines');
    expect(response.outbound.fromCity).toBe('Hồ Chí Minh');
    expect(response.outbound.toCity).toBe('Hà Nội');
    expect(response.totalPrice).toBe(3_780_000);
    expect(response.payment.amount).toBe(3_780_000);
    expect(response.payment.content).toBe(getFlightBookingPaymentReference(booking._id));
    expect(response.payment.content).not.toBe(getFlightBookingCode(booking._id));
    expect(response.code).toBeNull();

    const confirmed = toFlightBookingResponse({
      ...booking,
      status: 'confirmed',
      paymentStatus: 'paid',
    });
    expect(confirmed.code).toBe('LT-FL-439011');
  });
});
