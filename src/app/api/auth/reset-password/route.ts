import { NextRequest } from 'next/server';
import { hash } from 'bcryptjs';
import { getDb, findUserByEmail, verifyResetOtpAtomic } from '@/lib/db';
import { resetPasswordSchema } from '@/lib/validations/auth';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { invalidateUserCache } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const MAX_OTP_ATTEMPTS = 5;
const PASSWORD_HASH_ROUNDS = 12;

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = resetPasswordSchema.parse(body);
    const normalizedEmail = parsed.email;

    const ip = getClientIp(request);
    const ipRate = await checkRateLimit({
      key: `rl:reset-password:${ip}`,
      limit: 20,
      windowSeconds: 900,
    });
    if (ipRate.limited) {
      throw new AppError('RATE_LIMITED', 'Bạn đang yêu cầu quá nhanh. Vui lòng thử lại sau.', 429);
    }

    const verifyResult = await verifyResetOtpAtomic(normalizedEmail, parsed.otp, MAX_OTP_ATTEMPTS);

    if (verifyResult.status === 'expired') {
      throw new AppError('GONE', 'Mã xác minh không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu mã mới.', 410);
    }

    if (verifyResult.status === 'too_many') {
      throw new AppError('RATE_LIMITED', 'Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới.', 429);
    }

    if (verifyResult.status === 'wrong') {
      const remaining = Math.max(0, MAX_OTP_ATTEMPTS - verifyResult.attempts);
      throw new AppError('VALIDATION_ERROR', `Mã xác minh không đúng. Còn ${remaining} lần thử.`, 400);
    }

    const user = await findUserByEmail(normalizedEmail);
    if (!user || user.isLocked || user.deletedAt) {
      throw new AppError('GONE', 'Mã xác minh không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu mã mới.', 410);
    }

    const passwordHash = await hash(parsed.newPassword, PASSWORD_HASH_ROUNDS);
    const now = new Date();

    const db = await getDb();
    await db.users.updateOne(user._id, {
      $set: { passwordHash, updatedAt: now },
      $inc: { tokenVersion: 1 },
    });
    await invalidateUserCache(String(user._id));

    await db.auditLogs.insertOne({
      userId: user._id,
      action: 'RESET_PASSWORD',
      targetType: 'USER',
      targetId: user._id,
      metadata: { email: normalizedEmail, method: 'email_otp' },
      createdAt: now,
    }).catch(() => {});

    return sendSuccess({ message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới.' });
  } catch (error) {
    return handleApiError(error);
  }
}
