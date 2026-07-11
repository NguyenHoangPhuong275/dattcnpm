import { NextRequest } from 'next/server';

import { hasAdminSession } from '@/lib/admin-auth';
import { getAuthUserFull } from '@/lib/auth';

export async function isAdminRequest(request: NextRequest): Promise<boolean> {
  if (await hasAdminSession(request)) return true;
  const user = await getAuthUserFull(request);
  return user?.role === 'ADMIN';
}
