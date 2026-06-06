# 3. THIẾT KẾ DỮ LIỆU MONGODB VÀ REDIS

## 3.1. Định hướng thiết kế dữ liệu
Hệ thống sử dụng MongoDB theo mô hình Document Store làm cơ sở dữ liệu chính. Dữ liệu được tổ chức dưới dạng các document linh hoạt, cho phép lưu trữ các trường dữ liệu động và không cấu trúc (chẳng hạn như dữ liệu tags, opening hours, và metadata của OpenStreetMap). Các chỉ mục (indexes) được tối ưu hóa cho các truy vấn quan trọng, đặc biệt là truy vấn không gian địa lý (geospatial query) và các quan hệ khóa ngoại (foreign key references) được duy trì ở tầng ứng dụng thông qua MongoDB ObjectId.

## 3.2. Danh sách các Collections chính (18 collections)

| Collection | Mô tả | Trường chính và kiểu dữ liệu |
|---|---|---|
| **users** | Quản lý tài khoản người dùng và quản trị viên | `_id` (ObjectId), `email` (string), `passwordHash` (string), `fullName` (string), `avatarUrl` (string), `role` (enum), `isLocked` (boolean), `createdAt` (Date), `updatedAt` (Date), `deletedAt` (Date) |
| **trips** | Quản lý thông tin hành trình/chuyến đi | `_id` (ObjectId), `userId` (ObjectId), `title` (string), `description` (string), `destination` (string), `startDate` (Date), `endDate` (Date), `isPublic` (boolean), `coverImage` (string), `metadata` (JSON), `createdAt` (Date), `updatedAt` (Date), `deletedAt` (Date) |
| **places** | Bộ nhớ đệm địa điểm POI (ăn uống, tham quan, lưu trú) từ OSM | `_id` (ObjectId), `osmId` (string), `name` (string), `type` (string), `lat` (double), `lng` (double), `address` (string), `openingHours` (string), `images` (JSON array), `osmTags` (JSON object), `tags` (array), `ratingAvg` (double), `ratingCount` (int), `createdAt` (Date), `updatedAt` (Date) |
| **itineraryItems** | Lịch trình chi tiết các địa điểm ghé thăm từng ngày | `_id` (ObjectId), `tripId` (ObjectId), `placeId` (ObjectId), `day` (int), `orderIndex` (int), `note` (string), `startTime` (Date), `endTime` (Date), `cost` (double), `currency` (string), `metadata` (JSON), `createdAt` (Date), `updatedAt` (Date) |
| **favoritePlaces** | Danh sách địa điểm yêu thích của người dùng | `_id` (ObjectId), `userId` (ObjectId), `placeId` (ObjectId), `createdAt` (Date) |
| **searchHistories** | Nhật ký tìm kiếm của người dùng và khách | `_id` (ObjectId), `userId` (ObjectId), `query` (string), `lat` (double), `lng` (double), `resultCount` (int), `metadata` (JSON), `createdAt` (Date) |
| **auditLogs** | Nhật ký vận hành hệ thống | `_id` (ObjectId), `userId` (ObjectId), `action` (string), `targetType` (string), `targetId` (ObjectId), `metadata` (JSON), `createdAt` (Date) |
| **reviews** | Đánh giá và bình luận về địa điểm, hỗ trợ trả lời theo luồng | `_id` (ObjectId), `userId` (ObjectId), `placeId` (ObjectId), `parentId` (ObjectId), `rating` (int), `comment` (string), `images` (JSON array), `createdAt` (Date), `updatedAt` (Date), `deletedAt` (Date) |
| **tripShares** | Quản lý quyền chia sẻ chuyến đi (`READ`/`EDIT`) | `_id` (ObjectId), `tripId` (ObjectId), `sharedByUserId` (ObjectId), `sharedWithUserId` (ObjectId), `permission` (enum), `shareCode` (string), `expiresAt` (Date), `createdAt` (Date) |
| **notifications** | Hệ thống thông báo gửi tới người dùng | `_id` (ObjectId), `userId` (ObjectId), `title` (string), `content` (string), `type` (enum), `isRead` (boolean), `actionUrl` (string), `metadata` (JSON), `createdAt` (Date) |
| **tags** | Thẻ phân loại địa điểm du lịch | `_id` (ObjectId), `name` (string), `category` (string), `createdAt` (Date) |
| **placeTags** | Bảng liên kết nhiều-nhiều giữa địa điểm và thẻ phân loại | `_id` (ObjectId), `placeId` (ObjectId), `tagId` (ObjectId) |
| **userPreferences** | Điểm số sở thích chi tiết của người dùng | `_id` (ObjectId), `userId` (ObjectId), `tagId` (ObjectId), `preferenceScore` (double), `updatedAt` (Date) |
| **tripBudgets** | Tổng hợp ngân sách chuyến đi theo hạng mục | `_id` (ObjectId), `tripId` (ObjectId), `category` (enum), `estimatedAmount` (double), `actualAmount` (double), `currency` (string), `note` (string), `createdAt` (Date) |
| **itineraryTransports** | Phương tiện di chuyển giữa 2 điểm lịch trình | `_id` (ObjectId), `tripId` (ObjectId), `fromItemId` (ObjectId), `toItemId` (ObjectId), `transportMode` (enum), `durationMinutes` (int), `distanceKm` (double), `note` (string) |
| **tripAccommodations** | Thông tin lưu trú (khách sạn/homestay) của chuyến đi | `_id` (ObjectId), `tripId` (ObjectId), `placeId` (ObjectId), `name` (string), `checkIn` (Date), `checkOut` (Date), `bookingRef` (string), `cost` (double), `currency` (string), `note` (string), `createdAt` (Date) |
| **tripChecklists** | Danh sách việc cần chuẩn bị cho chuyến đi | `_id` (ObjectId), `tripId` (ObjectId), `label` (string), `isDone` (boolean), `dueDate` (Date), `createdAt` (Date) |
| **userFollows** | Quan hệ theo dõi tài khoản giữa các thành viên | `_id` (ObjectId), `followerId` (ObjectId), `followingId` (ObjectId), `createdAt` (Date) |

