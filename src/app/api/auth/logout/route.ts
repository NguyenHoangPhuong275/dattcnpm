import { NextResponse } from 'next/server';
import { authCookieName } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out',
  });

  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  };

  response.cookies.set('token', '', cookieOptions);
  response.cookies.set('session', '', cookieOptions);
  response.cookies.set(authCookieName, '', cookieOptions);

  return response;
}
