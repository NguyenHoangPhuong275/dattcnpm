import { NextRequest } from 'next/server';
import { getUserById } from '@/lib/mongodb';
import { compare, hash } from 'bcryptjs';
import { User } from '@/lib/mongodb';
import { getAuthUserId } from '@/lib/auth';
import { passwordChangeSchema } from '@/lib/validations/auth';
import { sendSuccess, handleApiError, AppError } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials', 401);
    }

    const body = await request.json().catch(() => ({}));
    const parsed = passwordChangeSchema.parse(body);

    const user = await getUserById(userId);
    if (!user || !user.passwordHash) {
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
