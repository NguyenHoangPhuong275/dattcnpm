import { NextRequest, NextResponse } from 'next/server';
import { connectRedis, getRedis } from '@/lib/redis';
import { debugGuard } from '@/lib/debug-guard';

export async function GET(request: NextRequest) {
  const guardRes = debugGuard(request);
  if (guardRes) return guardRes;

  try {
    await connectRedis();
    const response = await getRedis().ping();

    return NextResponse.json({
      status: 'success',
      connected: response === 'PONG',
      response,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({
      status: 'error',
      connected: false,
      message: 'Redis connection failed',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
