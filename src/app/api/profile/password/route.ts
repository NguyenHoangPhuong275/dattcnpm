import { NextRequest } from 'next/server';
import { compare, hash } from 'bcryptjs';
import { getDb } from '@/lib/db';
import {
  getAuthMaxAge,
  getAuthUserFull,
  invalidateUserCache,
  resolveAuthWithRefresh,
  revokeAuthToken,
  setAuthCookie,
  signAuthToken,
} from '@/lib/auth';
import { passwordChangeSchema } from '@/lib/validations/auth';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn hoặc tài khoản đã bị khóa', 401);
    }
    const userId = String(user._id);
    const session = await resolveAuthWithRefresh(request);

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

    const db = await getDb();
    const currentUser = await db.users.findById(userId);
    if (!currentUser?.passwordHash) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy người dùng', 404);
    }

    const isMatch = await compare(parsed.currentPassword, currentUser.passwordHash);
    if (!isMatch) {
      throw new AppError('UNAUTHORIZED', 'Mật khẩu hiện tại không đúng', 401);
    }

    const newHash = await hash(parsed.newPassword, 12);

    const updatedUser = await db.users.findOneAndUpdate(
      { _id: userId, passwordHash: currentUser.passwordHash, deletedAt: null },
      {
        $set: { passwordHash: newHash, updatedAt: new Date() },
        $inc: { tokenVersion: 1 },
      },
    );
    if (!updatedUser) {
      throw new AppError('CONFLICT', 'Mật khẩu vừa được thay đổi. Vui lòng thử lại', 409);
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    const maxAge = typeof session?.expSeconds === 'number'
      ? Math.max(1, session.expSeconds - nowSeconds)
      : getAuthMaxAge();
    const token = await signAuthToken({
      id: userId,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      role: updatedUser.role,
      tokenVersion: updatedUser.tokenVersion,
    }, maxAge);

    await revokeAuthToken(request);
    await invalidateUserCache(userId);

    const response = sendSuccess({ message: 'Đổi mật khẩu thành công' });
    setAuthCookie(response, token, maxAge);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
