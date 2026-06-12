import { jwtVerify, SignJWT } from 'jose';
import { NextRequest } from 'next/server';

const AUTH_COOKIE = 'auth_token';

type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: 'USER' | 'ADMIN';
};

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || 'dev-only-smart-travel-guide-secret-change-me';
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

export async function getAuthUserId(request: NextRequest): Promise<string | null> {
  const token = request.cookies?.get(AUTH_COOKIE)?.value;
  if (token) {
    try {
      const user = await verifyAuthToken(token);
      if (user?.id) return user.id;
    } catch {}
  }

  const headerUserId = request.headers.get('x-user-id');
  if (headerUserId) return headerUserId;

  return null;
}

export const authCookieName = AUTH_COOKIE;
