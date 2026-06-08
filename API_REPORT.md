# API Report - LOTUS TRAVEL

**Dự án:** LOTUS TRAVEL (Đồ án Thực tế Công nghệ Phần mềm)  
**Framework:** Next.js 16 (App Router)  
**Ngày báo cáo:** Tháng 6/2026  
**Tổng số API:** 14 endpoints (được tổ chức theo thư mục)

---

## Tổng quan

Tất cả API nằm trong thư mục `src/app/api/`.  
Hầu hết các API liên quan đến người dùng đều sử dụng header `x-user-id` để xác thực (giải pháp tạm thời, client lấy từ `localStorage`).

**Định dạng response phổ biến:**
```json
{
  "success": true,
  "data": {...},
  "message": "...",
  "error": "..."
}
```

**Công nghệ sử dụng:**
- MongoDB (qua `getDb()`)
- Redis (cache, OTP, avatar vĩnh viễn)
- External APIs: Open-Meteo, Nominatim, Overpass
- Resend (gửi email OTP)

---

## 1. Authentication APIs (`/api/auth/*`)

### POST `/api/auth/login`
- **Chức năng:** Đăng nhập người dùng bằng email + mật khẩu.
- **Body:**
  ```json
  { "email": "string", "password": "string" }
  ```
- **Response thành công:**
  ```json
  {
    "success": true,
    "user": { "id": "...", "email": "...", "fullName": "...", "role": "USER" }
  }
  ```
- **Đặc biệt:** Hỗ trợ tài khoản test mặc định nếu bật `ENABLE_DEFAULT_TEST_ACCOUNT=true`.
- **Ghi chú:** Ghi log vào `auditLogs`.

### POST `/api/auth/send-otp`
- **Chức năng:** Gửi mã OTP qua email để xác minh đăng ký.
- **Body:**
  ```json
  { "email": "string", "fullName": "string" }
  ```
- **Đặc điểm:**
  - Rate limit: tối đa 3 lần / 10 phút (dùng Redis).
  - Lưu OTP trong Redis (TTL 1 ngày).
  - Gửi email HTML đẹp qua Resend.
- **Response:** `{ "success": true, "maskedEmail": "a***@gmail.com" }`

### POST `/api/auth/verify-otp`
- **Chức năng:** Xác minh OTP và tạo tài khoản mới.
- **Body:**
  ```json
  {
    "email": "string",
    "otp": "string (6 chữ số)",
    "fullName": "string",
    "password": "string (tối thiểu 6 ký tự)"
  }
  ```
- **Đặc điểm:**
  - Kiểm tra attempts (tối đa 5 lần sai).
  - Hash password bằng bcrypt (rounds 12).
  - Tạo user trong MongoDB.
- **Response:** `{ "success": true, "user": {...} }`

---

## 2. Profile APIs (`/api/profile/*`)

### GET `/api/profile`
- **Chức năng:** Lấy thông tin profile đầy đủ của người dùng hiện tại.
- **Header bắt buộc:** `x-user-id`
- **Response:**
  ```json
  {
    "success": true,
    "profile": {
      "id": "...",
      "email": "...",
      "fullName": "...",
      "avatarUrl": "url hoặc null (đã resolve từ Redis)",
      "phone": "...",
      "dateOfBirth": "yyyy-mm-dd",
      "gender": "Nam | Nữ | Khác",
      "nationality": "...",
      "preferredLanguage": "...",
      "homeCity": "...",
      "emergencyContact": { "name": "...", "phone": "..." },
      "travelStyles": ["Solo", "Adventure"],
      "budgetLevel": "Tiết kiệm | Trung bình | ...",
      "preferredDestinations": ["..."],
      "interests": ["Biển", "Ẩm thực"],
      "twoFactorEnabled": true,
      "createdAt": "yyyy-mm-dd"
    }
  }
  ```
- **Ghi chú:** Tự động resolve avatar từ Redis nếu cần.

### PATCH `/api/profile`
- **Chức năng:** Cập nhật thông tin cá nhân, sở thích du lịch, avatar, và 2FA.
- **Header bắt buộc:** `x-user-id`
- **Body (partial update):**
  ```json
  {
    "fullName": "...",
    "phone": "...",
    "dateOfBirth": "yyyy-mm-dd",
    "gender": "...",
    "nationality": "...",
    "preferredLanguage": "...",
    "homeCity": "...",
    "emergencyContact": { "name": "...", "phone": "..." },
    "avatarUrl": "data:image/... hoặc url",
    "travelStyles": ["..."],
    "budgetLevel": "...",
    "preferredDestinations": ["..."],
    "interests": ["..."],
    "twoFactorEnabled": true
  }
  ```
