import { NextRequest } from 'next/server';
import { getDb, findUserByEmail, verifyOtpAtomic } from '@/lib/db';
import { hash } from 'bcryptjs';
import { verifyOtpSchema } from '@/lib/validations/auth';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { signAuthToken, setAuthCookie } from '@/lib/auth';

const MAX_OTP_ATTEMPTS = 5;
const PASSWORD_HASH_ROUNDS = 12;

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = verifyOtpSchema.parse(body);

    const normalizedEmail = parsed.email;

    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser) {
      throw new AppError('CONFLICT', 'Email này đã được đăng ký', 409);
    }

    const verifyResult = await verifyOtpAtomic(normalizedEmail, parsed.otp, MAX_OTP_ATTEMPTS);

    if (verifyResult.status === 'expired') {
      throw new AppError('GONE', 'Mã xác minh đã hết hạn. Vui lòng yêu cầu mã mới.', 410);
    }

    if (verifyResult.status === 'too_many') {
      throw new AppError('RATE_LIMITED', 'Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới.', 429);
    }

    if (verifyResult.status === 'wrong') {
      const remaining = Math.max(0, MAX_OTP_ATTEMPTS - verifyResult.attempts);
      throw new AppError('VALIDATION_ERROR', `Mã xác minh không đúng. Còn ${remaining} lần thử.`, 400);
    }

    const passwordHash = await hash(parsed.password, PASSWORD_HASH_ROUNDS);
    const now = new Date();

    const db = await getDb();
    const newUser = await db.users.insertOne({
      email: normalizedEmail,
      passwordHash,
      fullName: parsed.fullName.trim(),
      avatarUrl: null,
      role: 'USER',
      tokenVersion: 0,
      isLocked: false,
      emailVerified: true,
      emailVerifiedAt: now,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    await db.auditLogs.insertOne({
      userId: newUser._id,
      action: 'REGISTER',
      targetType: 'USER',
      targetId: newUser._id,
      metadata: { method: 'email_otp', email: normalizedEmail },
      createdAt: now,
    }).catch(() => {});

    const userForToken = {
      id: String(newUser._id),
      email: newUser.email,
      fullName: newUser.fullName,
      role: 'USER' as const,
      tokenVersion: newUser.tokenVersion ?? 0,
    };

    const token = await signAuthToken(userForToken);

    const response = sendSuccess({
      user: {
        id: userForToken.id,
        email: userForToken.email,
        fullName: userForToken.fullName,
      },
    });

    setAuthCookie(response, token);

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
