import { NextRequest } from 'next/server';
import { clearAuthCookies, getAuthUserId, invalidateUserCache, revokeAuthToken } from '@/lib/auth';
import { sendSuccess, handleApiError } from '@/lib/api-response';

export async function POST(request?: NextRequest) {
  try {
    const userId = request ? await getAuthUserId(request) : null;
    if (request) {
      await revokeAuthToken(request);
    }
    if (userId) {
      await invalidateUserCache(userId);
    }

    const response = sendSuccess({ message: 'Logged out' }, 'Logged out');
    clearAuthCookies(response);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
