import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { authCookieName, signAuthToken } from '@/lib/auth';
import { getDb, findUserByEmail } from '@/lib/mongodb';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { LoginSchema } from '@/lib/validations/validation';
import { handleApiError, AppError } from '@/lib/api-response';

function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(authCookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = LoginSchema.parse(body);

    const normalizedEmail = parsed.email;
    const password = parsed.password;

    const ip = getClientIp(request);
    const rate = await checkRateLimit({
      key: `rl:login:${ip}:${normalizedEmail}`,
      limit: 8,
      windowSeconds: 900,
    });

    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau.', 429);
    }

    if (
      process.env.ENABLE_DEFAULT_TEST_ACCOUNT === 'true'
      && normalizedEmail === (process.env.DEFAULT_TEST_EMAIL || '').toLowerCase().trim()
      && password === process.env.DEFAULT_TEST_PASSWORD
    ) {
      const user = {
        id: 'test-user-phuong',
        email: normalizedEmail,
        fullName: 'Nguyễn Hoàng Phương (Test)',
        role: 'USER' as const,
      };
      
      const token = await signAuthToken(user);
      const payload = { success: true, user };
      const response = NextResponse.json(payload);
      setAuthCookie(response, token);
      return response;
    }

    const user = await findUserByEmail(normalizedEmail);

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Email hoặc mật khẩu không chính xác', 401);
    }

    if (user.isLocked) {
      throw new AppError('FORBIDDEN', 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.', 403);
    }

    const isMatch = await compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('UNAUTHORIZED', 'Email hoặc mật khẩu không chính xác', 401);
    }

    const db = await getDb();
    await db.auditLogs.insertOne({
      userId: user._id,
      action: 'LOGIN',
      targetType: 'USER',
      targetId: user._id,
      metadata: { email: user.email, method: 'credentials' },
      createdAt: new Date(),
    });

    const responseUser = {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };
    
    const token = await signAuthToken(responseUser);
    const payload = { success: true, user: responseUser };
    const response = NextResponse.json(payload);
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
