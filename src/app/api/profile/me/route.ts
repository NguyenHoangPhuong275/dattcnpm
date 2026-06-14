import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFull } from '@/lib/auth';
import { handleApiError, AppError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUserFull(request);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Missing authorization credentials or user is locked', 401);
    }

    const basicUser = {
      id: String(user._id),
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
