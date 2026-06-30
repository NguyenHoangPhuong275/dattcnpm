import type { AppDatabase } from '@/lib/db';

export async function pruneSearchHistory(db: AppDatabase, userId: string, keep = 50): Promise<void> {
  const recent = await db.searchHistories.find(
    { userId },
    { sortBy: 'createdAt', sortOrder: -1, limit: keep }
  );
  if (recent.length < keep) return;
  const cutoff = (recent[recent.length - 1] as { createdAt: Date }).createdAt;
  await db.searchHistories.deleteMany({ userId, createdAt: { $lt: cutoff } });
}
