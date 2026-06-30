import { jwtVerify, SignJWT, type JWTPayload } from 'jose';
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

function getJwtSecretList(): string[] {
  const raw = process.env.JWT_SECRET;
  const keys = (raw ?? '').split(',').map((key) => key.trim()).filter(Boolean);
  if (keys.length === 0) {
    throw new Error('Biến môi trường JWT_SECRET là bắt buộc');
  }
  return keys;
}

function getSigningSecret(): Uint8Array {
  return new TextEncoder().encode(getJwtSecretList()[0]);
}

function getVerifySecrets(): Uint8Array[] {
  return getJwtSecretList().map((key) => new TextEncoder().encode(key));
}

async function verifyWithRotation(token: string): Promise<{ payload: JWTPayload; keyIndex: number } | null> {
  const secrets = getVerifySecrets();
  for (let i = 0; i < secrets.length; i++) {
    try {
      const { payload } = await jwtVerify(token, secrets[i]);
      return { payload, keyIndex: i };
    } catch {
    }
  }
  return null;
}

async function reSignFromPayload(payload: JWTPayload): Promise<string> {
  const builder = new SignJWT({
    email: payload.email,
    fullName: payload.fullName,
    role: payload.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(payload.sub))
    .setJti(typeof payload.jti === 'string' ? payload.jti : globalThis.crypto.randomUUID())
    .setIssuedAt();

  if (typeof payload.exp === 'number') {
    builder.setExpirationTime(payload.exp);
  }
  return builder.sign(getSigningSecret());
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
    .sign(getSigningSecret());
}

function payloadToAuthUser(payload: JWTPayload): AuthUser | null {
  const userId = payload.sub;
  if (!userId) return null;
  return {
    id: userId,
    email: typeof payload.email === 'string' ? payload.email : '',
    fullName: typeof payload.fullName === 'string' ? payload.fullName : '',
    role: payload.role === 'ADMIN' ? 'ADMIN' : 'USER',
  };
}

export async function verifyAuthToken(token: string): Promise<AuthUser | null> {
  const result = await verifyWithRotation(token);
  if (!result) return null;
  return payloadToAuthUser(result.payload);
}

export async function verifyAuthTokenWithRefresh(
  token: string,
): Promise<{ user: AuthUser; refreshedToken: string | null; expSeconds?: number } | null> {
  const result = await verifyWithRotation(token);
  if (!result) return null;
  const user = payloadToAuthUser(result.payload);
  if (!user) return null;

  const refreshedToken = result.keyIndex > 0 ? await reSignFromPayload(result.payload) : null;
  return {
    user,
    refreshedToken,
    expSeconds: typeof result.payload.exp === 'number' ? result.payload.exp : undefined,
  };
}

function extractToken(request: NextRequest): string | null {
  let token = request.cookies?.get(AUTH_COOKIE)?.value ?? null;

  if (!token) {
    const cookieHeader = request.headers.get('cookie') ?? '';
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${AUTH_COOKIE}=([^;]+)`));
    if (match) {
      try {
        token = decodeURIComponent(match[1]);
      } catch {
        token = null;
      }
    }
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

  const result = await verifyWithRotation(token);
  if (!result || !result.payload.sub) return null;
  return {
    userId: result.payload.sub,
    jti: typeof result.payload.jti === 'string' ? result.payload.jti : undefined,
    exp: typeof result.payload.exp === 'number' ? result.payload.exp : undefined,
  };
}

export async function resolveAuthWithRefresh(
  request: NextRequest,
): Promise<{ userId: string; refreshedToken: string | null; expSeconds?: number } | null> {
  const token = extractToken(request);
  if (!token) {
    if (process.env.NODE_ENV === 'test') {
      const xUserId = request.headers.get('x-user-id');
      if (xUserId) return { userId: xUserId, refreshedToken: null };
    }
    return null;
  }

  const result = await verifyAuthTokenWithRefresh(token);
  if (!result) return null;
  return { userId: result.user.id, refreshedToken: result.refreshedToken, expSeconds: result.expSeconds };
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
    const { cacheGet } = await import('@/lib/db');
    const cached = await cacheGet(cacheKey);
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
    const { cacheSet } = await import('@/lib/db');
    await cacheSet(cacheKey, JSON.stringify(result), USER_CACHE_TTL_SECONDS);
  } catch {
  }

  return result;
}

export const authCookieName = AUTH_COOKIE;
