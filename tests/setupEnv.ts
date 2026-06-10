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

const uri = process.env.MONGODB_URI;
if (uri) {
  const match = uri.match(/mongodb(?:\+srv)?:\/\/[^/]+\/([^?#\s]+)/);
  if (match) {
    const dbName = match[1];
    if (!dbName.includes('test')) {
      process.env.MONGODB_URI = uri.replace(`/${dbName}`, `/${dbName}_test`);
    }
  } else {
    process.env.MONGODB_URI = uri.replace(/\/([^/]*)$/, '/smart_travel_guide_test');
  }
}

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-123456';
}