## 3.3. Chỉ mục MongoDB (Indexes)

| Collection | Chỉ mục (Indexes) | Mục đích |
|---|---|---|
| **users** | `{ email: 1 }` (unique) | Đăng nhập nhanh và chống trùng lặp email. |
| **trips** | `{ userId: 1, startDate: -1 }` | Truy vấn các chuyến đi hoạt động của người dùng nhanh chóng. |
| **places** | `{ osmId: 1 }` (unique, sparse) | Tránh trùng lặp khi đồng bộ từ OpenStreetMap. |
| **places** | `{ lat: 1, lng: 1 }` | Tối ưu truy vấn không gian địa lý / tìm địa điểm gần đây. |
| **favoritePlaces** | `{ userId: 1, placeId: 1 }` (unique) | Tránh người dùng yêu thích trùng lặp một địa điểm. |
| **searchHistories** | `{ userId: 1, createdAt: -1 }` | Lấy lịch sử tìm kiếm mới nhất của thành viên. |
| **auditLogs** | `{ createdAt: -1 }` | Quản trị viên truy vấn audit log mới nhất. |
| **reviews** | `{ placeId: 1, createdAt: -1 }`, `{ userId: 1, createdAt: -1 }` | Hiển thị nhanh các đánh giá của địa điểm hoặc người dùng. |
| **tripShares** | `{ tripId: 1 }`, `{ shareCode: 1 }` | Xác thực nhanh quyền truy cập liên kết chia sẻ. |
| **notifications** | `{ userId: 1, isRead: 1, createdAt: -1 }` | Lấy thông báo chưa đọc của người dùng nhanh nhất. |
| **userPreferences** | `{ userId: 1, tagId: 1 }` (unique) | Tối ưu hóa gợi ý địa điểm cá nhân hóa. |
| **tripBudgets** | `{ tripId: 1 }` | Quản lý ngân sách chuyến đi. |
| **itineraryTransports**| `{ tripId: 1 }`, `{ fromItemId: 1 }`, `{ toItemId: 1 }` | Tính toán lộ trình di chuyển. |
| **tripAccommodations**| `{ tripId: 1 }` | Quản lý nơi ở của chuyến đi. |
| **tripChecklists** | `{ tripId: 1 }` | Quản lý checklist chuyến đi. |
| **userFollows** | `{ followerId: 1, followingId: 1 }` (unique) | Kiểm tra nhanh quan hệ follow của 2 người dùng. |

## 3.4. Kiến trúc Redis
Redis được sử dụng làm lớp lưu trữ bộ nhớ đệm (caching) và quản lý trạng thái phiên hoạt động hiệu năng cao:

| Mục đích | Key mẫu | Kiểu dữ liệu | TTL | Ghi chú |
|---|---|---|---|---|
| **Cache Geocoding** | `geo:search:{query}` | String (JSON) | 24 giờ | Giảm tải API Nominatim |
| **Cache POI** | `poi:{lat}:{lng}:{radius}:{type}` | String (JSON) | 12 giờ | Giảm tải API Overpass |
| **Cache thời tiết** | `weather:{lat}:{lng}` | String (JSON) | 15-30 phút | Giảm tải API OpenWeatherMap |
| **Rate limit đăng nhập**| `rl:login:{ip}` | String (Counter) | 15 phút | Chống brute-force đăng nhập |
| **Rate limit tìm kiếm**| `rl:search:{ip}` | String (Counter) | 1-5 phút | Giới hạn spam tìm kiếm |
| **Session lưu trữ** | `session:{sessionId}` | String (JSON) | Tùy chỉnh | Lưu thông tin phiên đăng nhập |
| **Thu hồi JWT Token** | `blacklist:{jti}` | String | Theo hạn JWT | Quản lý đăng xuất an toàn |

## 3.5. Schema TypeScript tham khảo
Các interface TypeScript tương ứng biểu diễn cấu trúc dữ liệu của database được lưu trữ tại **[src/database/schema.ts](../src/database/schema.ts)** (nguồn chính xác duy nhất, đã được mở rộng hỗ trợ đầy đủ nghiệp vụ).
