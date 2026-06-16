import { NextRequest, NextResponse } from 'next/server';
import { sendError } from '@/lib/api-response';

export function debugGuard(request: NextRequest): NextResponse | null {
  if (process.env.NODE_ENV !== 'development') {
    return sendError('NOT_FOUND', 'Not Found', 404);
  }
  const secret = process.env.DEBUG_SECRET;
  if (!secret || request.headers.get('x-debug-secret') !== secret) {
    return sendError('UNAUTHORIZED', 'Unauthorized', 401);
  }
  return null;
}
