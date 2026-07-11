import { compare } from 'bcryptjs';

import { timingSafeEqualString } from '@/lib/crypto';

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const plainPassword = process.env.ADMIN_PASSWORD;
  if (plainPassword) return timingSafeEqualString(password, plainPassword);

  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!passwordHash) return false;
  return compare(password, passwordHash);
}
