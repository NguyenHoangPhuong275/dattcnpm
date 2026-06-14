import mongoose from 'mongoose';
import { connectMongo, resetConnectionState } from './connection';
import { MANAGED_COLLECTIONS, CollectionName } from './collections';

export async function listManagedCollections(): Promise<string[]> {
  await connectMongo();
  const db = mongoose.connection.db;
  if (!db) return [];
  const cols = await db.listCollections().toArray();
  return cols.map((c) => c.name).filter((name) => MANAGED_COLLECTIONS.includes(name as CollectionName));
}

export async function dropAllManagedCollections(): Promise<string[]> {
  await connectMongo();
  const db = mongoose.connection.db;
  if (!db) return [];

  const dropped: string[] = [];
  for (const name of MANAGED_COLLECTIONS) {
    try {
      await db.dropCollection(name);
      dropped.push(name);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: number }).code === 26) continue;
      throw err;
    }
  }
  resetConnectionState();
  return dropped;
}

export async function dropUnknownCollections(): Promise<string[]> {
  await connectMongo();
  const db = mongoose.connection.db;
  if (!db) return [];

  const cols = await db.listCollections().toArray();
  const known = new Set(MANAGED_COLLECTIONS);
  const dropped: string[] = [];

  for (const col of cols) {
    if (!known.has(col.name as CollectionName)) {
      try {
        await db.dropCollection(col.name);
        dropped.push(col.name);
      } catch (err: unknown) {
        if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: number }).code === 26) continue;
        throw err;
      }
    }
  }

  return dropped;
}

export async function hardResetDatabase(): Promise<void> {
  await dropAllManagedCollections();
  await dropUnknownCollections();
  resetConnectionState();
}

export async function createAllCollections(): Promise<string[]> {
  if (!mongoose.connection.db) {
    await connectMongo();
  }
  const db = mongoose.connection.db;
  if (!db) return [];

  const existing = (await db.listCollections().toArray()).map((c) => c.name);
  const created: string[] = [];

  for (const name of MANAGED_COLLECTIONS) {
    if (!existing.includes(name)) {
      await db.createCollection(name);
      created.push(name);
    }
  }

  return created;
}

export interface DatabaseConsistencyReport {
  expected: CollectionName[];
  actual: string[];
  exactMatch: string[];
  missing: CollectionName[];
  unknown: string[];
  possibleOldDuplicates: Array<{
    actual: string;
    expected?: CollectionName;
    reason: string;
  }>;
  isClean: boolean;
  recommendation: string;
}

export async function checkDatabaseConsistency(): Promise<DatabaseConsistencyReport> {
  await connectMongo();
  const db = mongoose.connection.db;

  const actual: string[] = db
    ? (await db.listCollections().toArray()).map((c) => c.name)
    : [];

  const expected = [...MANAGED_COLLECTIONS];
  const knownSet = new Set(expected);

  const exactMatch = actual.filter((name) => knownSet.has(name as CollectionName));
  const missing = expected.filter((name) => !actual.includes(name));
  const unknown = actual.filter((name) => !knownSet.has(name as CollectionName));

  const possibleOldDuplicates: DatabaseConsistencyReport['possibleOldDuplicates'] = [];

  const lowerActual = new Map(actual.map((n) => [n.toLowerCase(), n]));

  for (const exp of expected) {
    const lowerExp = exp.toLowerCase();
    if (lowerActual.has(lowerExp) && lowerActual.get(lowerExp) !== exp) {
      possibleOldDuplicates.push({
        actual: lowerActual.get(lowerExp)!,
        expected: exp,
        reason: 'case-insensitive match (old name likely still present)',
      });
    }
  }

  const legacyPatterns = [
    { old: 'itineraryitems', expected: 'itinerary_items' },
    { old: 'favoriteplaces', expected: 'favorite_places' },
    { old: 'tripbudgets', expected: 'trip_budgets' },
    { old: 'tripaccommodations', expected: 'trip_accommodations' },
    { old: 'tripchecklists', expected: 'trip_checklists' },
    { old: 'userpreferences', expected: 'user_preferences' },
    { old: 'userfollows', expected: 'user_follows' },
    { old: 'searchhistories', expected: 'search_histories' },
    { old: 'tripshares', expected: 'trip_shares' },
    { old: 'auditlogs', expected: 'audit_logs' },
  ];

  for (const { old, expected: exp } of legacyPatterns) {
    if (actual.includes(old) && !actual.includes(exp)) {
      possibleOldDuplicates.push({
        actual: old,
        expected: exp as CollectionName,
        reason: 'legacy implicit Mongoose plural name still exists',
      });
    }
  }

  for (const name of actual) {
    const lower = name.toLowerCase();
    for (const exp of expected) {
      if (lower === exp.toLowerCase() && name !== exp) {
        if (!possibleOldDuplicates.some((d) => d.actual === name)) {
          possibleOldDuplicates.push({
            actual: name,
            expected: exp,
            reason: 'different casing of a managed collection',
          });
        }
      }
    }
  }

  const isClean =
    missing.length === 0 &&
    unknown.length === 0 &&
    possibleOldDuplicates.length === 0;

  let recommendation = '';
  if (isClean) {
    recommendation = 'Database is consistent with current code. No old/duplicate collections detected.';
  } else {
    const actions: string[] = [];
    if (missing.length) actions.push(`Missing collections (will be created on first write): ${missing.join(', ')}`);
    if (unknown.length) actions.push(`Run webhook event "db.dropUnknown" or call dropUnknownCollections()`);
    if (possibleOldDuplicates.length) actions.push(`Old/duplicate names found — use "db.dropUnknown" or hard reset`);
    recommendation = actions.join(' | ');
  }

  return {
    expected,
    actual,
    exactMatch,
    missing,
    unknown,
    possibleOldDuplicates,
    isClean,
    recommendation,
  };
}
