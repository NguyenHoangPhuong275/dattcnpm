import fs from 'node:fs';
import path from 'node:path';

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      value = value.trim();
      if (!process.env[key] && value) {
        process.env[key] = value;
      }
    }
  });
}

// Đổi DB sang tên *_test để không đụng dev. Thêm hậu tố theo VITEST_WORKER_ID để mỗi worker
// dùng database riêng → tránh flaky/race khi chạy song song nhiều file trên CI (Task 3, phương án A).
// Idempotent: strip hậu tố cũ trước khi gắn lại (setupFiles chạy nhiều lần trong cùng worker).
const uri = process.env.MONGODB_URI;
if (uri) {
  const workerId = process.env.VITEST_WORKER_ID;
  const suffix = `_test${workerId ? `_w${workerId}` : ''}`;
  const stripSuffix = (name: string) => name.replace(/_test(_w[\w-]+)?$/, '');
  const match = uri.match(/mongodb(?:\+srv)?:\/\/[^/]+\/([^?#\s]+)/);
  if (match) {
    const dbName = match[1];
    const base = stripSuffix(dbName);
    process.env.MONGODB_URI = uri.replace(`/${dbName}`, `/${base}${suffix}`);
  } else {
    process.env.MONGODB_URI = uri.replace(/\/([^/]*)$/, `/smart_travel_guide${suffix}`);
  }
}

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-123456';
}

if (!process.env.REDIS_URL) {
  process.env.REDIS_URL = 'redis://localhost:6379';
}
if (!process.env.WEBHOOK_SECRET) {
  process.env.WEBHOOK_SECRET = 'test-webhook-secret';
}
