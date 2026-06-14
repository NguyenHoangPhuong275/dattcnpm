import type { AuthUser } from './auth';

export function getTestUser(overrides?: Partial<AuthUser>): AuthUser {
  return {
    id: process.env.TEST_USER_ID ?? 'test-user-id',
    email: process.env.TEST_USER_EMAIL ?? 'test@example.com',
    fullName: 'Test User',
    role: 'USER',
    ...overrides,
  };
}
