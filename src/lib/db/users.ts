import { getDb } from './connection';
import { normalizeEmail } from '@/lib/string';

export async function findUserByEmail(email: string) {
  const db = await getDb();
  return db.users.findOne({ email: normalizeEmail(email), deletedAt: null });
}
