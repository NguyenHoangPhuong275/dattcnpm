import { NextRequest } from 'next/server';
import { connectRedis, getRedis } from '@/lib/db';
import { debugGuard } from '@/lib/debug-guard';
import { AppError, handleApiError, sendSuccess } from '@/lib/api-response';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const guardResponse = debugGuard(request);
    if (guardResponse) return guardResponse;

    await connectRedis();
    const response = await getRedis().ping();

    return sendSuccess({
      connected: response === 'PONG',
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error instanceof AppError
      ? error
      : new AppError('INTERNAL_ERROR', 'Không thể kết nối Redis', 500, { connected: false }));
  }
}
