/**
 * Script xóa tất cả dữ liệu test khỏi MongoDB Atlas.
 * Giữ lại tài khoản thật dựa trên email được chỉ định qua biến KEEP_EMAIL.
 *
 * Cách chạy:
 *   npx tsx scripts/cleanup-test-data.ts
 *
 * Nếu muốn giữ tài khoản cụ thể:
 *   KEEP_EMAIL=your@email.com npx tsx scripts/cleanup-test-data.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env manually
const envPath = resolve(__dirname, '..', '.env');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch { /* ignore */ }
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined');
  process.exit(1);
}

// Email tài khoản thật cần giữ — set qua env hoặc để trống để xóa TẤT CẢ
const KEEP_EMAIL = process.env.KEEP_EMAIL ?? '';

const COLLECTIONS_WITH_USER_ID = [
  'trips',
  'favorite_places',
  'search_histories',
  'reviews',
  'audit_logs',
  'notifications',
  'user_preferences',
  'trip_budgets',
  'trip_accommodations',
  'trip_checklists',
  'user_follows',
  'trip_shares',
  'tags',
];

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI!);
  const db = mongoose.connection.db!;
  console.log(`Connected to database: ${db.databaseName}`);

  // 1) Tìm tất cả users
  const usersCol = db.collection('users');
  const allUsers = await usersCol.find({}).toArray();
  console.log(`\nTotal users in database: ${allUsers.length}`);

  if (allUsers.length === 0) {
    console.log('No users found. Nothing to clean.');
    await mongoose.disconnect();
    return;
  }

  // Liệt kê users
  for (const u of allUsers) {
    const isKeep = KEEP_EMAIL && u.email === KEEP_EMAIL;
    console.log(`  ${isKeep ? '✅ KEEP' : '❌ DELETE'} | ${u.email} | ${u.fullName ?? u.firstName ?? '—'} | _id: ${u._id}`);
  }

  // 2) Xác định users cần xóa
  const usersToDelete = KEEP_EMAIL
    ? allUsers.filter(u => u.email !== KEEP_EMAIL)
    : allUsers;

  if (usersToDelete.length === 0) {
    console.log('\nNo test users to delete.');
    await mongoose.disconnect();
    return;
  }

  const deleteUserIds = usersToDelete.map(u => u._id);
  const deleteUserIdStrings = deleteUserIds.map(id => id.toString());

  console.log(`\nDeleting ${usersToDelete.length} test user(s) and their associated data...`);

  // 3) Xóa dữ liệu liên quan theo userId
  for (const colName of COLLECTIONS_WITH_USER_ID) {
    try {
      const col = db.collection(colName);
      // Thử cả ObjectId và string vì code có thể lưu dạng khác nhau
      const result = await col.deleteMany({
        $or: [
          { userId: { $in: deleteUserIds } },
          { userId: { $in: deleteUserIdStrings } },
          { user: { $in: deleteUserIds } },
          { user: { $in: deleteUserIdStrings } },
        ]
      });
      if (result.deletedCount > 0) {
        console.log(`  ${colName}: deleted ${result.deletedCount} documents`);
      }
    } catch {
      // Collection may not exist
    }
  }

  // 4) Xóa itinerary_items thuộc trips của test users
  try {
    const tripsCol = db.collection('trips');
    const testTrips = await tripsCol.find({
      $or: [
        { userId: { $in: deleteUserIds } },
        { userId: { $in: deleteUserIdStrings } },
      ]
    }).toArray();

    if (testTrips.length > 0) {
      const tripIds = testTrips.map(t => t._id);
      const tripIdStrings = tripIds.map(id => id.toString());

      const itinCol = db.collection('itinerary_items');
      const itinResult = await itinCol.deleteMany({
        $or: [
          { tripId: { $in: tripIds } },
          { tripId: { $in: tripIdStrings } },
        ]
      });
      if (itinResult.deletedCount > 0) {
        console.log(`  itinerary_items: deleted ${itinResult.deletedCount} documents`);
      }

      // Xóa trips
      const tripResult = await tripsCol.deleteMany({
        _id: { $in: tripIds }
      });
      console.log(`  trips: deleted ${tripResult.deletedCount} documents`);
    }
  } catch {
    // ignore
  }

  // 5) Xóa test users
  const userResult = await usersCol.deleteMany({
    _id: { $in: deleteUserIds }
  });
  console.log(`  users: deleted ${userResult.deletedCount} documents`);

  // 6) Summary
  console.log('\n✅ Cleanup complete.');
  if (KEEP_EMAIL) {
    console.log(`   Kept account: ${KEEP_EMAIL}`);
  } else {
    console.log('   All user data has been removed.');
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
