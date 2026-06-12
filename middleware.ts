import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthUserId } from '@/lib/auth';

const PROTECTED_PREFIXES = ['/profile', '/trips', '/schedule-reference'];

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  const isTestEnv = process.env.NODE_ENV === 'test';
  const requestHeaders = new Headers(request.headers);
  if (!isTestEnv) {
    // Strip user-controlled trust headers to prevent spoofing
    requestHeaders.delete('x-user-id');
    requestHeaders.delete('x-forwarded-user');
  }

  if (pathname.startsWith('/api/debug')) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (!isProtected) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  const userId = await getAuthUserId(request);
  if (userId) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  const url = request.nextUrl.clone();
  url.pathname = '/';
  url.searchParams.set('auth', 'login');
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    '/profile/:path*',
    '/trips/:path*',
    '/schedule-reference/:path*',
    '/api/debug/:path*',
  ],
};
