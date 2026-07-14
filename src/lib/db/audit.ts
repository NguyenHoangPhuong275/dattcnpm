import type { MongoId } from './schema';
import { getDb } from './connection';

export { AuditLog, AuditLogSchema, type IAuditLog } from './models/audit-log.model';

export async function createAuditLog(
  userId: MongoId | null,
  action: string,
  targetType: string,
  targetId?: MongoId | null,
  metadata?: Record<string, unknown>
) {
  const db = await getDb();
  return db.auditLogs.insertOne({
    userId: userId ?? null,
    action,
    targetType,
    targetId: targetId ?? null,
    metadata: metadata ?? {},
  });
}
