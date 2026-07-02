import { NextRequest } from 'next/server';
import { compare, hash } from 'bcryptjs';
import { User } from '@/lib/db';
import { getAuthUserFull, invalidateUserCache, revokeAuthToken } from '@/lib/auth';
import { passwordChangeSchema } from '@/lib/validations/auth';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials or user is locked', 401);
    }
    const userId = String(user._id);

    const rate = await checkRateLimit({
      key: `rl:change-password:${userId}`,
      limit: 10,
      windowSeconds: 300,
    });
    if (rate.limited) {
      throw new AppError('RATE_LIMITED', 'Bạn đã thử đổi mật khẩu quá nhiều lần. Vui lòng thử lại sau.', 429);
    }

    const body = await request.json().catch(() => ({}));
    const parsed = passwordChangeSchema.parse(body);

    if (!user.passwordHash) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy người dùng', 404);
    }

    const isMatch = await compare(parsed.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError('UNAUTHORIZED', 'Mật khẩu hiện tại không đúng', 401);
    }

    const newHash = await hash(parsed.newPassword, 12);

    await User.findByIdAndUpdate(userId, { $set: { passwordHash: newHash } });

    await revokeAuthToken(request);
    await invalidateUserCache(userId);

    return sendSuccess({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    return handleApiError(error);
  }
}
