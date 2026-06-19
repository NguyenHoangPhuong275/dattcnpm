import mongoose from 'mongoose';
import { loadEnv } from '../scripts/load-env';

/**
 * Global teardown (Task 3 — phương án A): sau khi toàn bộ suite chạy xong, drop các database
 * test do worker tạo ra (tên khớp /_test(_w...)?$/). Chỉ đụng DB *_test*, không bao giờ chạm DB dev.
 * Defensive: nuốt mọi lỗi để teardown không làm fail cả run (vd thiếu quyền admin trên Atlas).
 */
export async function teardown(): Promise<void> {
  try {
    loadEnv();
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) return;

    // Timeout ngắn: nếu không có Mongo (vd chạy test non-DB local), thoát nhanh thay vì treo.
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    try {
      const admin = mongoose.connection.db?.admin();
      if (!admin) return;
      const { databases } = await admin.listDatabases();
      const testDbPattern = /_test(_w[\w-]+)?$/;
      for (const d of databases) {
        if (testDbPattern.test(d.name)) {
          await mongoose.connection.useDb(d.name).dropDatabase();
        }
      }
    } finally {
      await mongoose.disconnect();
    }
  } catch {
    // Bỏ qua: teardown chỉ là dọn dẹp best-effort.
  }
}
