# 3. THIẾT KẾ DỮ LIỆU MONGODB VÀ REDIS

## 3.1. Định hướng thiết kế dữ liệu
Hệ thống sử dụng MongoDB theo mô hình Document Store. Các dữ liệu lớn hoặc có khả năng tăng nhanh như `itineraryItems`, `favoritePlaces`, `searchHistories` và `auditLogs` được tách collection riêng, liên kết bằng `ObjectId` để tránh document `trips` hoặc `users` quá lớn (vượt quá giới hạn 16MB của MongoDB) và giúp tối ưu hóa hiệu năng truy vấn.

## 3.2. Các collection chính
| Collection | Trường chính | Ghi chú |
|---|---|---|
| **users** | `_id`, `email`, `passwordHash`, `fullName`, `role`, `isLocked`, `preferences`, `createdAt`, `updatedAt` | Lưu tài khoản và phân quyền. `email` là unique, lowercase. `role` nhận giá trị `"USER"` hoặc `"ADMIN"`. |
| **trips** | `_id`, `userId`, `title`, `destination`, `startDate`, `endDate`, `createdAt`, `updatedAt` | Lưu chuyến đi của user. `userId` là ObjectId tham chiếu đến `users`. |
| **places** | `_id`, `osmId`, `name`, `type`, `lat`, `lng`, `address`, `images`, `tags`, `raw`, `createdAt` | Lưu địa điểm/POI lấy từ API ngoài hoặc do admin nhập. `osmId` dùng làm khóa kiểm tra trùng lặp từ OpenStreetMap. |
| **itineraryItems** | `_id`, `tripId`, `placeId`, `day`, `orderIndex`, `note`, `startTime`, `endTime`, `createdAt` | Lưu từng mục lịch trình chi tiết trong chuyến đi. |
| **favoritePlaces** | `_id`, `userId`, `placeId`, `createdAt` | Lưu địa điểm yêu thích của user. Ràng buộc unique index ghép cặp `{ userId, placeId }`. |
| **searchHistories** | `_id`, `userId`, `query`, `lat`, `lng`, `createdAt` | Lưu lịch sử tìm kiếm địa danh của user. `userId` có thể `null` nếu là Guest. |
| **auditLogs** | `_id`, `userId`, `action`, `targetType`, `targetId`, `metadata`, `createdAt` | Lưu nhật ký thao tác nghiệp vụ quan trọng nhằm mục đích giám sát hệ thống. |

## 3.3. Chỉ mục MongoDB (Indexes)
| Collection | Index | Mục đích |
|---|---|---|
| **users** | `{ email: 1 }` (unique) | Đăng nhập nhanh và tránh trùng lặp email khi đăng ký. |
| **trips** | `{ userId: 1, startDate: -1 }` | Lấy nhanh danh sách chuyến đi của user sắp xếp theo thời gian mới nhất. |
| **places** | `{ osmId: 1 }` (unique, sparse) | Tránh lưu trữ trùng lặp địa điểm lấy về từ API OpenStreetMap. |
| **places** | `{ lat: 1, lng: 1 }` | Hỗ trợ truy vấn không gian địa lý hoặc tìm địa điểm theo tọa độ nhanh chóng. |
| **favoritePlaces** | `{ userId: 1, placeId: 1 }` (unique) | Đảm bảo mỗi user chỉ có thể lưu một địa điểm vào danh sách yêu thích một lần duy nhất. |
| **searchHistories** | `{ userId: 1, createdAt: -1 }` | Lấy lịch sử tìm kiếm mới nhất của người dùng một cách hiệu quả. |
| **auditLogs** | `{ createdAt: -1 }` | Hỗ trợ admin truy vấn audit log mới nhất nhanh chóng. |

## 3.4. Kiến trúc Redis
Redis được dùng làm lớp lưu trữ bộ đệm hiệu năng cao để giảm thiểu các lượt gọi API ngoài và hạn chế tần suất truy cập không mong muốn:

| Mục đích | Key mẫu | Value | TTL đề xuất |
|---|---|---|---|
| **Cache Geocoding** | `geo:search:{query}` | JSON kết quả tọa độ địa điểm tìm được | 24 giờ |
| **Cache POI** | `poi:{lat}:{lng}:{radius}:{type}` | JSON danh sách POI (quán ăn, khách sạn, điểm du lịch) | 12 giờ |
| **Cache thời tiết** | `weather:{lat}:{lng}` | JSON thông tin thời tiết hiện tại và dự báo | 15 - 30 phút |
| **Rate limit đăng nhập** | `rl:login:{ip}` | Số lần thử đăng nhập thất bại | 5 - 15 phút |
| **Rate limit tìm kiếm** | `rl:search:{ip}` | Số lượt tìm kiếm đã thực hiện | 1 - 5 phút |
| **Blacklist token** | `blacklist:{jti}` | Giá trị `"1"` đánh dấu JWT bị thu hồi khi đăng xuất | Bằng thời gian hết hạn còn lại của JWT |
| **Session** | `session:{sessionId}` | JSON chứa `userId`, `role` và thông tin phiên hoạt động | Theo cấu hình thời hạn phiên |

## 3.5. Schema TypeScript (tham khảo)

**Canonical source:** `src/database/schema.ts`

File này chứa toàn bộ định nghĩa document MongoDB + cấu trúc Redis cache, đã được mở rộng để hỗ trợ đầy đủ nghiệp vụ theo SRS (reviews, trip sharing, notifications, budgeting, accommodations, transport legs, checklists, tagging cho gợi ý, user follow...).

Ví dụ nhanh (xem file đầy đủ để có tất cả 18+ interface + comments index + Redis key helpers):

```typescript
import type { ObjectId } from 'mongodb';

export interface User {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  fullName: string;
  avatarUrl?: string | null;
  role: 'USER' | 'ADMIN';
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface Trip { /* ... */ }
export interface Place { /* flexible osmTags + tags cho recs */ }
export interface ItineraryItem { /* ... */ }
// + Review, TripShare, Notification, TripBudget, TripAccommodation, 
//   ItineraryTransport, TripChecklist, UserFollow, Tag, UserPreference, ...
```

**Redis** (key patterns + value types) cũng được định nghĩa trong cùng file (xem `RedisKey`, `CachedGeoResult`, `CachedPOI`, `CachedWeather`, `SessionData`, v.v.).

### 3.5.1. Indexes khuyến nghị
Đã comment ngay trong `src/database/schema.ts` (users.email unique, trips.userId+startDate, places 2dsphere + osmId, favoritePlaces composite unique, v.v.).

### 3.5.2. Lưu ý khi implement
- Dùng Mongoose hoặc mongodb driver native.
- Soft delete qua `deletedAt`.
- Giữ document size nhỏ (tách itineraryItems, budgets... thành collection riêng như quyết định ban đầu).
- Luôn đi qua API route của Next.js để cache Redis + rate limit.
