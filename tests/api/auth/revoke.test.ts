process.env.JWT_SECRET = 'test-only-secret-must-be-32-chars!!';

import { afterAll, describe, expect, it } from 'vitest';
import { jwtVerify } from 'jose';
import { signAuthToken, getAuthUserFull, revokeAuthToken } from '@/lib/auth';
import { isTokenBlacklisted, disconnectRedis } from '@/lib/db';

function requestWithToken(token: string) {
  return new Request('http://localhost/api/profile/me', {
    headers: { cookie: `auth_token=${token}` },
  }) as never;
}

describe('JWT revocation via blacklist', () => {
  afterAll(async () => {
    await disconnectRedis().catch(() => {});
  });

  it('revokeAuthToken đưa jti vào blacklist và getAuthUserFull từ chối token đã thu hồi', async () => {
    const token = await signAuthToken({
      id: '507f1f77bcf86cd799439011',
      email: 'revoke@example.com',
      fullName: 'Revoke Test',
      role: 'USER',
    });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const jti = payload.jti as string;
    expect(jti).toBeTruthy();

    expect(await isTokenBlacklisted(jti)).toBe(false);

    await revokeAuthToken(requestWithToken(token));

    expect(await isTokenBlacklisted(jti)).toBe(true);
    expect(await getAuthUserFull(requestWithToken(token))).toBeNull();
  });
});
