import type { Connection } from 'mongoose';

import { MANAGED_COLLECTIONS } from './collections';

type ConnectedDatabase = NonNullable<Connection['db']>;

export async function createMissingManagedCollections(db: ConnectedDatabase): Promise<string[]> {
  const existing = (await db.listCollections().toArray()).map((collection) => collection.name);
  const created: string[] = [];

  for (const name of MANAGED_COLLECTIONS) {
    if (!existing.includes(name)) {
      await db.createCollection(name);
      created.push(name);
    }
  }

  return created;
}
