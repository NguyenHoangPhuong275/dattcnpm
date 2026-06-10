import { NextRequest, NextResponse } from 'next/server';
import { authCookieName, verifyAuthToken } from '@/lib/auth';

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(authCookieName)?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/?auth=login', request.url));
  }

  try {
    await verifyAuthToken(token);
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL('/?auth=login', request.url));
    response.cookies.set(authCookieName, '', { maxAge: 0, path: '/' });
    return response;
  }
}

export const config = {
  matcher: ['/profile/:path*'],
};
