import mongoose from 'mongoose';
import { loadEnv } from './load-env';

/**
 * Migration: unique index { tripId, label } cho trip_checklists, dùng collation
 * case-insensitive + Unicode-normalized (locale 'vi', strength 2, normalization true) để chống
 * tạo item trùng nhãn khác hoa/thường HOẶC khác dạng Unicode (NFC/NFD) khi race condition.
 *
 * CẢNH BÁO PRODUCTION: đổi collation = DROP index cũ rồi CREATE lại → có khoảng thời gian
 * ngắn KHÔNG enforce uniqueness. BẮT BUỘC chạy trong maintenance window + đã backup.
 *
 *   npx tsx scripts/migrate-checklist-unique-index.ts                       # dry-run + kiểm tra trùng
 *   npx tsx scripts/migrate-checklist-unique-index.ts --apply --i-have-backup
 *
 * Rollback nếu CREATE lại thất bại: tạo lại index không-collation tạm thời để khôi phục enforce:
 *   db.trip_checklists.createIndex({ tripId: 1, label: 1 }, { unique: true, sparse: true })
 * rồi điều tra dữ liệu trùng trước khi thử lại migration.
 */

const COLLECTION = 'trip_checklists';
const INDEX_NAME = 'tripId_1_label_1';
const COLLATION = { locale: 'vi', strength: 2, normalization: true } as const;

interface DuplicateGroup {
  _id: { tripId: unknown; label: string };
  count: number;
  ids: unknown[];
  labels: string[];
}

function hasCollation(idx: { collation?: { locale?: string; strength?: number; normalization?: boolean } }): boolean {
  return (
    !!idx.collation &&
    idx.collation.locale === COLLATION.locale &&
    idx.collation.strength === COLLATION.strength &&
    idx.collation.normalization === COLLATION.normalization
  );
}

async function main(): Promise<void> {
  loadEnv();
  const apply = process.argv.includes('--apply');
  const hasBackup = process.argv.includes('--i-have-backup');
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('Thiếu MONGODB_URI trong môi trường. Hủy migration.');
    process.exitCode = 2;
    return;
  }

  // Task 4: --apply phải kèm xác nhận đã backup, từ chối nếu thiếu.
  if (apply && !hasBackup) {
    console.error('TỪ CHỐI: --apply phải kèm cờ --i-have-backup (xác nhận đã backup DB).');
    console.error('Đổi collation = drop+recreate index → có cửa sổ không enforce uniqueness. Chạy trong maintenance window.');
    process.exitCode = 2;
    return;
  }

  await mongoose.connect(uri);
  try {
    const coll = mongoose.connection.collection(COLLECTION);

    // Trùng theo nghĩa case-insensitive (gom theo label đã lowercase).
    // Lưu ý: aggregation không chuẩn hóa được NFC/NFD; nếu còn trùng dạng Unicode khác nhau,
    // bước createIndex (normalization:true) sẽ báo lỗi duplicate key và migration dừng an toàn.
    const groups = (await coll
      .aggregate([
        {
          $group: {
            _id: { tripId: '$tripId', label: { $toLower: '$label' } },
            count: { $sum: 1 },
            ids: { $push: '$_id' },
            labels: { $addToSet: '$label' },
          },
        },
        { $match: { count: { $gt: 1 } } },
        { $sort: { count: -1 } },
      ])
      .toArray()) as DuplicateGroup[];

    console.log(`Collection "${COLLECTION}" — ${apply ? 'APPLY' : 'DRY-RUN'}`);

    if (groups.length > 0) {
      console.log(`Phát hiện ${groups.length} nhóm trùng nhãn (không phân biệt hoa/thường):`);
      for (const g of groups) {
        console.log(`- tripId=${String(g._id.tripId)} labels=${JSON.stringify(g.labels)} → ${g.count} mục (ids: ${g.ids.map(String).join(', ')})`);
      }
      console.error('CẢNH BÁO: Phải xử lý dữ liệu trùng trước khi tạo unique index collation. Hủy.');
      process.exitCode = 1;
      return;
    }
    console.log('Không có dữ liệu trùng nhãn (case-insensitive). An toàn để tạo unique index.');

    const indexes = await coll.indexes();
    const existing = indexes.find(
      (idx) => idx.key && (idx.key as Record<string, unknown>).tripId === 1 && (idx.key as Record<string, unknown>).label === 1,
    );
    const needsRecreate = existing && !hasCollation(existing);
    const upToDate = existing && hasCollation(existing);

    console.log(`Index { tripId, label } hiện tại: ${existing ? existing.name : 'chưa có'}${existing ? (hasCollation(existing) ? ' (đã đúng collation)' : ' (collation khác/không có)') : ''}`);

    if (!apply) {
      console.log('\nKế hoạch:');
      if (needsRecreate) console.log(`  - DROP "${existing!.name}" rồi CREATE lại "${INDEX_NAME}" collation ${JSON.stringify(COLLATION)}`);
      else if (!existing) console.log(`  - CREATE unique sparse index "${INDEX_NAME}" { tripId: 1, label: 1 } collation ${JSON.stringify(COLLATION)}`);
      else console.log('  - Không cần thay đổi (index đã đúng).');
      console.log('\nChạy lại với --apply --i-have-backup để thực thi (trong maintenance window).');
      return;
    }

    if (upToDate) {
      console.log('Index đã đúng collation, không cần thay đổi. Migration hoàn tất.');
      return;
    }

    if (needsRecreate) {
      console.warn(`[${new Date().toISOString()}] BẮT ĐẦU cửa sổ không-enforce-uniqueness: DROP "${existing!.name}".`);
      await coll.dropIndex(existing!.name as string);
    }
    await coll.createIndex({ tripId: 1, label: 1 }, { unique: true, sparse: true, name: INDEX_NAME, collation: COLLATION });
    console.warn(`[${new Date().toISOString()}] KẾT THÚC cửa sổ: đã CREATE "${INDEX_NAME}" có collation. Uniqueness được enforce trở lại.`);
    console.log('Migration hoàn tất.');
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error('Migration thất bại:', error instanceof Error ? error.message : String(error));
  process.exitCode = 2;
});
