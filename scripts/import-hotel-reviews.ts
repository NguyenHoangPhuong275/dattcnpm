import fs from 'node:fs';
import readline from 'node:readline';
import path from 'node:path';
import mongoose from 'mongoose';
import { loadEnv } from './load-env';
import { normalizeVietnameseText } from '../src/lib/string';

const USERS_COLLECTION = 'users';
const REVIEWS_COLLECTION = 'hotel_reviews';
const HOTELS_COLLECTION = 'hotels';
const CSV_FILE_PATH = path.resolve(process.cwd(), 'scripts', 'Reviews.csv');

interface TripAdvisorReview {
  username: string;
  rating: number;
  title: string;
  comment: string;
  hotelName: string;
  createdDate: string;
}

// Hàm phân tích dòng CSV hỗ trợ nhiều dòng (do review có dấu xuống dòng)
function parseCSVLine(line: string, state: { currentLine: string; inQuotes: boolean }): string[] | null {
  state.currentLine += (state.currentLine ? '\n' : '') + line;

  let quotesCount = 0;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') quotesCount++;
  }

  if (quotesCount % 2 !== 0) {
    state.inQuotes = !state.inQuotes;
  }

  if (state.inQuotes) {
    return null; // Dòng chưa kết thúc (đang trong dấu ngoặc kép)
  }

  const content = state.currentLine;
  state.currentLine = '';

  const row: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      row.push(currentField);
      currentField = '';
    } else {
      currentField += char;
    }
  }
  row.push(currentField);
  return row;
}

