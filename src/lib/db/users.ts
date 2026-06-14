import { getDb } from './connection';

export async function findUserByEmail(email: string) {
  const db = await getDb();
  return db.users.findOne({ email: email.toLowerCase() });
}
