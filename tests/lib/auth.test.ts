process.env.JWT_SECRET = 'test-only-secret-must-be-32-chars!!';

import { describe, expect, it } from 'vitest';
import { signAuthToken, verifyAuthToken } from './auth';

describe('auth token helpers', () => {
  it('signs and verifies an auth token', async () => {
    const token = await signAuthToken({
      id: 'user_001',
      email: 'user@example.com',
      fullName: 'Test User',
      role: 'USER',
    });

    const user = await verifyAuthToken(token);

    expect(user).toEqual({
      id: 'user_001',
      email: 'user@example.com',
      fullName: 'Test User',
      role: 'USER',
    });
  });
});
