import { handleApiError, sendSuccess } from '@/lib/api-response';

export async function GET(): Promise<Response> {
  try {
    return sendSuccess({
      status: 'ok',
      service: 'smart-travel-guide',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
