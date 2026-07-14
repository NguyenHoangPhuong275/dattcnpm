import { NextRequest } from 'next/server';

import { getDb, createAuditLog, type Hotel, type HotelBooking } from '@/lib/db';
import { enforceRateLimit, parseJsonBody, requireAuthUser, resolveObjectIdParam } from '@/lib/api-handler';
import { createHotelBookingSchema } from '@/lib/validations/booking';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { differenceInCalendarDays, getVietnamDateTimeParts, parseDateOnly } from '@/lib/date';
import { getHotelRoom } from '@/lib/hotel-rooms';
import { sendBookingEmail, toHotelBookingResponse } from '@/lib/hotel-bookings';

type RouteCtx = {
  params: Promise<{ id: string }>;
};

const MAX_NIGHTS = 30;

export async function POST(request: NextRequest, ctx: RouteCtx): Promise<Response> {
  try {
    const user = await requireAuthUser(request);
    const userId = String(user._id);

    await enforceRateLimit({
      key: `rl:create-booking:${userId}`,
      limit: 5,
      windowSeconds: 900,
      message: 'Bạn đang thao tác đặt phòng quá nhanh. Vui lòng thử lại sau.',
    });

    const id = await resolveObjectIdParam(ctx);

    const parsed = await parseJsonBody(request, createHotelBookingSchema);

    const db = await getDb();
    const hotel = (await db.hotels.findById(id)) as Hotel | null;
    if (!hotel) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy khách sạn', 404);
    }

    const room = getHotelRoom(
      { id, priceLevel: hotel.priceLevel ?? null, rating: hotel.rating ?? null },
      parsed.roomCode,
    );
    if (!room) {
      throw new AppError('VALIDATION_ERROR', 'Loại phòng không tồn tại ở khách sạn này', 400);
    }
    if (parsed.guests > room.capacity) {
      throw new AppError('VALIDATION_ERROR', `${room.name} tối đa ${room.capacity} khách`, 400);
    }

    const checkIn = parseDateOnly(parsed.checkIn)!;
    const checkOut = parseDateOnly(parsed.checkOut)!;
    const today = getVietnamDateTimeParts().date;
    if (parsed.checkIn < today) {
      throw new AppError('VALIDATION_ERROR', 'Ngày nhận phòng không được ở quá khứ', 400);
    }
    const nights = differenceInCalendarDays(parsed.checkIn, parsed.checkOut)!;
    if (nights <= 0) {
      throw new AppError('VALIDATION_ERROR', 'Ngày trả phòng phải sau ngày nhận phòng', 400);
    }
    if (nights > MAX_NIGHTS) {
      throw new AppError('VALIDATION_ERROR', `Chỉ hỗ trợ đặt tối đa ${MAX_NIGHTS} đêm`, 400);
    }

    const booking = (await db.hotelBookings.insertOne({
      hotelId: id,
      userId,
      roomCode: room.code,
      roomName: room.name,
      checkIn,
      checkOut,
      nights,
      guests: parsed.guests,
      guestTitle: parsed.guestTitle,
      guestName: parsed.guestName,
      phone: parsed.phone,
      contactEmail: parsed.contactEmail,
      note: parsed.note || null,
      pricePerNight: room.pricePerNight,
      totalPrice: room.pricePerNight * nights,
      currency: 'VND',
      status: 'pending',
      confirmedAt: null,
    })) as HotelBooking;

    const emailResult = await sendBookingEmail(booking, hotel.name, 'received');

    try {
      await createAuditLog(userId, 'CREATE_HOTEL_BOOKING', 'HOTEL_BOOKING', String(booking._id), {
        hotelId: id,
        roomCode: room.code,
        nights,
        emailResult,
      });
    } catch {}

    return sendSuccess(
      {
        booking: toHotelBookingResponse(booking, hotel.name),
        emailSent: emailResult === 'sent',
      },
      'Đã gửi yêu cầu đặt phòng. Quản trị viên sẽ xác nhận và gửi email cho bạn trong thời gian sớm nhất.',
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
