
import type { AuthUser } from './auth';

export function getTestUser(): AuthUser {
  return {
    id: process.env.TEST_USER_ID || '000000000000000000000001',
    email: (process.env.TEST_USER_EMAIL || 'test@example.com').toLowerCase().trim(),
    fullName: 'Test User',
    role: 'USER',
  };
}
