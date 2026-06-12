import { NextRequest, NextResponse } from 'next/server';
import { getUserById } from '@/lib/mongodb';
import { getAuthUserId } from '@/lib/auth';
import { handleApiError, AppError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials', 401);
    }

    const user = await getUserById(userId);
    if (!user) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy người dùng', 404);
    }

    const basicUser = {
      id: String(user._id || userId),
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      avatarUrl: user.avatarUrl || null,
    };

    return NextResponse.json(basicUser);
  } catch (error) {
    return handleApiError(error);
  }
}
