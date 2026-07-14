import { NextRequest } from 'next/server';
import { compare } from 'bcryptjs';
import { getAuthMaxAge, setAuthCookie, signAuthToken } from '@/lib/auth';
import { getDb, findUserByEmail } from '@/lib/db';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { loginSchema } from '@/lib/validations/auth';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';

const DUMMY_PASSWORD_HASH = '$2b$12$UcxloMIgcOGbqH451uo4Au5TFjafb4Mt4m1oJO/cvTJY.EmpMv0p6';

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = loginSchema.parse(body);

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

    const user = await findUserByEmail(normalizedEmail);
    const isMatch = await compare(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);

    if (!user || user.deletedAt || !isMatch) {
      throw new AppError('UNAUTHORIZED', 'Email hoặc mật khẩu không chính xác', 401);
    }

    if (user.isLocked) {
      throw new AppError('FORBIDDEN', 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.', 403);
    }

    const db = await getDb();
    await db.auditLogs.insertOne({
      userId: user._id,
      action: 'LOGIN',
      targetType: 'USER',
      targetId: user._id,
      metadata: { email: user.email, method: 'credentials' },
      createdAt: new Date(),
    }).catch(() => {});

    const responseUser = {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };

    const maxAge = getAuthMaxAge(parsed.rememberMe);
    const token = await signAuthToken({
      ...responseUser,
      tokenVersion: user.tokenVersion ?? 0,
    }, maxAge);
    const response = sendSuccess({ user: responseUser });
    setAuthCookie(response, token, maxAge);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