- **Đặc biệt:** Nếu `avatarUrl` là `data:`, hệ thống sẽ lưu vào Redis vĩnh viễn.
- **Response:** `{ "success": true, "profile": {...} }`

### POST `/api/profile/password`
- **Chức năng:** Đổi mật khẩu.
- **Header bắt buộc:** `x-user-id`
- **Body:**
  ```json
  { "currentPassword": "...", "newPassword": "..." }
  ```
- **Validation:** Mật khẩu mới ≥ 6 ký tự, xác thực mật khẩu cũ bằng bcrypt.
- **Response:** `{ "success": true, "message": "Đổi mật khẩu thành công" }`

---

## 3. Trips APIs (`/api/trips/*`)

### GET `/api/trips`
- **Chức năng:** Lấy danh sách tất cả chuyến đi của user (sắp xếp mới nhất trước).
- **Header bắt buộc:** `x-user-id`
- **Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "...",
        "title": "...",
        "destination": "...",
        "startDate": "yyyy-mm-dd",
        "endDate": "yyyy-mm-dd",
        "isPublic": false,
        "description": "...",
        "coverImage": null,
        "createdAt": "..."
      }
    ]
  }
  ```

### POST `/api/trips`
- **Chức năng:** Tạo chuyến đi mới.
- **Header bắt buộc:** `x-user-id`
- **Body:**
  ```json
  {
    "title": "Hội An 4 ngày",
    "destination": "Hội An, Quảng Nam",
    "startDate": "yyyy-mm-dd",
    "endDate": "yyyy-mm-dd"
  }
  ```
- **Response:** `{ "success": true, "data": { trip object } }` (status 201)

### DELETE `/api/trips/[id]`
- **Chức năng:** Xóa chuyến đi (kiểm tra quyền sở hữu).
- **Header bắt buộc:** `x-user-id`
- **Response:** `{ "success": true, "message": "Trip deleted" }`

---

## 4. Favorites APIs (`/api/favorites/*`)

### GET `/api/favorites`
- **Chức năng:** Lấy danh sách địa điểm yêu thích (đã enrich thông tin từ collection `places`).
- **Header bắt buộc:** `x-user-id`
- **Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "...",
        "placeId": "...",
        "name": "...",
        "type": "tourism",
        "address": "...",
        "lat": 16.0,
        "lng": 108.2
      }
    ]
  }
  ```

### POST `/api/favorites`
- **Chức năng:** Thêm địa điểm vào danh sách yêu thích (tự động tạo place custom nếu chưa có).
- **Header bắt buộc:** `x-user-id`
- **Body:**
  ```json
  {
    "placeId": "optional",
    "name": "Bãi biển Mỹ Khê",
    "lat": 16.05,
    "lng": 108.25,
    "address": "..."
  }
  ```
- **Response:** `{ "success": true, "data": favoriteObject }` (status 201)

### DELETE `/api/favorites/[id]`
- **Chức năng:** Xóa địa điểm khỏi yêu thích (kiểm tra quyền sở hữu).
- **Header bắt buộc:** `x-user-id`
- **Response:** `{ "success": true, "message": "Favorite removed" }`

---

## 5. Reviews API

### GET `/api/reviews/my`
- **Chức năng:** Lấy tất cả đánh giá do user hiện tại viết (đã enrich thông tin place).
- **Header bắt buộc:** `x-user-id`
- **Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "...",
        "rating": 5,
        "comment": "...",
        "images": [],
        "createdAt": "yyyy-mm-dd",
        "place": { "id": "...", "name": "...", "type": "...", "address": "..." }
      }
    ]
  }
  ```

---

## 6. Places Search & POI APIs

### GET `/api/places/search`
- **Chức năng:** Tìm kiếm địa điểm du lịch thông minh (kết hợp Nominatim + Overpass + filter nghiêm ngặt + đồng bộ DB + Redis cache).
- **Query:** `?q=Hội An`
- **Đặc điểm:**
  - Loại bỏ khách sạn, spa, cây xăng, massage, hành chính...
  - Cache kết quả trong Redis (TTL 1 ngày).
  - Tự động lưu vào collection `places`.
- **Response:** `{ "success": true, "results": Place[], "cached": false }`

### GET `/api/places/poi`
- **Chức năng:** Lấy địa điểm du lịch / ẩm thực gần một tọa độ (dùng Overpass API).
- **Query:** `?lat=16.05&lng=108.2&radius=10000&type=tourism`
- **Đặc điểm:** Cache Redis (TTL 12 giờ).
- **Response:** `{ "success": true, "results": [...], "cached": true/false }`

---

## 7. Weather API

### GET `/api/weather`
- **Chức năng:** Lấy thời tiết hiện tại theo tọa độ (Open-Meteo).
- **Query:** `?lat=16.05&lng=108.2`
- **Đặc điểm:** Cache Redis 15 phút.
- **Response:**
  ```json
  {
    "success": true,
    "weather": {
      "temperature": 28.5,
      "description": "Trời quang",
      "weathercode": 0,
      "windspeed": 12.3,
      "time": "..."
    },
    "cached": false
  }
  ```

---

## 8. Webhook API (Admin / Maintenance)

### POST `/api/webhook`
- **Chức năng:** API webhook cho quản trị viên (yêu cầu secret).
- **Xác thực:** Header `x-webhook-secret` hoặc query `?secret=`
- **Secret mặc định:** `lotus_travel_admin_webhook_secret_2026`

**Các event quan trọng:**

| Event                        | Mô tả |
|-----------------------------|-------|
| `db.reset`, `db.clear`      | Xóa trắng các collection managed |
| `db.hardReset`              | Reset toàn bộ database |
| `db.check` / `db.consistency` | Kiểm tra tính nhất quán database |
| `user.lock` / `user.unlock` | Khóa / mở khóa tài khoản |
| `user.delete`               | Xóa user (hard/soft) |
| `notification.broadcast`    | Gửi thông báo cho toàn bộ user |
| `system.stats`              | Thống kê số lượng documents |
| `system.logs`               | Lấy audit logs gần nhất |
| `locations.seed-vn`         | Seed dữ liệu hành chính Việt Nam (~11k phường/xã) |
| `places.clear-cache`        | Xóa cache tìm kiếm địa điểm |

---

## Bảng tổng hợp theo Method

| Method | Số lượng | Endpoint chính |
|--------|----------|----------------|
| GET    | 7        | profile, trips, favorites, reviews/my, places/search, places/poi, weather |
| POST   | 6        | login, send-otp, verify-otp, favorites, trips, profile/password, webhook |
| PATCH  | 1        | profile |
| DELETE | 3        | trips/[id], favorites/[id] |

---

## Ghi chú quan trọng

1. **Xác thực:** Hầu hết API dùng `x-user-id` (không dùng JWT/session thực thụ).
2. **Cache:** Redis được dùng mạnh cho search, POI, weather, OTP.
3. **Avatar:** Lưu vĩnh viễn trong Redis (không TTL) khi user upload.
4. **Webhook:** Đây là công cụ admin mạnh, không nên expose công khai.
5. **External services:** Nominatim, Overpass, Open-Meteo (có timeout và cache).
6. **Audit Log:** Nhiều API ghi log hành động vào collection `auditLogs`.

---

**File này được tạo tự động từ việc phân tích toàn bộ thư mục `src/app/api/`.**  
Cập nhật khi có thay đổi API mới.

---

## Về tính bền vững dữ liệu (Persistence)

### Tạo tài khoản (Register)
- Luồng tạo tài khoản thật (`send-otp` + `verify-otp`) **lưu trực tiếp vào MongoDB collection `users`** qua `db.users.insertOne()`.
- Sử dụng real MongoDB (MONGODB_URI từ `.env`, hiện tại là Atlas cluster `dattcnpm`).
- Dữ liệu **không mất** khi bạn chỉ restart Next.js server (npm run dev, rebuild, redeploy...).
- MongoDB là dịch vụ riêng biệt (Atlas hoặc local mongod). Restart app Next.js không ảnh hưởng đến data trong MongoDB.

### Khi nào dữ liệu bị mất?
Dữ liệu chỉ bị xóa khi:
- Bạn **chủ động gọi webhook** với các event reset:
  - `db.reset` / `db.clear`
  - `db.hardReset` / `db.nuke`
  - `db.dropUnknown`
- MongoDB cluster/database của bạn bị drop thủ công (trên Atlas hoặc xóa data folder local).
- Dùng mock DB cũ (hiện tại auth/profile không dùng nữa, chỉ còn để test).

### Lưu ý quan trọng
- Webhook là công cụ admin rất mạnh. Chỉ gọi reset khi bạn thực sự muốn xóa sạch data.
- Collection `users` nằm trong `MANAGED_COLLECTIONS`, nên bị ảnh hưởng bởi các lệnh reset trên.
- Restart server thông thường (Ctrl+C rồi `npm run dev` lại) **hoàn toàn an toàn** với data người dùng.

Nếu bạn đang test và lo lắng data biến mất sau khi restart dev server → **không cần lo**. Data vẫn còn nguyên trong Atlas (hoặc MongoDB local của bạn). 

Chỉ mất khi bạn tự ý reset qua webhook.