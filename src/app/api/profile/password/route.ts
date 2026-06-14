import { NextRequest } from 'next/server';
import { compare, hash } from 'bcryptjs';
import { User } from '@/lib/mongodb';
import { getAuthUserFull } from '@/lib/auth';
import { passwordChangeSchema } from '@/lib/validations/auth';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials or user is locked', 401);
    }
    const userId = String(user._id);

    const body = await request.json().catch(() => ({}));
    const parsed = passwordChangeSchema.parse(body);

    if (!user.passwordHash) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy người dùng', 404);
    }

    const isMatch = await compare(parsed.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError('UNAUTHORIZED', 'Mật khẩu hiện tại không đúng', 401);
    }

    const newHash = await hash(parsed.newPassword, 10);

    await User.findByIdAndUpdate(userId, { $set: { passwordHash: newHash } });

    return sendSuccess({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    return handleApiError(error);
  }
}
