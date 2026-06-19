import mongoose from 'mongoose';
import { loadEnv } from './load-env';

/**
 * Migration: chuyển unique index email toàn cục → partial unique index (chỉ áp dụng khi deletedAt = null).
 * Cho phép user đã soft-delete đăng ký lại bằng chính email đó.
 *
 * An toàn để chạy lại (idempotent). Chạy:
 *   npx tsx scripts/migrate-user-email-partial-index.ts            # dry-run (chỉ in kế hoạch)
 *   npx tsx scripts/migrate-user-email-partial-index.ts --apply    # thực thi
 */

const COLLECTION = 'users';
const PARTIAL_INDEX_NAME = 'email_1_active_unique';

async function main(): Promise<void> {
  loadEnv();
  const apply = process.argv.includes('--apply');
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('Thiếu MONGODB_URI trong môi trường. Hủy migration.');
    process.exitCode = 2;
    return;
  }

  await mongoose.connect(uri);
  try {
    const coll = mongoose.connection.collection(COLLECTION);
    const indexes = await coll.indexes();

    const legacy = indexes.find(
      (idx) =>
        idx.unique &&
        idx.key &&
        Object.keys(idx.key).length === 1 &&
        (idx.key as Record<string, unknown>).email === 1 &&
        !idx.partialFilterExpression,
    );

    const partialExists = indexes.some(
      (idx) =>
        idx.unique &&
        idx.key &&
        (idx.key as Record<string, unknown>).email === 1 &&
        idx.partialFilterExpression,
    );

    console.log(`Collection "${COLLECTION}" — ${apply ? 'APPLY' : 'DRY-RUN'}`);
    console.log(`Index unique cũ trên email: ${legacy ? legacy.name : 'không có'}`);
    console.log(`Partial unique index đã tồn tại: ${partialExists ? 'có' : 'chưa'}`);

    if (!apply) {
      console.log('\nKế hoạch:');
      if (legacy) console.log(`  - DROP index "${legacy.name}"`);
      if (!partialExists) {
        console.log(`  - CREATE partial unique index "${PARTIAL_INDEX_NAME}" { email: 1 } partial { deletedAt: null }`);
      }
      console.log('\nChạy lại với --apply để thực thi.');
      return;
    }

    if (legacy) {
      await coll.dropIndex(legacy.name as string);
      console.log(`Đã DROP index "${legacy.name}".`);
    }

    if (!partialExists) {
      await coll.createIndex(
        { email: 1 },
        { unique: true, partialFilterExpression: { deletedAt: null }, name: PARTIAL_INDEX_NAME },
      );
      console.log(`Đã CREATE partial unique index "${PARTIAL_INDEX_NAME}".`);
    }

    console.log('Migration hoàn tất.');
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error('Migration thất bại:', error instanceof Error ? error.message : String(error));
  process.exitCode = 2;
});
