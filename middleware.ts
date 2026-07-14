import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveAuthWithRefresh, setAuthCookie } from '@/lib/auth';
import { hasAdminSession } from '@/lib/admin-auth';
import { ROUTES } from '@/lib/constants';

const PROTECTED_PREFIXES = [ROUTES.admin, ROUTES.profile, ROUTES.trips, ROUTES.scheduleReference];

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  const isTestEnv = process.env.NODE_ENV === 'test';
  const requestHeaders = new Headers(request.headers);
  if (!isTestEnv) {
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

  if (pathname === ROUTES.adminLogin) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (pathname.startsWith(ROUTES.admin) && await hasAdminSession(request)) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const auth = await resolveAuthWithRefresh(request);
  if (auth) {
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    if (auth.refreshedToken) {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const maxAge = auth.expSeconds ? Math.max(0, auth.expSeconds - nowSeconds) : undefined;
      setAuthCookie(response, auth.refreshedToken, maxAge);
    }
    return response;
  }

  const url = request.nextUrl.clone();
  if (pathname.startsWith(ROUTES.admin)) {
    url.pathname = ROUTES.adminLogin;
    url.search = '';
  } else {
    url.pathname = ROUTES.home;
    url.searchParams.set('auth', 'login');
  }
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    '/profile/:path*',
    '/admin/:path*',
    '/trips/:path*',
    '/schedule-reference/:path*',
    '/api/debug/:path*',
  ],
};
