import { getAvatar } from '@/lib/db';

export async function resolveAvatarUrl(userId: string, storedValue?: string | null): Promise<string | null> {
  if (!storedValue) return null;
  if (!storedValue.startsWith('redis:avatar:')) return storedValue;

  try {
    return await getAvatar(userId);
  } catch {
    return null;
  }
}
