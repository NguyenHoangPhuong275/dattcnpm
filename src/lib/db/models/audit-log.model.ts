import { Schema, model, models, type Document, type Model, type Types } from 'mongoose';

import { COLLECTIONS } from '../collections';

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
