import { jwtVerify, SignJWT } from 'jose';
import { NextRequest } from 'next/server';
import type { User as PlainUser } from '@/database/schema';
import { getUserById } from './mongodb';

const AUTH_COOKIE = 'auth_token';

export type AuthUser = Partial<PlainUser> & {
  id: string;
  email: string;
  fullName: string;
  role: 'USER' | 'ADMIN';
};

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Biến môi trường JWT_SECRET là bắt buộc');
  }
  return new TextEncoder().encode(secret);
}

export async function signAuthToken(user: AuthUser): Promise<string> {
  return new SignJWT({
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('7d')
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


export async function getAuthUserId(request: NextRequest): Promise<string | null> {
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

  if (!token && process.env.NODE_ENV === 'test') {
    const xUserId = request.headers.get('x-user-id');
    if (xUserId) return xUserId;
  }

  if (!token) return null;
  const user = await verifyAuthToken(token);
  return user?.id ?? null;
}


export async function getAuthUserFull(request: NextRequest): Promise<AuthUser | null> {
  const userId = await getAuthUserId(request);
  if (!userId) return null;
  const user = await getUserById(userId);
  if (!user || user.isLocked) return null;
  return {
    ...user,
    id: String(user._id || userId),
    email: user.email,
    fullName: user.fullName,
    role: user.role === 'ADMIN' ? 'ADMIN' : 'USER',
  };
}

export const authCookieName = AUTH_COOKIE;
