import { Schema, model, models, type Document, type Model, type Types } from 'mongoose';

import type { MongoId } from '@/database/schema';
import { COLLECTIONS } from './collections';
import { getDb } from './connection';

export interface IAuditLog extends Document {
  userId?: Types.ObjectId | null;
  action: string;
  targetType: string;
  targetId?: Types.ObjectId | null;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export const AuditLogSchema = new Schema<IAuditLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  action: { type: String, required: true },
  targetType: { type: String, required: true },
  targetId: { type: Schema.Types.ObjectId, default: null },
  metadata: { type: Object, default: {} },
}, { timestamps: { createdAt: true, updatedAt: false }, collection: COLLECTIONS.auditLogs });

export const AuditLog: Model<IAuditLog> = models.AuditLog || model<IAuditLog>('AuditLog', AuditLogSchema);

export async function createAuditLog(
  userId: MongoId | null,
  action: string,
  targetType: string,
  targetId?: MongoId,
  metadata?: Record<string, unknown>
) {
  const db = await getDb();
  return db.auditLogs.insertOne({
    userId: userId || undefined,
    action,
    targetType,
    targetId: targetId || undefined,
    metadata: metadata || {},
  });
}
