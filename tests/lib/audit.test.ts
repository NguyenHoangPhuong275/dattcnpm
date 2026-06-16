import { afterAll, describe, expect, it } from 'vitest';

import { createAuditLog } from '@/lib/db/audit';
import { disconnectMongo, getDb } from '@/lib/db';

describe('createAuditLog', () => {
  afterAll(async () => {
    await disconnectMongo?.().catch(() => {});
  });

  it('preserves nullable userId and targetId as null', async () => {
    const created = await createAuditLog(null, 'TEST_AUDIT_NULL', 'TEST', null, {
      source: 'unit-test',
    });

    try {
      expect(created.userId).toBeNull();
      expect(created.targetId).toBeNull();
      expect(created.metadata).toEqual({ source: 'unit-test' });
    } finally {
      const db = await getDb();
      await db.auditLogs.deleteOne(created._id);
    }
  });
});
