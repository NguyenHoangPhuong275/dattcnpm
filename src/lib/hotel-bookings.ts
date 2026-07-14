import { getResend } from '@/lib/resend';
import { escapeHtml } from '@/lib/html';
import { formatHotelPrice } from '@/lib/hotel-utils';
import { buildBookingPayment } from '@/lib/payment';
import type { HotelBooking } from '@/lib/db';

function getBookingCode(bookingId: string): string {
  return `LT-${bookingId.slice(-6).toUpperCase()}`;
}

export function getHotelBookingPaymentReference(bookingId: string): string {
  return `LT-TT-${bookingId.slice(-6).toUpperCase()}`;
}

export function toHotelBookingResponse(booking: HotelBooking, hotelName?: string | null, isAdmin = false) {
  const id = String(booking._id);
  const realCode = getBookingCode(id);
  const code = (isAdmin || (booking.status === 'confirmed' && booking.paymentStatus === 'paid'))
    ? realCode
    : null;
  return {
    id,
    code,
    hotelId: String(booking.hotelId),
    hotelName: hotelName ?? null,
    roomCode: booking.roomCode,
    roomName: booking.roomName,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    nights: booking.nights,
    guests: booking.guests,
    guestTitle: booking.guestTitle,
    guestName: booking.guestName,
    phone: booking.phone,
    contactEmail: booking.contactEmail,
    note: booking.note ?? null,
    pricePerNight: booking.pricePerNight,
    totalPrice: booking.totalPrice,
    currency: booking.currency,
    status: booking.status,
    paymentStatus: booking.paymentStatus ?? 'unpaid',
    paidAt: booking.paidAt ?? null,
    confirmedAt: booking.confirmedAt ?? null,
    createdAt: booking.createdAt,
    payment: buildBookingPayment(booking.totalPrice, getHotelBookingPaymentReference(id)),
  };
}

function formatEmailDate(value: Date): string {
  return new Date(value).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function detailRow(label: string, value: string): string {
  return `
            <tr>
              <td style="padding:8px 0;color:#64748b;font-size:14px;">${label}</td>
              <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:700;text-align:right;">${value}</td>
            </tr>`;
}

export type BookingEmailMode = 'received' | 'confirmed' | 'cancelled';

const EMAIL_COPY: Record<BookingEmailMode, { subtitle: string; intro: (hotel: string) => string }> = {
  received: {
    subtitle: 'Đã ghi nhận yêu cầu đặt phòng',
    intro: (hotel) =>
      `Yêu cầu đặt phòng của bạn tại <strong>${hotel}</strong> đã được ghi nhận và đang chờ xác nhận. Chúng tôi sẽ gửi email cập nhật trong thời gian sớm nhất.`,
  },
  confirmed: {
    subtitle: 'Xác nhận đặt phòng thành công',
    intro: (hotel) =>
      `Đặt phòng của bạn tại <strong>${hotel}</strong> đã được xác nhận. Vui lòng lưu mã đặt phòng dưới đây và xuất trình khi nhận phòng.`,
  },
  cancelled: {
    subtitle: 'Cập nhật yêu cầu đặt phòng',
    intro: (hotel) =>
      `Rất tiếc, yêu cầu đặt phòng của bạn tại <strong>${hotel}</strong> chưa thể được xác nhận. Bạn có thể chọn phòng khác hoặc thử lại vào thời gian khác.`,
  },
};

function buildBookingEmailHtml(booking: HotelBooking, hotelName: string, mode: BookingEmailMode): string {
  const code = getBookingCode(String(booking._id));
  const showCode = mode === 'confirmed'
    && booking.status === 'confirmed'
    && booking.paymentStatus === 'paid';
  const safeGuest = escapeHtml(`${booking.guestTitle} ${booking.guestName}`);
  const safeHotel = escapeHtml(hotelName);
  const copy = EMAIL_COPY[mode];
  const rows = [
    detailRow('Khách sạn', safeHotel),
    detailRow('Loại phòng', escapeHtml(booking.roomName)),
    detailRow('Nhận phòng', formatEmailDate(booking.checkIn)),
    detailRow('Trả phòng', formatEmailDate(booking.checkOut)),
    detailRow('Số đêm', `${booking.nights} đêm`),
    detailRow('Số khách', `${booking.guests} khách`),
    detailRow('Số điện thoại', escapeHtml(booking.phone)),
    detailRow('Tổng tiền', formatHotelPrice(booking.totalPrice)),
  ].join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8f6f7;font-family:'Be Vietnam Pro',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f6f7;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#6b87bd,#acc0eb);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">LOTUS TRAVEL</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">${copy.subtitle}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 8px;color:#0f172a;font-size:16px;">Xin chào <strong>${safeGuest}</strong>,</p>
            <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6;">
              ${copy.intro(safeHotel)}
            </p>
            ${showCode ? `<div style="text-align:center;margin:0 0 24px;">
              <div style="display:inline-block;background-color:#e9f2fb;border:2px solid #acc0eb;border-radius:12px;padding:14px 32px;letter-spacing:3px;font-size:26px;font-weight:700;color:#6b87bd;">${code}</div>
            </div>` : ''}
            <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e2e8f0;">${rows}</table>
            ${booking.note ? `<p style="margin:16px 0 0;color:#64748b;font-size:13px;">Ghi chú của bạn: ${escapeHtml(booking.note)}</p>` : ''}
            <p style="margin:24px 0 0;color:#64748b;font-size:13px;line-height:1.6;">
              Khách sạn có thể liên hệ bạn qua số điện thoại đã cung cấp để xác nhận thêm. Nếu bạn không thực hiện đặt phòng này, vui lòng bỏ qua email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;background-color:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">© ${new Date().getFullYear()} LOTUS TRAVEL. Mọi quyền được bảo lưu.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export type BookingEmailResult = 'sent' | 'skipped' | 'failed';

const EMAIL_SUBJECT_BY_MODE: Record<BookingEmailMode, string> = {
  received: 'Đã ghi nhận yêu cầu đặt phòng',
  confirmed: 'Xác nhận đặt phòng',
  cancelled: 'Cập nhật yêu cầu đặt phòng',
};

export function buildBookingEmailContent(
  booking: HotelBooking,
  hotelName: string,
  mode: BookingEmailMode,
): { subject: string; html: string } {
  const showCode = mode === 'confirmed'
    && booking.status === 'confirmed'
    && booking.paymentStatus === 'paid';
  const codePrefix = showCode ? `${getBookingCode(String(booking._id))} - ` : '';

  return {
    subject: `${codePrefix}${EMAIL_SUBJECT_BY_MODE[mode]} ${hotelName}`,
    html: buildBookingEmailHtml(booking, hotelName, mode),
  };
}

export async function sendBookingEmail(
  booking: HotelBooking,
  hotelName: string,
  mode: BookingEmailMode,
): Promise<BookingEmailResult> {
  if (process.env.NODE_ENV === 'test' || !process.env.API_KEY_RESEND) return 'skipped';

  try {
    const content = buildBookingEmailContent(booking, hotelName, mode);
    const result = await getResend().emails.send({
      from: 'LOTUS TRAVEL <no-reply@cybersafe.tokyo>',
      to: [booking.contactEmail],
      subject: content.subject,
      html: content.html,
    });
    return result.error ? 'failed' : 'sent';
  } catch {
    return 'failed';
  }
}
