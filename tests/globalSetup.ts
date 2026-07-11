import mongoose from 'mongoose';

import { loadEnv } from '../scripts/load-env';
import {
  assertRunDatabaseUri,
  createRunDatabaseUri,
} from './database-safety';

let runDatabaseUri: string | undefined;
let runDatabaseName: string | undefined;

export async function setup(): Promise<void> {
  loadEnv();
  const explicitTestUri = process.env.TEST_MONGODB_URI;
  if (!explicitTestUri) {
    throw new Error('TEST_MONGODB_URI is required and must target an isolated test database');
  }

  runDatabaseUri = createRunDatabaseUri(explicitTestUri, 'test');
  runDatabaseName = assertRunDatabaseUri(runDatabaseUri, 'test');
  process.env.TEST_RUN_MONGODB_URI = runDatabaseUri;
  process.env.MONGODB_URI = runDatabaseUri;
}

export async function teardown(): Promise<void> {
  if (!runDatabaseUri || !runDatabaseName) return;

  const connection = mongoose.createConnection(runDatabaseUri, {
    serverSelectionTimeoutMS: 5000,
  });
  try {
    await connection.asPromise();
    const connectedDatabaseName = connection.db?.databaseName;
    if (connectedDatabaseName !== runDatabaseName) {
      throw new Error('Refusing to clean a database outside the current test run');
    }
    await connection.dropDatabase();
  } catch (error) {
    if (!(error instanceof Error) || error.name !== 'MongooseServerSelectionError') {
      throw error;
    }
  } finally {
    if (connection.readyState !== 0) {
      await connection.close();
    }
  }
}
