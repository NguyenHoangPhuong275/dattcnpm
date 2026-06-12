import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthUserId } from '@/lib/auth';

const PROTECTED_PREFIXES = ['/profile', '/trips', '/schedule-reference'];

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (!isProtected) {
    return NextResponse.next();
  }

  const userId = await getAuthUserId(request);
  if (userId) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = '/';
  url.searchParams.set('auth', 'login');
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/profile/:path*', '/trips/:path*', '/schedule-reference/:path*'],
};
