export * from './schema';
export * from './mock-data';
export { MockDatabase, getMockDatabase, resetMockDatabase } from './mock-db';
export { MockRedis, getMockRedis, resetMockRedis } from './mock-redis';

import { getMockDatabase } from './mock-db';
import { getMockRedis } from './mock-redis';

export const mockDb = getMockDatabase();
export const mockRedis = getMockRedis();

export function resetAllMocks() {
  getMockDatabase().resetAll();
  getMockRedis().flushAll();
}

export function findMockUserByEmail(email: string) {
  return mockDb.users.findOne({ email: email.toLowerCase() } as Record<string, unknown>);
}
