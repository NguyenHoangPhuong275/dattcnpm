import { describe, expect, it } from 'vitest';
import { jwtVerify, decodeJwt } from 'jose';
import { signAuthToken, verifyAuthToken, verifyAuthTokenWithRefresh } from '@/lib/auth';

const OLD = 'old-secret-key-aaaaaaaaaaaaaaaaaaaaaaaa';
const NEW = 'new-secret-key-bbbbbbbbbbbbbbbbbbbbbbbb';
const user = { id: 'u1', email: 'a@b.com', fullName: 'A B', role: 'USER' as const };

describe('JWT secret rotation', () => {
  it('keeps single-key behavior unchanged (no refresh)', async () => {
    process.env.JWT_SECRET = OLD;
    const token = await signAuthToken(user);
    expect(await verifyAuthToken(token)).toMatchObject({ id: 'u1', email: 'a@b.com' });
    const res = await verifyAuthTokenWithRefresh(token);
    expect(res?.refreshedToken).toBeNull();
  });

  it('still verifies a token signed by an old key after rotation, and re-signs it', async () => {
    process.env.JWT_SECRET = OLD;
    const oldToken = await signAuthToken(user);

    process.env.JWT_SECRET = `${NEW},${OLD}`;

    expect(await verifyAuthToken(oldToken)).toMatchObject({ id: 'u1', email: 'a@b.com' });

    const res = await verifyAuthTokenWithRefresh(oldToken);
    expect(res).not.toBeNull();
    expect(res!.refreshedToken).toBeTruthy();

    const { payload } = await jwtVerify(res!.refreshedToken!, new TextEncoder().encode(NEW));
    expect(payload.sub).toBe('u1');
  });

  it('rejects a token whose key was fully rotated out', async () => {
    process.env.JWT_SECRET = OLD;
    const token = await signAuthToken(user);

    process.env.JWT_SECRET = NEW;
    expect(await verifyAuthToken(token)).toBeNull();
    expect(await verifyAuthTokenWithRefresh(token)).toBeNull();
  });

  it('preserves jti and exp when re-signing (session + blacklist intact)', async () => {
    process.env.JWT_SECRET = OLD;
    const oldToken = await signAuthToken(user);
    const oldClaims = decodeJwt(oldToken);

    process.env.JWT_SECRET = `${NEW},${OLD}`;
    const res = await verifyAuthTokenWithRefresh(oldToken);
    const newClaims = decodeJwt(res!.refreshedToken!);

    expect(newClaims.jti).toBe(oldClaims.jti);
    expect(newClaims.exp).toBe(oldClaims.exp);
    expect(newClaims.tokenVersion).toBe(oldClaims.tokenVersion);
  });

  it('trims whitespace and ignores empty entries in the key list', async () => {
    process.env.JWT_SECRET = OLD;
    const oldToken = await signAuthToken(user);
    process.env.JWT_SECRET = `  ${NEW} , , ${OLD}  `;
    expect(await verifyAuthToken(oldToken)).toMatchObject({ id: 'u1' });
  });
});