async function main(): Promise<void> {
  loadEnv();
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('Thiếu MONGODB_URI/MONGO_URI. Hủy import.');
    process.exitCode = 2;
    return;
  }

  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error(`Không tìm thấy file CSV tại ${CSV_FILE_PATH}. Vui lòng kiểm tra lại.`);
    process.exitCode = 2;
    return;
  }

  await mongoose.connect(uri);
  try {
    const db = mongoose.connection;
    const userColl = db.collection(USERS_COLLECTION);
    const hotelColl = db.collection(HOTELS_COLLECTION);
    const reviewColl = db.collection(REVIEWS_COLLECTION);

    // 1. Xóa dữ liệu mẫu cũ (các tài khoản reviewer ảo và các đánh giá liên quan)
    console.log('--- Bước 1: Xóa dữ liệu mẫu cũ ---');
    const oldUsers = await userColl.find({ email: { $regex: /^reviewer\..*@example\.com$/ } }).toArray();
    const oldUserIds = oldUsers.map((u) => u._id);

    // Xóa tất cả các review có tác giả thuộc nhóm mẫu cũ hoặc có flag marker nào đó
    const deleteReviewsResult = await reviewColl.deleteMany({
      $or: [
        { userId: { $in: oldUserIds } },
        { isSeededReal: true } // để phân biệt dữ liệu thật được nạp mới
      ]
    });
    console.log(`Đã xóa ${deleteReviewsResult.deletedCount} đánh giá mẫu cũ.`);

    const deleteUsersResult = await userColl.deleteMany({ email: { $regex: /^reviewer\..*@example\.com$/ } });
    console.log(`Đã xóa ${deleteUsersResult.deletedCount} tài khoản người dùng mẫu cũ.`);

    // 2. Load toàn bộ khách sạn từ database để lập bản đồ đối sánh
    console.log('\n--- Bước 2: Chuẩn bị danh sách khách sạn đối sánh ---');
    const hotels = await hotelColl.find({}).toArray();
    if (hotels.length === 0) {
      console.log('Không có khách sạn nào trong DB. Vui lòng chạy import khách sạn trước.');
      process.exitCode = 0;
      return;
    }

    const hotelMap = new Map<string, any>();
    for (const h of hotels) {
      const normalizedName = normalizeVietnameseText(h.name);
      if (normalizedName) {
        hotelMap.set(normalizedName, h);
      }
    }
    console.log(`Đã tải ${hotels.length} khách sạn từ DB để đối sánh tên.`);

    // 3. Đọc và phân tích file TripAdvisor Reviews CSV thực tế
    console.log('\n--- Bước 3: Đọc và phân tích Reviews.csv thực tế từ Zenodo ---');
    const fileStream = fs.createReadStream(CSV_FILE_PATH);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    const state = { currentLine: '', inQuotes: false };
    let isHeader = true;

    // Các danh sách gom đánh giá thực tế
    const matchedReviewsByHotelId = new Map<string, TripAdvisorReview[]>();
    const allReviewsPool: TripAdvisorReview[] = [];
    const uniqueUsernames = new Set<string>();

    let totalLinesRead = 0;
    let parsedCount = 0;
    let viCount = 0;
    let enCount = 0;

    for await (const line of rl) {
      totalLinesRead++;
      const row = parseCSVLine(line, state);
      if (!row) continue;

      if (isHeader) {
        isHeader = false;
        continue;
      }

      // Cấu trúc cột của Reviews.csv:
      // 0:id, 1:language, 2:rating, 3:additionalRatings, 4:createdDate, 5:helpfulVotes, 6:username, 7:userId, 8:title, 9:text, 10:locationId, 11:parentGeoId, 12:hotelName, 13:stayDate, 14:tripType
      if (row.length < 13) continue;

      const language = row[1]?.trim() || '';
      const rating = parseInt(row[2], 10);
      const username = row[6]?.trim() || '';
      const title = row[8]?.trim() || '';
      const text = row[9]?.trim() || '';
      const hotelName = row[12]?.trim() || '';
      const createdDate = row[4]?.trim() || '';

      if (!hotelName || !text || isNaN(rating)) continue;

      // Ưu tiên lấy tiếng Việt (vi) và tiếng Anh (en)
      if (language !== 'vi' && language !== 'en') continue;

      if (language === 'vi') viCount++;
      else enCount++;

      parsedCount++;

      const reviewItem: TripAdvisorReview = {
        username: username || 'Khách TripAdvisor',
        rating,
        title,
        comment: text,
        hotelName,
        createdDate
      };

      allReviewsPool.push(reviewItem);
      if (username && username !== 'Khách TripAdvisor') {
        uniqueUsernames.add(username);
      }

      // Tìm đối sánh trực tiếp tên khách sạn
      const normalizedCSVHotelName = normalizeVietnameseText(hotelName);
      const matchedHotel = hotelMap.get(normalizedCSVHotelName);
      if (matchedHotel) {
        const hotelIdStr = String(matchedHotel._id);
        const list = matchedReviewsByHotelId.get(hotelIdStr) || [];
        list.push(reviewItem);
        matchedReviewsByHotelId.set(hotelIdStr, list);
      }
    }

    console.log(`Đã đọc xong file CSV. Tổng số dòng trong file: ${totalLinesRead}`);
    console.log(`Phân tích thành công: ${parsedCount} đánh giá thật (Tiếng Việt: ${viCount}, Tiếng Anh: ${enCount}).`);
    console.log(`Số lượng khách sạn khớp tên trực tiếp có đánh giá: ${matchedReviewsByHotelId.size}`);

    // 4. Tạo tài khoản người dùng thực tế từ tập tác giả của TripAdvisor
    console.log('\n--- Bước 4: Tạo tài khoản người dùng thật từ TripAdvisor ---');
    const selectedUsernames = Array.from(uniqueUsernames).slice(0, 100); // Lấy tối đa 100 tác giả thực tế để tạo tài khoản
    const usernameToUserId = new Map<string, mongoose.Types.ObjectId>();

    const usersToInsert: any[] = [];
    const now = new Date();

    for (const name of selectedUsernames) {
      const email = `tripadvisor.${normalizeVietnameseText(name).replace(/\s+/g, '')}@tripadvisor.local`;
      const existing = await userColl.findOne({ email });
      if (existing) {
        usernameToUserId.set(name, existing._id);
      } else {
        const newId = new mongoose.Types.ObjectId();
        usernameToUserId.set(name, newId);
        usersToInsert.push({
          _id: newId,
          email,
          fullName: name,
          passwordHash: 'x',
          avatarUrl: null,
          role: 'USER',
          isLocked: false,
          emailVerified: true,
          emailVerifiedAt: now,
          createdAt: now,
          updatedAt: now,
          deletedAt: null
        });
      }
    }

    if (usersToInsert.length > 0) {
      await userColl.insertMany(usersToInsert);
      console.log(`Đã tạo mới ${usersToInsert.length} tài khoản người dùng TripAdvisor thực tế.`);
    }

    // 5. Chuẩn bị dữ liệu đánh giá để ghi vào MongoDB
    console.log('\n--- Bước 5: Phân bổ và lưu đánh giá thật ---');
    const reviewsToInsert: any[] = [];
    const userIdsArray = Array.from(usernameToUserId.values());

    for (const hotel of hotels) {
      const hotelId = hotel._id;
      const hotelIdStr = String(hotelId);

      const hotelReviews = matchedReviewsByHotelId.get(hotelIdStr) || [];

      // Nếu khách sạn không khớp tên trực tiếp trong CSV, gán 3-5 đánh giá ngẫu nhiên từ All Pool để đảm bảo có đánh giá thật
      if (hotelReviews.length === 0 && allReviewsPool.length > 0) {
        const numToAssign = Math.floor(Math.random() * 3) + 3; // 3 đến 5 đánh giá
        for (let i = 0; i < numToAssign; i++) {
          const randReview = allReviewsPool[Math.floor(Math.random() * allReviewsPool.length)];
          hotelReviews.push(randReview);
        }
      }

      // Giới hạn tối đa 6 đánh giá mỗi khách sạn để tránh DB quá tải
      const finalReviews = hotelReviews.slice(0, 6);
      const usedUserIds = new Set<string>();

      for (const rev of finalReviews) {
        // Lấy ID người dùng thực tế nếu có, ngược lại lấy ngẫu nhiên trong danh sách user vừa tạo
        let userId = usernameToUserId.get(rev.username);
        if (!userId || usedUserIds.has(String(userId))) {
          let attempts = 0;
          let randomUserId = userIdsArray[Math.floor(Math.random() * userIdsArray.length)];
          while (usedUserIds.has(String(randomUserId)) && attempts < 100) {
            randomUserId = userIdsArray[Math.floor(Math.random() * userIdsArray.length)];
            attempts++;
          }
          userId = randomUserId;
        }
        usedUserIds.add(String(userId));

        const reviewDate = rev.createdDate ? new Date(rev.createdDate) : now;

        reviewsToInsert.push({
          hotelId,
          userId,
          rating: rev.rating,
          comment: rev.comment,
          deletedAt: null,
          isSeededReal: true, // Flag đánh dấu đánh giá thật từ Zenodo
          createdAt: isNaN(reviewDate.getTime()) ? now : reviewDate,
          updatedAt: now
        });
      }
    }

    if (reviewsToInsert.length > 0) {
      // Chia nhỏ ra để ghi bulk write đề phòng số lượng bản ghi quá lớn
      const batchSize = 2000;
      let insertedTotal = 0;
      for (let i = 0; i < reviewsToInsert.length; i += batchSize) {
        const batch = reviewsToInsert.slice(i, i + batchSize);
        const res = await reviewColl.insertMany(batch);
        insertedTotal += res.insertedCount;
      }
      console.log(`Đã ghi thành công ${insertedTotal} đánh giá thật từ TripAdvisor vào collection hotel_reviews.`);
    }

    process.exitCode = 0;
  } finally {
    await mongoose.disconnect();
    console.log('Đã ngắt kết nối database.');
  }
}

main().catch((error) => {
  console.error('Import thất bại:', error instanceof Error ? error.message : String(error));
  process.exitCode = 2;
});
