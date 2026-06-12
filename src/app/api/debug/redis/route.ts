import { NextResponse } from 'next/server';
import { connectRedis, getRedis } from '@/lib/redis';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

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
