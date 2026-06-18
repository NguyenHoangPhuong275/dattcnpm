import { jwtVerify, SignJWT } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import type { User as PlainUser } from '@/lib/db';

const AUTH_COOKIE = 'auth_token';
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const AUTH_COOKIE_REMEMBER_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const USER_CACHE_TTL_SECONDS = 30;
const LEGACY_AUTH_COOKIES = ['token', 'session'];

export function getAuthMaxAge(rememberMe = false): number {
  return rememberMe ? AUTH_COOKIE_REMEMBER_MAX_AGE_SECONDS : AUTH_COOKIE_MAX_AGE_SECONDS;
}

export type AuthUser = Partial<PlainUser> & {
  id: string;
  email: string;
  fullName: string;
  role: 'USER' | 'ADMIN';
};

type AuthClaims = { userId: string; jti?: string; exp?: number };

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Biến môi trường JWT_SECRET là bắt buộc');
  }
  return new TextEncoder().encode(secret);
}

function authCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  };
}

export function setAuthCookie(response: NextResponse, token: string, maxAgeSeconds: number = AUTH_COOKIE_MAX_AGE_SECONDS): void {
  response.cookies.set(AUTH_COOKIE, token, authCookieOptions(maxAgeSeconds));
}

export function clearAuthCookies(response: NextResponse): void {
  const expiredOptions = { ...authCookieOptions(0), expires: new Date(0) };
  for (const name of [...LEGACY_AUTH_COOKIES, AUTH_COOKIE]) {
    response.cookies.set(name, '', expiredOptions);
  }
}

export async function signAuthToken(user: AuthUser, maxAgeSeconds: number = AUTH_COOKIE_MAX_AGE_SECONDS): Promise<string> {
  const expirationTime = Math.floor(Date.now() / 1000) + maxAgeSeconds;
  return new SignJWT({
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setJti(globalThis.crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(getSecret());
}

export async function verifyAuthToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const userId = payload.sub;
    if (!userId) return null;
    return {
      id: userId,
      email: typeof payload.email === 'string' ? payload.email : '',
      fullName: typeof payload.fullName === 'string' ? payload.fullName : '',
      role: payload.role === 'ADMIN' ? 'ADMIN' : 'USER',
    };
  } catch {
    return null;
  }
}

function extractToken(request: NextRequest): string | null {
  let token = request.cookies?.get(AUTH_COOKIE)?.value ?? null;

  if (!token) {
    const cookieHeader = request.headers.get('cookie') ?? '';
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${AUTH_COOKIE}=([^;]+)`));
    token = match ? decodeURIComponent(match[1]) : null;
  }

  if (!token) {
    const authHeader = request.headers.get('authorization') ?? '';
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
  }

  return token;
}

async function resolveAuthClaims(request: NextRequest): Promise<AuthClaims | null> {
  const token = extractToken(request);

  if (!token) {
    if (process.env.NODE_ENV === 'test') {
      const xUserId = request.headers.get('x-user-id');
      if (xUserId) return { userId: xUserId };
    }
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub) return null;
    return {
      userId: payload.sub,
      jti: typeof payload.jti === 'string' ? payload.jti : undefined,
      exp: typeof payload.exp === 'number' ? payload.exp : undefined,
    };
  } catch {
    return null;
  }
}

export async function getAuthUserId(request: NextRequest): Promise<string | null> {
  const claims = await resolveAuthClaims(request);
  return claims?.userId ?? null;
}

export async function revokeAuthToken(request: NextRequest): Promise<void> {
  const claims = await resolveAuthClaims(request);
  if (!claims?.jti) return;

  const nowSeconds = Math.floor(Date.now() / 1000);
  const ttl = claims.exp ? claims.exp - nowSeconds : 0;
  if (ttl <= 0) return;

  try {
    const { blacklistToken } = await import('@/lib/db');
    await blacklistToken(claims.jti, ttl);
  } catch {
  }
}

function userCacheKey(userId: string): string {
  return `user:full:${userId}`;
}

export async function invalidateUserCache(userId: string): Promise<void> {
  if (!userId) return;
  try {
    const { getRedis } = await import('@/lib/db');
    const redis = await getRedis();
    await redis.del(userCacheKey(userId));
  } catch {
  }
}

export async function getAuthUserFull(request: NextRequest): Promise<AuthUser | null> {
  const claims = await resolveAuthClaims(request);
  if (!claims) return null;
  const userId = claims.userId;

  if (claims.jti) {
    try {
      const { isTokenBlacklisted } = await import('@/lib/db');
      if (await isTokenBlacklisted(claims.jti)) return null;
    } catch {
    }
  }

  const cacheKey = userCacheKey(userId);

  try {
    const { getRedis } = await import('@/lib/db');
    const redis = await getRedis();
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed: AuthUser & { isLocked?: boolean; deletedAt?: unknown } = JSON.parse(cached);
      if (parsed.isLocked || parsed.deletedAt) return null;
      return parsed;
    }
  } catch {
  }

  const { getUserById } = await import('@/lib/db');
  const user = await getUserById(userId);
  if (!user || user.isLocked || user.deletedAt) return null;

  const result: AuthUser = {
    ...user,
    id: String(user._id ?? userId),
    email: user.email,
    fullName: user.fullName,
    role: user.role === 'ADMIN' ? 'ADMIN' : 'USER',
  };

  try {
    const { getRedis } = await import('@/lib/db');
    const redis = await getRedis();
    await redis.set(cacheKey, JSON.stringify(result), 'EX', USER_CACHE_TTL_SECONDS);
  } catch {
  }

  return result;
}

export const authCookieName = AUTH_COOKIE;
