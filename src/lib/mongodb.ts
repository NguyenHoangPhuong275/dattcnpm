import { getMockDatabase, resetMockDatabase, MockDatabase } from '../database/mock-db';
import type { MongoId } from '../database/schema';

export const db = getMockDatabase(true);

export function getDb(): MockDatabase {
  return getMockDatabase();
}

export function resetDb() {
  return resetMockDatabase();
}

export async function connectMongo(): Promise<'connected'> {

  console.log('[MOCK] MongoDB connected (in-memory)');
  return 'connected';
}

export async function disconnectMongo(): Promise<void> {
  console.log('[MOCK] MongoDB disconnected');
}

export async function findUserByEmail(email: string) {
  const database = getDb();
  return database.users.findOne({ email: email.toLowerCase() } as any);
}

export async function createAuditLog(
  userId: MongoId | null,
  action: string,
  targetType: string,
  targetId?: MongoId,
  metadata?: Record<string, unknown>
) {
  const database = getDb();
  return database.auditLogs.insertOne({
    userId: userId || undefined,
    action,
    targetType,
    targetId,
    metadata,
    createdAt: new Date(),
  } as any);
}
