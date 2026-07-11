import { randomUUID } from 'node:crypto';

export type IsolatedDatabaseKind = 'test' | 'e2e';

const BLOCKED_DATABASE_SEGMENTS = new Set([
  'admin',
  'config',
  'dev',
  'development',
  'live',
  'local',
  'prod',
  'production',
  'staging',
]);
const MAX_DATABASE_NAME_BYTES = 38;

type ParsedMongoUri = {
  prefix: string;
  databaseName: string;
  query: string;
};

function parseMongoUri(uri: string): ParsedMongoUri {
  const match = uri.match(/^(mongodb(?:\+srv)?:\/\/[^/?]+)(?:\/([^/?]*))?(\?.*)?$/);
  if (!match) {
    if (!/^mongodb(\+srv)?:\/\//.test(uri)) {
      throw new Error('MongoDB URI must use mongodb:// or mongodb+srv://');
    }
    throw new Error('MongoDB URI is invalid');
  }

  return {
    prefix: match[1],
    databaseName: decodeURIComponent(match[2] ?? ''),
    query: match[3] ?? '',
  };
}

export function getDatabaseName(uri: string): string {
  const { databaseName } = parseMongoUri(uri);
  if (!databaseName || databaseName.includes('/')) {
    throw new Error('MongoDB URI must include one explicit database name');
  }
  return databaseName;
}

function assertDatabaseMarker(databaseName: string, kind: IsolatedDatabaseKind): void {
  const segments = databaseName.toLowerCase().split(/[-_]+/);
  if (!segments.includes(kind)) {
    throw new Error(`Database name must contain an isolated ${kind} segment`);
  }
  if (segments.some((segment) => BLOCKED_DATABASE_SEGMENTS.has(segment))) {
    throw new Error('Database name contains an unsafe environment segment');
  }
}

export function createRunDatabaseUri(baseUri: string, kind: IsolatedDatabaseKind): string {
  const parsed = parseMongoUri(baseUri);
  const baseDatabaseName = getDatabaseName(baseUri);
  assertDatabaseMarker(baseDatabaseName, kind);

  const runId = randomUUID().replaceAll('-', '').slice(0, 10);
  const runDatabaseName = `${baseDatabaseName}_run_${runId}`;
  if (Buffer.byteLength(runDatabaseName, 'utf8') > MAX_DATABASE_NAME_BYTES) {
    throw new Error(`Isolated database name must not exceed ${MAX_DATABASE_NAME_BYTES} UTF-8 bytes`);
  }

  return `${parsed.prefix}/${encodeURIComponent(runDatabaseName)}${parsed.query}`;
}

export function assertRunDatabaseUri(uri: string, kind: IsolatedDatabaseKind): string {
  const databaseName = getDatabaseName(uri);
  assertDatabaseMarker(databaseName, kind);
  if (!/_run_[a-z0-9]{10}$/i.test(databaseName)) {
    throw new Error('Database name is not scoped to the current test run');
  }
  return databaseName;
}
