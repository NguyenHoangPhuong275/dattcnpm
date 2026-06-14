import { NextRequest, NextResponse } from 'next/server';

export function debugGuard(request: NextRequest): NextResponse | null {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }
  const secret = process.env.DEBUG_SECRET;
  if (!secret || request.headers.get('x-debug-secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
