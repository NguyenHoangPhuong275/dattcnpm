# Kế hoạch Chi tiết Tuần 2 - Smart Travel Guide

Ngày cập nhật: 2026-06-09

## 1. Mục tiêu Tuần 2

Hiện thực các tính năng lõi: Auth, Places Search, POI, Weather, Trips, Itinerary, Favorites, Profile, Search History tối thiểu và Admin webhook. Mục tiêu là app chạy ổn định ở mức demo/báo cáo và tài liệu phản ánh đúng code thật.

## 2. Checklist backend/API

- [x] Auth đăng ký qua OTP: `POST /api/auth/send-otp`, `POST /api/auth/verify-otp`.
- [x] Auth đăng nhập: `POST /api/auth/login`.
- [x] Logout route: `POST /api/auth/logout`.
- [x] JWT HttpOnly cookie: login set cookie, logout xóa cookie, API user đọc được cookie hoặc `x-user-id`.
- [x] Middleware/Guard JWT: có `middleware.ts` bảo vệ `/profile`.
- [x] Rate limit OTP: Redis key `otp:limit:{email}`.
- [x] Rate limit login: `POST /api/auth/login` dùng Redis helper với fallback bộ nhớ, giới hạn theo IP + email.
- [x] Rate limit search: `GET /api/places/search` dùng Redis helper với fallback bộ nhớ, giới hạn theo userId hoặc IP.
- [x] Places search: `GET /api/places/search?q=`.
- [x] POI: `GET /api/places/poi?lat=&lng=&radius=&type=`.
- [x] Weather: `GET /api/weather?lat=&lng=` dùng Open-Meteo.
- [x] Trips list/create: `GET /api/trips`, `POST /api/trips`.
- [x] Trips dynamic CRUD: `GET`, `PATCH`, `DELETE /api/trips/[id]`.
- [x] Itinerary list/create: `GET`, `POST /api/trips/[id]/itinerary`.
- [x] Itinerary item update/delete: `PATCH`, `DELETE /api/trips/[id]/itinerary/[itemId]`.
- [x] Favorites list/create/delete: `GET`, `POST /api/favorites`, `DELETE /api/favorites/[id]`.
- [x] Search history tối thiểu: `GET`, `POST`, `DELETE /api/search-history`, `DELETE /api/search-history/[id]`.
- [x] Audit log tối thiểu cho auth/trip/itinerary.
- [x] Admin webhook: `/api/webhook`.
- [x] Validate input bằng Zod ở Places/POI/Weather/Login/Search History.
- [x] Validate input các API nghiệp vụ: đã chuẩn hóa Zod toàn bộ route nghiệp vụ (auth, profile, trips, itinerary, favorites, search, places, weather).
- [x] Error handling: đã chuẩn hóa tuyệt đối với helper chung (src/lib/http.ts) + mã lỗi rõ ràng (VALIDATION_ERROR, UNAUTHORIZED, RATE_LIMITED...).

## 3. Checklist frontend

- [x] Trang Login/Register.
- [x] Modal Login/Register trên trang chủ.
- [x] Trang chủ có search địa danh, POI và weather.
- [x] Trang Profile có thông tin cá nhân, sở thích, trips, favorites, reviews, security.
- [x] UI tạo trip và danh sách trip.
- [x] Trip detail có itinerary UI mức demo/báo cáo, gọi API thật để lấy/thêm/sửa/xóa item.
- [x] Admin page qua webhook.
- [x] Search history UI riêng đã có (tab "Lịch sử tìm kiếm" trong Profile, component SearchHistorySection, gọi API thật, có preview kết quả, xóa từng mục / xóa hết).

## 4. Trạng thái theo ngày kế hoạch

| Ngày | Theo kế hoạch | Trạng thái hiện tại |
| --- | --- | --- |
| Ngày 8 | Schema, bcrypt, JWT helper, requireAuth | Đã có schema, bcrypt, JWT helper, middleware profile |
| Ngày 9 | Register/Login/Logout + rate limit login | Đã có OTP register, login, logout, rate limit login |
| Ngày 10 | Places search + cache + DB upsert | Đã có |
| Ngày 11 | POI + Weather + search rate limit | Đã có POI, Weather, search rate limit |
| Ngày 12 | Trips CRUD + audit log | Đã có GET/POST/PATCH/DELETE và audit log tạo/sửa/xóa trip |
| Ngày 13 | Itinerary + Favorites | Đã có favorites và itinerary API CRUD |
| Ngày 14 | UI demo + lint/build/test | UI demo đã có; lint/typecheck/test/build cần chạy trước khi nộp |

## 5. Test coverage

| Nhóm | Trạng thái | Bằng chứng |
| --- | --- | --- |
| Auth token | Có test tối thiểu | `src/lib/auth.test.ts` |
| Logout | Có test tối thiểu | `src/app/api/auth/logout/route.test.ts` |
| Rate limit helper | Có test fallback/IP | `src/lib/rate-limit.test.ts` |
| Weather utils | Có test tiện ích | `src/__tests__/weather-utils.test.ts` |
| API DB thật | Đã có integration test (Mongo + Redis thật) | tests/integration/*.integration.test.ts + .env.test.example |

## 6. Kết luận Tuần 2

Tuần 2 đã hoàn thành đầy đủ các hạng mục theo kế hoạch (bao gồm Search History UI, Zod validation toàn bộ API nghiệp vụ, chuẩn hóa error response với mã lỗi thống nhất, và integration test kết nối MongoDB/Redis thật). Xem chi tiết checklist đã check.
