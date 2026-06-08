import { NextRequest, NextResponse } from 'next/server';
import { getResend } from '@/lib/resend';
import { getRedis } from '@/lib/redis';
import { getDb, findUserByEmail } from '@/lib/mongodb';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (name.length <= 2) return `${name[0]}***@${domain}`;
  return `${name[0]}${name[1]}${'*'.repeat(Math.min(name.length - 2, 6))}@${domain}`;
}

function buildEmailHTML(otp: string, fullName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f7fc;font-family: var(--font-inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fc;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(172,192,235,0.12);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6b87bd, #acc0eb);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">LOTUS TRAVEL</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Xác minh địa chỉ email</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 16px;color:#0f172a;font-size:16px;">Xin chào <strong>${fullName}</strong>,</p>
              <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6;">
                Cảm ơn bạn đã đăng ký tài khoản. Vui lòng sử dụng mã xác minh bên dưới để hoàn tất quá trình đăng ký:
              </p>
              <!-- OTP Box -->
              <div style="text-align:center;margin:0 0 24px;">
                <div style="display:inline-block;background-color:#f4f7fc;border:2px solid #acc0eb;border-radius:12px;padding:16px 32px;letter-spacing:8px;font-size:32px;font-weight:700;color:#0f172a;">
                  ${otp}
                </div>
              </div>
              <p style="margin:0 0 8px;color:#64748b;font-size:13px;text-align:center;">
                Mã có hiệu lực trong <strong>10 phút</strong>.
              </p>
              <p style="margin:0;color:#64748b;font-size:13px;text-align:center;">
                Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;background-color:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">© 2026 LOTUS TRAVEL — Đồ án Thực tế CNPM</p>
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
    const body = await request.json();
    const { email, fullName } = body;

    if (!email || typeof email !== 'string' || !/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json(
        { error: 'Email không hợp lệ' },
        { status: 400 }
      );
    }

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Họ và tên không hợp lệ' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (process.env.ENABLE_DEFAULT_TEST_ACCOUNT === 'true' &&
        normalizedEmail === (process.env.DEFAULT_TEST_EMAIL || '').toLowerCase().trim()) {
      return NextResponse.json({
        success: true,
        maskedEmail: maskEmail(normalizedEmail),
      });
    }

    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email này đã được đăng ký' },
        { status: 409 }
      );
    }

    const redis = getRedis();
    const rateLimitKey = `otp:limit:${normalizedEmail}`;
    const currentCount = await redis.incr(rateLimitKey);
    await redis.expire(rateLimitKey, 600);

    if (currentCount > 3) {
      return NextResponse.json(
        { error: 'Bạn đã gửi quá nhiều mã xác minh. Vui lòng thử lại sau 10 phút.' },
        { status: 429 }
      );
    }

    const otp = generateOTP();
    const otpKey = `otp:${normalizedEmail}`;

    await redis.set(otpKey, JSON.stringify({ otp, attempts: 0 }), 'EX', 86400);

    console.log(`[SERVER] Generated OTP for ${normalizedEmail}: ${otp}`);

    const db = await getDb();
    await db.auditLogs.insertOne({
      userId: undefined,
      action: 'SEND_OTP',
      targetType: 'OTP',
      targetId: undefined,
      metadata: { email: normalizedEmail, status: 'generated' },
      createdAt: new Date(),
    });

    const resend = getResend();
    const { error: sendError } = await resend.emails.send({
      from: 'LOTUS TRAVEL <no-reply@cybersafe.tokyo>',
      to: [normalizedEmail],
      subject: `${otp} — Mã xác minh LOTUS TRAVEL`,
      html: buildEmailHTML(otp, fullName.trim()),
    });

    if (sendError) {
      console.error('[send-otp] Resend error:', sendError);
      return NextResponse.json(
        { error: 'Không thể gửi email xác minh. Vui lòng thử lại sau.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      maskedEmail: maskEmail(normalizedEmail),
    });
  } catch (err) {
    console.error('[send-otp] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi, vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
