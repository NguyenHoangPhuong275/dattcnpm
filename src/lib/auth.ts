import { jwtVerify, SignJWT } from 'jose';
import { NextRequest } from 'next/server';

const AUTH_COOKIE = 'auth_token';

type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: 'USER' | 'ADMIN';
};

function getSecret() {
  const secret = process.env.JWT_SECRET || 'dev-only-smart-travel-guide-secret-change-me';
  return new TextEncoder().encode(secret);
}

export async function signAuthToken(user: AuthUser) {
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

export async function verifyAuthToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret());
  const userId = payload.sub;
  if (!userId) return null;
  return {
    id: userId,
    email: typeof payload.email === 'string' ? payload.email : '',
    fullName: typeof payload.fullName === 'string' ? payload.fullName : '',
    role: payload.role === 'ADMIN' ? 'ADMIN' : 'USER',
  };
}

export async function getAuthUserId(request: NextRequest) {
  const headerUserId = request.headers.get('x-user-id');
  if (headerUserId) return headerUserId;

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  try {
    const user = await verifyAuthToken(token);
    return user?.id || null;
  } catch {
    return null;
  }
}

export const authCookieName = AUTH_COOKIE;
