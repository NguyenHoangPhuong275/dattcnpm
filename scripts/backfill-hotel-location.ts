import mongoose from 'mongoose';
import { loadEnv } from './load-env';

const COLLECTION = 'hotels';

async function main(): Promise<void> {
  loadEnv();
  const apply = process.argv.includes('--apply');
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('Thiếu MONGODB_URI. Hủy backfill.');
    process.exitCode = 2;
    return;
  }

  await mongoose.connect(uri);
  try {
    const coll = mongoose.connection.collection(COLLECTION);
    const filter = {
      lat: { $type: 'number' },
      lng: { $type: 'number' },
      $or: [{ location: { $exists: false } }, { location: null }],
    };

    const pending = await coll.countDocuments(filter);
    console.log(`Khách sạn cần gắn location (có lat/lng, chưa có location): ${pending}`);

    if (!apply) {
      console.log('DRY-RUN: thêm --apply để ghi. Sẽ set location = { type: "Point", coordinates: [lng, lat] }.');
      process.exitCode = 0;
      return;
    }

    const result = await coll.updateMany(filter, [
      { $set: { location: { type: 'Point', coordinates: ['$lng', '$lat'] } } },
    ]);
    console.log(`Đã cập nhật: ${result.modifiedCount} khách sạn.`);
    process.exitCode = 0;
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error('Backfill thất bại:', error instanceof Error ? error.message : String(error));
  process.exitCode = 2;
});
