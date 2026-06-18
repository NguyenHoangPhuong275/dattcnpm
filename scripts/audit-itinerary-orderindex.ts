import mongoose from 'mongoose';
import { loadEnv } from './load-env';

const COLLECTION = 'itinerary_items';

interface DuplicateGroup {
  _id: { tripId: unknown; day: number; orderIndex: number };
  count: number;
  ids: unknown[];
}

async function main(): Promise<void> {
  loadEnv();
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('Thiếu MONGODB_URI trong môi trường. Hủy audit.');
    process.exitCode = 2;
    return;
  }

  await mongoose.connect(uri);
  try {
    const coll = mongoose.connection.collection(COLLECTION);
    const groups = (await coll
      .aggregate([
        {
          $group: {
            _id: { tripId: '$tripId', day: '$day', orderIndex: '$orderIndex' },
            count: { $sum: 1 },
            ids: { $push: '$_id' },
          },
        },
        { $match: { count: { $gt: 1 } } },
        { $sort: { count: -1 } },
      ])
      .toArray()) as DuplicateGroup[];

    const total = await coll.countDocuments();
    console.log(`Audit ItineraryItem trên collection "${COLLECTION}" (chế độ chỉ đọc).`);
    console.log(`Tổng số mục lịch trình: ${total}`);

    if (groups.length === 0) {
      console.log('Không phát hiện nhóm trùng { tripId, day, orderIndex }. An toàn để bật unique index.');
      process.exitCode = 0;
      return;
    }

    console.log(`Phát hiện ${groups.length} nhóm trùng { tripId, day, orderIndex }:`);
    for (const group of groups) {
      const { tripId, day, orderIndex } = group._id;
      console.log(
        `- tripId=${String(tripId)} day=${day} orderIndex=${orderIndex} → ${group.count} mục (ids: ${group.ids
          .map((idValue) => String(idValue))
          .join(', ')})`,
      );
    }
    console.log('CẢNH BÁO: Phải xử lý dữ liệu trùng trước khi bật unique index (Task 5).');
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error('Audit thất bại:', error instanceof Error ? error.message : String(error));
  process.exitCode = 2;
});
