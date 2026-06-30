import { NextRequest } from 'next/server';
import { randomInt } from 'node:crypto';
import { getResend } from '@/lib/resend';
import { getRedis, getDb, findUserByEmail, storeResetOtp } from '@/lib/db';
import { forgotPasswordSchema } from '@/lib/validations/auth';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const OTP_TTL_SECONDS = 600;
const OTP_SEND_WINDOW_SECONDS = 900;
const OTP_SEND_LIMIT = 3;
const OTP_RANGE_EXCLUSIVE = 1_000_000;
const OTP_LENGTH = 6;

function generateOTP(): string {
  return randomInt(0, OTP_RANGE_EXCLUSIVE).toString().padStart(OTP_LENGTH, '0');
}

function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (name.length <= 2) return `${name[0]}***@${domain}`;
  return `${name[0]}${name[1]}${'*'.repeat(Math.min(name.length - 2, 6))}@${domain}`;
}

function buildResetEmailHTML(otp: string, fullName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f7fc;font-family:'Be Vietnam Pro',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fc;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(172,192,235,0.12);">
          <tr>
            <td style="background: linear-gradient(135deg, #6b87bd, #acc0eb);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">LOTUS TRAVEL</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Đặt lại mật khẩu</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 16px;color:#0f172a;font-size:16px;">Xin chào <strong>${fullName}</strong>,</p>
              <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6;">
                Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng dùng mã xác minh bên dưới để tiếp tục:
              </p>
              <div style="text-align:center;margin:0 0 24px;">
                <div style="display:inline-block;background-color:#f4f7fc;border:2px solid #acc0eb;border-radius:12px;padding:16px 32px;letter-spacing:8px;font-size:32px;font-weight:700;color:#0f172a;">
                  ${otp}
                </div>
              </div>
              <p style="margin:0 0 8px;color:#64748b;font-size:13px;text-align:center;">
                Mã có hiệu lực trong <strong>10 phút</strong>.
              </p>
              <p style="margin:0;color:#64748b;font-size:13px;text-align:center;">
                Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;background-color:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">© 2026 LOTUS TRAVEL - Đồ án Thực tế CNPM</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = forgotPasswordSchema.parse(body);
    const normalizedEmail = parsed.email;

    const ip = getClientIp(request);
    const ipRate = await checkRateLimit({
      key: `rl:forgot-password:${ip}`,
      limit: 20,
      windowSeconds: 900,
    });
    if (ipRate.limited) {
      throw new AppError('RATE_LIMITED', 'Bạn đang yêu cầu quá nhanh. Vui lòng thử lại sau.', 429);
    }

    const redis = getRedis();
    const sendLimitKey = `otp:reset:limit:${normalizedEmail}`;
    const currentCount = await redis.incr(sendLimitKey);
    if (currentCount === 1) {
      await redis.expire(sendLimitKey, OTP_SEND_WINDOW_SECONDS);
    }
    if (currentCount > OTP_SEND_LIMIT) {
      throw new AppError('RATE_LIMITED', 'Bạn đã yêu cầu quá nhiều mã. Vui lòng thử lại sau 15 phút.', 429);
    }

    const user = await findUserByEmail(normalizedEmail);

    if (user && !user.isLocked && !user.deletedAt) {
      const otp = generateOTP();
      await storeResetOtp(normalizedEmail, otp, OTP_TTL_SECONDS);

      const db = await getDb();
      await db.auditLogs.insertOne({
        userId: user._id,
        action: 'FORGOT_PASSWORD',
        targetType: 'USER',
        targetId: user._id,
        metadata: { email: normalizedEmail, status: 'otp_generated' },
        createdAt: new Date(),
      });

      const resend = getResend();
      await resend.emails.send({
        from: 'LOTUS TRAVEL <no-reply@cybersafe.tokyo>',
        to: [normalizedEmail],
        subject: `${otp} - Mã đặt lại mật khẩu LOTUS TRAVEL`,
        html: buildResetEmailHTML(otp, user.fullName),
      });
    }

    return sendSuccess({
      maskedEmail: maskEmail(normalizedEmail),
      message: 'Nếu email tồn tại trong hệ thống, mã đặt lại mật khẩu đã được gửi.',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
