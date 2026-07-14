import { NextRequest } from 'next/server';

import { setAdminCookie, signAdminSession } from '@/lib/admin-auth';
import { verifyAdminPassword } from '@/lib/admin-password';
import { AppError, handleApiError, sendSuccess } from '@/lib/api-response';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { adminLoginSchema } from '@/lib/validations/admin';

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json().catch(() => ({}));
    const { password } = adminLoginSchema.parse(body);
    const rate = await checkRateLimit({
      key: `rl:admin_login:${getClientIp(request)}`,
      limit: 8,
      windowSeconds: 900,
    });

    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau.', 429);
    }
    if (!process.env.ADMIN_PASSWORD && !process.env.ADMIN_PASSWORD_HASH) {
      throw new AppError('SERVICE_UNAVAILABLE', 'Đăng nhập quản trị tạm thời không khả dụng. Vui lòng liên hệ bộ phận phụ trách.', 503);
    }
    if (!await verifyAdminPassword(password)) {
      throw new AppError('UNAUTHORIZED', 'Mật khẩu quản trị không chính xác', 401);
    }

    const token = await signAdminSession();
    const response = sendSuccess({ authenticated: true });
    setAdminCookie(response, token);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
