import mongoose from 'mongoose';

import { assertRunDatabaseUri } from '../tests/database-safety';

export default async function globalTeardown(): Promise<void> {
  const runDatabaseUri = process.env.E2E_RUN_MONGODB_URI;
  if (!runDatabaseUri) {
    throw new Error('E2E_RUN_MONGODB_URI is required for E2E cleanup');
  }

  const expectedDatabaseName = assertRunDatabaseUri(runDatabaseUri, 'e2e');
  const connection = mongoose.createConnection(runDatabaseUri, {
    serverSelectionTimeoutMS: 5000,
  });

  try {
    await connection.asPromise();
    if (connection.db?.databaseName !== expectedDatabaseName) {
      throw new Error('Refusing to clean a database outside the current E2E run');
    }
    await connection.dropDatabase();
  } finally {
    if (connection.readyState !== 0) {
      await connection.close();
    }
  }
}
