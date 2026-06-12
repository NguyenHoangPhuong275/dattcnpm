import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';
import { getDb, findUserByEmail } from '@/lib/mongodb';
import { hash } from 'bcryptjs';
import { VerifyOtpSchema } from '@/lib/validations/validation';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { signAuthToken, authCookieName } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = VerifyOtpSchema.parse(body);

    const normalizedEmail = parsed.email;

    if (process.env.ENABLE_DEFAULT_TEST_ACCOUNT === 'true' &&
        normalizedEmail === (process.env.DEFAULT_TEST_EMAIL || '').toLowerCase().trim()) {

      const userForToken = {
        id: 'test-user-phuong',
        email: normalizedEmail,
        fullName: parsed.fullName.trim(),
        role: 'USER' as const,
      };

      const token = await signAuthToken(userForToken);

      const response = NextResponse.json({
        success: true,
        user: {
          id: userForToken.id,
          email: userForToken.email,
          fullName: userForToken.fullName,
        },
      });

      response.cookies.set(authCookieName, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser) {
      throw new AppError('CONFLICT', 'Email này đã được đăng ký', 409);
    }

    const redis = getRedis();
    const otpKey = `otp:${normalizedEmail}`;
    const storedRaw = await redis.get(otpKey);

    if (!storedRaw) {
      throw new AppError('GONE', 'Mã xác minh đã hết hạn. Vui lòng yêu cầu mã mới.', 410);
    }

    const stored = JSON.parse(storedRaw) as { otp: string; attempts: number };

    if (stored.attempts >= 5) {
      await redis.del(otpKey);
      throw new AppError('RATE_LIMITED', 'Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới.', 429);
    }

    if (stored.otp !== parsed.otp) {
      stored.attempts += 1;

      await redis.set(otpKey, JSON.stringify(stored), 'EX', 86400);

      const remaining = 5 - stored.attempts;
      throw new AppError('VALIDATION_ERROR', `Mã xác minh không đúng. Còn ${remaining} lần thử.`, 400);
    }

    const passwordHash = await hash(parsed.password, 12);
    const now = new Date();

    const db = await getDb();
    const newUser = await db.users.insertOne({
      email: normalizedEmail,
      passwordHash,
      fullName: parsed.fullName.trim(),
      avatarUrl: null,
      role: 'USER',
      isLocked: false,
      emailVerified: true,
      emailVerifiedAt: now,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    await redis.del(otpKey);

    await db.auditLogs.insertOne({
      userId: newUser._id,
      action: 'REGISTER',
      targetType: 'USER',
      targetId: newUser._id,
      metadata: { method: 'email_otp', email: normalizedEmail },
      createdAt: now,
    });

    const userForToken = {
      id: String(newUser._id),
      email: newUser.email,
      fullName: newUser.fullName,
      role: 'USER' as const,
    };

    const token = await signAuthToken(userForToken);

    const response = NextResponse.json({
      success: true,
      user: {
        id: userForToken.id,
        email: userForToken.email,
        fullName: userForToken.fullName,
      },
    });

    response.cookies.set(authCookieName, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
