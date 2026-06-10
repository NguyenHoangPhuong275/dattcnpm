import { NextResponse } from 'next/server';
import { authCookieName } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out',
  });

  response.cookies.set('token', '', { maxAge: 0, path: '/' });
  response.cookies.set('session', '', { maxAge: 0, path: '/' });
  response.cookies.set(authCookieName, '', { maxAge: 0, path: '/' });

  return response;
}
