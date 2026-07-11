import { NextRequest } from 'next/server';
import { getAvatar } from '@/lib/db';
import { getAuthUserFull } from '@/lib/auth';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials or user is locked', 401);
    }

    let avatarUrl = user.avatarUrl || null;
    if (avatarUrl?.startsWith('redis:avatar:')) {
      try {
        avatarUrl = await getAvatar(String(user._id));
      } catch {
        avatarUrl = null;
      }
    }

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
