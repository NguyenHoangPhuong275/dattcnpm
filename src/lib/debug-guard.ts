import { NextRequest, NextResponse } from 'next/server';

export function guardDebugRoute(request: NextRequest): NextResponse | null {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  const expectedSecret = process.env.DEBUG_SECRET;
  const providedSecret = request.headers.get('x-debug-secret');
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}

export const debugGuard = guardDebugRoute;
