export * from './schema';
export * from './mock-data';
export { MockDatabase, getMockDatabase, resetMockDatabase } from './mock-db';
export { MockRedis, getMockRedis, resetMockRedis } from './mock-redis';

import { getMockDatabase } from './mock-db';
import { getMockRedis } from './mock-redis';

if (process.env.NODE_ENV === 'production') {
  
  
  console.warn('[database] Mock database layer loaded in production. This should not happen.');
}

export const mockDb = getMockDatabase();
export const mockRedis = getMockRedis();

export function resetAllMocks() {
  getMockDatabase().resetAll();
  getMockRedis().flushAll();
}

export function findMockUserByEmail(email: string) {
  return mockDb.users.findOne({ email: email.toLowerCase() } as Record<string, unknown>);
}
