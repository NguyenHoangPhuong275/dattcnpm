import { NextRequest } from 'next/server';
import { getAuthUserFull } from '@/lib/auth';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { resolveAvatarUrl } from '@/lib/avatar';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Phiên đăng nhập không hợp lệ hoặc tài khoản đã bị khóa', 401);
    }

    const avatarUrl = await resolveAvatarUrl(String(user._id), user.avatarUrl);

    const basicUser = {
      id: String(user._id),
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      avatarUrl,
    };

    return sendSuccess(basicUser);
  } catch (error) {
    return handleApiError(error);
  }
}
