import { assertRunDatabaseUri } from './database-safety';

const runDatabaseUri = process.env.TEST_RUN_MONGODB_URI;
if (!runDatabaseUri) {
  throw new Error('TEST_RUN_MONGODB_URI was not initialized by the test global setup');
}

assertRunDatabaseUri(runDatabaseUri, 'test');
process.env.MONGODB_URI = runDatabaseUri;

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-123456';
}

if (!process.env.REDIS_URL) {
  process.env.REDIS_URL = 'redis://localhost:6379';
}
if (!process.env.WEBHOOK_SECRET) {
  process.env.WEBHOOK_SECRET = 'test-webhook-secret';
}
process.env.PAYMENT_MODE = 'demo';
if (!process.env.PAYMENT_BANK_CODE) {
  process.env.PAYMENT_BANK_CODE = 'VCB';
}
if (!process.env.PAYMENT_ACCOUNT_NO) {
  process.env.PAYMENT_ACCOUNT_NO = '0123456789';
}
if (!process.env.PAYMENT_ACCOUNT_NAME) {
  process.env.PAYMENT_ACCOUNT_NAME = 'LOTUS TRAVEL TEST';
}
