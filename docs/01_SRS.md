# Đặc tả yêu cầu phần mềm - Smart Travel Guide

Ngày cập nhật: 2026-06-09

## 1. Mục đích

Tài liệu mô tả phạm vi, actor, yêu cầu chức năng, yêu cầu phi chức năng và trạng thái triển khai hiện tại của Smart Travel Guide. Nội dung đã được đồng bộ theo code thật trong `src`.

## 2. Phạm vi hiện tại (đã điều chỉnh)

Project hiện là web app Next.js App Router có:

- Trang chủ tìm kiếm điểm đến, xem POI du lịch nổi bật và thời tiết theo địa điểm đã chọn (**không có bản đồ trực quan** — đã loại bỏ theo yêu cầu).
- Đăng ký bằng email OTP.
- Đăng nhập bằng email/password.
- JWT HttpOnly cookie và middleware bảo vệ `/profile`.
- Hồ sơ người dùng (thông tin, sở thích, avatar).
- Quản lý chuyến đi (CRUD).
- Lập lịch trình (itinerary) trong chi tiết trip.
- Lưu địa điểm yêu thích.
- Quản lý lịch sử tìm kiếm (API + UI trong Profile).
- Review của người dùng.
- Admin page qua webhook (stats, user management, db actions, logs).
- MongoDB/Mongoose và Redis (cache, rate limit, OTP).

Auth hiện vẫn giữ `localStorage` và `x-user-id` để tương thích UI hiện có. Đây chưa phải mô hình production hoàn chỉnh.

## 3. Actor

| Actor | Mô tả | Quyền chính |
| --- | --- | --- |
| Guest | Người chưa đăng nhập | Xem trang chủ, tìm kiếm địa điểm, xem POI/thời tiết, đăng ký, đăng nhập |
| User | Người đã đăng nhập | Quản lý profile, trips, itinerary, favorites, reviews, search history, đổi mật khẩu |
| Admin | Người quản trị | Dùng `/admin` và `/api/webhook` để xem stats/logs, khóa/mở user, bảo trì database |
| External Service | API bên ngoài | Nominatim, Overpass, Open-Meteo, Resend |

## 4. Yêu cầu chức năng

| Mã | Tên | Trạng thái code |
| --- | --- | --- |
| FR-01 | Xem trang chủ/tìm điểm đến (không bản đồ) | Hoàn thành một phần (search + POI + weather theo điểm chọn) |
| FR-02 | Tìm địa danh | Hoàn thành |
| FR-03 | Xem POI xung quanh | Hoàn thành |
| FR-04 | Xem thời tiết | Hoàn thành, dùng Open-Meteo |
| FR-05 | Đăng ký | Hoàn thành bằng OTP email |
| FR-06 | Đăng nhập | Hoàn thành mức demo, có JWT cookie và rate limit |
| FR-07 | Đăng xuất | Hoàn thành route logout cơ bản |
| FR-08 | Quản lý thông tin cá nhân | Hoàn thành một phần |
| FR-09 | Quản lý chuyến đi | Hoàn thành CRUD cơ bản |
| FR-10 | Lập lịch trình | Hoàn thành API CRUD và UI demo/báo cáo |
| FR-11 | Lưu yêu thích | Hoàn thành GET/POST/DELETE |
| FR-12 | Xem lịch sử tìm kiếm | Có API tối thiểu, chưa có UI riêng |
| FR-13a | Gợi ý rule-based | Chưa triển khai |
| FR-13b | Gợi ý AI | Ngoài phạm vi hiện tại |
| FR-14 | Quản lý người dùng admin | Hoàn thành một phần qua webhook |
| FR-15 | Quản lý địa điểm admin | Hoàn thành một phần qua webhook/cache/database actions |
| FR-16 | Xem thống kê | Hoàn thành qua webhook/admin page |
| FR-17 | Xem audit log | Hoàn thành qua webhook/admin page |

## 5. Yêu cầu phi chức năng

| Mã | Nhóm | Trạng thái |
| --- | --- | --- |
| NFR-01 | TypeScript/App Router | Đã có |
| NFR-02 | MongoDB connection reuse | Đã có trong `src/lib/mongodb.ts` |
| NFR-03 | Redis cache | Đã dùng cho search, POI, weather, OTP, avatar |
| NFR-04 | Hash mật khẩu | Đã dùng bcryptjs |
| NFR-05 | Auth/authorization | Đã có JWT cookie, middleware `/profile`, vẫn hỗ trợ `x-user-id` |
| NFR-06 | Rate limit | Đã có OTP/login/search |
| NFR-07 | Error handling | Có cơ bản, chưa chuẩn hóa tuyệt đối toàn hệ thống |
| NFR-08 | Test | Có Vitest và test tối thiểu |

## 6. Ràng buộc kỹ thuật

| Thành phần | Trạng thái thật |
| --- | --- |
| Next.js | 16.2.6 |
| React | 19.2.4 |
| TypeScript | Đã có |
| Tailwind CSS | 4.x |
| MongoDB/Mongoose | Đã có |
| Redis/ioredis | Đã có |
| Resend | Đã có |
| JWT/Jose | Đã dùng để sign/verify auth cookie |
| Vitest | Đã có test tối thiểu |

## 7. Traceability cập nhật

| Chức năng | Code liên quan | Kết luận |
| --- | --- | --- |
| Auth OTP | `src/app/api/auth/send-otp/route.ts`, `src/app/api/auth/verify-otp/route.ts` | Đã có |
| Login/logout | `src/app/api/auth/login/route.ts`, `src/app/api/auth/logout/route.ts`, `src/lib/rate-limit.ts` | Đã có |
| Profile | `src/app/api/profile/route.ts`, `src/app/profile/page.tsx` | Đã có |
| Places | `src/app/api/places/search/route.ts`, `src/app/api/places/poi/route.ts` | Đã có |
| Weather | `src/app/api/weather/route.ts`, `src/lib/weather.ts` | Đã có |
| Trips | `src/app/api/trips/route.ts`, `src/app/api/trips/[id]/route.ts` | Đã có |
| Itinerary | `src/app/api/trips/[id]/itinerary/route.ts`, `src/app/api/trips/[id]/itinerary/[itemId]/route.ts`, `src/components/profile/TripDetailModal.tsx` | Đã có |
| Favorites | `src/app/api/favorites/route.ts`, `src/app/api/favorites/[id]/route.ts` | Đã có |
| Search history | `src/app/api/search-history/route.ts`, `src/app/api/search-history/[id]/route.ts` | Có API, chưa có UI riêng |
| Admin | `src/app/admin/page.tsx`, `src/app/api/webhook/route.ts` | Đã có một phần |
