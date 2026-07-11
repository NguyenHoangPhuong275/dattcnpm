import { jwtVerify, SignJWT } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_COOKIE = 'admin_token';
const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET?.split(',')[0]?.trim();
  if (!secret) throw new Error('Biến môi trường JWT_SECRET là bắt buộc');
  return new TextEncoder().encode(secret);
}

export async function signAdminSession(): Promise<string> {
  return new SignJWT({ scope: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('environment-admin')
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE_SECONDS)
    .sign(getSecret());
}

export async function verifyAdminSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.sub === 'environment-admin' && payload.scope === 'admin';
  } catch {
    return false;
  }
}

function readAdminCookie(request: NextRequest): string | undefined {
  // Integration test gọi route với Request thường (không có .cookies) — fallback đọc header.
  if (request.cookies?.get) {
    return request.cookies.get(ADMIN_COOKIE)?.value;
  }
  const header = request.headers.get('cookie') ?? '';
  const match = header.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${ADMIN_COOKIE}=`));
  return match ? decodeURIComponent(match.slice(ADMIN_COOKIE.length + 1)) : undefined;
}

export async function hasAdminSession(request: NextRequest): Promise<boolean> {
  return verifyAdminSession(readAdminCookie(request));
}

export function setAdminCookie(response: NextResponse, token: string): void {
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });
}

export const adminCookieName = ADMIN_COOKIE;
