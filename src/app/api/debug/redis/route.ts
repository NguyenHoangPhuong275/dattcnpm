import { NextRequest } from 'next/server';
import { connectRedis, getRedis } from '@/lib/db';
import { debugGuard } from '@/lib/debug-guard';
import { sendSuccess, sendError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const guardRes = debugGuard(request);
  if (guardRes) return guardRes;

  try {
    await connectRedis();
    const response = await getRedis().ping();

    return sendSuccess({
      connected: response === 'PONG',
      response,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return sendError('INTERNAL_ERROR', 'Redis connection failed', { connected: false }, 500);
  }
}
