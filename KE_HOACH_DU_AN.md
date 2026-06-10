# Kế hoạch dự án - Smart Travel Guide

Ngày cập nhật: 2026-06-09

## 1. Thông tin chung

| Mục | Nội dung |
| --- | --- |
| Tên đề tài | Smart Travel Guide |
| Loại sản phẩm | Web application responsive |
| Framework | Next.js 16 App Router |
| Ngôn ngữ | TypeScript |
| Database | MongoDB qua Mongoose |
| Cache/OTP/Rate limit | Redis qua ioredis |
| Email | Resend |
| UI | React 19, Tailwind CSS 4 |
| Test | Vitest |

## 2. Trạng thái hiện tại

Project đã hoàn thành Tuần 1 theo phạm vi repo hiện tại, trừ mục commit/push GitHub vì không đủ dữ liệu để xác minh. Tuần 2 đã hoàn thành phần lõi phục vụ demo/báo cáo: auth OTP/login/logout, JWT cookie, middleware profile, places search, POI, weather, trips, itinerary, favorites, search history API tối thiểu, rate limit OTP/login/search và test tối thiểu.

Tuần 3-6 đã có tài liệu nghiệp vụ chi tiết, nhưng code cho các mục lớn của Tuần 3-6 chưa hoàn thành toàn bộ. Không đánh dấu các tuần này là hoàn thành.

## 3. Module hiện có

| Module | Trạng thái | File chính |
| --- | --- | --- |
| Home/Search | Đã có search, POI, weather; chưa có bản đồ trực quan | `src/app/page.tsx` |
| Auth OTP | Đã có | `src/app/api/auth/send-otp/route.ts`, `src/app/api/auth/verify-otp/route.ts` |
| Login/Logout | Đã có JWT cookie, logout và rate limit login | `src/app/api/auth/login/route.ts`, `src/app/api/auth/logout/route.ts` |
| Middleware | Đã có guard `/profile` | `middleware.ts` |
| Profile | Đã có | `src/app/profile/page.tsx`, `src/app/api/profile/route.ts` |
| Password change | Đã có | `src/app/api/profile/password/route.ts` |
| Places search | Đã có, có Redis cache và rate limit search | `src/app/api/places/search/route.ts` |
| POI | Đã có | `src/app/api/places/poi/route.ts` |
| Weather | Đã có, dùng Open-Meteo | `src/app/api/weather/route.ts`, `src/lib/weather.ts` |
| Trips | Đã có CRUD cơ bản | `src/app/api/trips/route.ts`, `src/app/api/trips/[id]/route.ts` |
| Itinerary | Đã có API CRUD và UI demo trong trip detail | `src/app/api/trips/[id]/itinerary/route.ts`, `src/app/api/trips/[id]/itinerary/[itemId]/route.ts`, `src/components/profile/TripDetailModal.tsx` |
| Favorites | Đã có GET/POST/DELETE | `src/app/api/favorites/route.ts`, `src/app/api/favorites/[id]/route.ts` |
| Search History | Đã có API tối thiểu, chưa có UI riêng | `src/app/api/search-history/route.ts`, `src/app/api/search-history/[id]/route.ts` |
| Reviews | Đã có list review của user | `src/app/api/reviews/my/route.ts` |
| Admin | Đã có qua webhook | `src/app/admin/page.tsx`, `src/app/api/webhook/route.ts` |
| Tests | Đã có test tối thiểu | `src/lib/auth.test.ts`, `src/lib/rate-limit.test.ts`, `src/app/api/auth/logout/route.test.ts`, `src/__tests__/weather-utils.test.ts` |

## 4. Tổng quan tiến độ theo tuần

| Tuần | Mục tiêu | Trạng thái |
| --- | --- | --- |
| Tuần 1 | Tài liệu phân tích, scaffold, MongoDB/Redis, health/debug, env mẫu, Docker local | Hoàn thành trong repo; commit/push GitHub không đủ dữ liệu để xác minh |
| Tuần 2 | Auth, Places, Weather, Trips, Favorites, Itinerary, Search History API, UI demo, rate limit, test tối thiểu | Hoàn thành phần lõi demo/báo cáo |
| Tuần 3 | Bản đồ trực quan, marker, popup, trải nghiệm search/map tốt hơn | Đã có plan chi tiết, chưa hoàn thành code |
| Tuần 4 | Trip/itinerary đầy đủ, search history UI, add place to trip | Đã có plan chi tiết; API lõi đã có, UI nâng cao chưa xong |
| Tuần 5 | Admin hoàn thiện, test integration, responsive polish, security review | Đã có plan chi tiết, chưa hoàn thành code |
| Tuần 6 | Báo cáo, slide, demo script, rà soát tài liệu-code | Đã có plan chi tiết, chưa hoàn thành bàn giao cuối |

## 5. Việc cần làm tiếp theo

### Ưu tiên cao

- Thêm bản đồ, marker và popup địa điểm cho Tuần 3.
- Thêm UI search history riêng.
- Thêm action add-to-trip trực tiếp từ kết quả search.

### Ưu tiên trung bình

- Chuẩn hóa Zod cho toàn bộ API nghiệp vụ.
- Bổ sung test integration cho trips, itinerary, favorites, places/weather với MongoDB/Redis test.
- Rà responsive toàn bộ profile/home/admin.

### Ưu tiên thấp

- Tích hợp OSRM routing.
- Gợi ý rule-based hoặc AI.
- Export PDF.

## 6. Definition of Done cập nhật

- App chạy được bằng `npm run dev`.
- MongoDB/Redis có hướng dẫn local qua `.env.example` và `docker-compose.yml`.
- API report khớp route thật.
- Docs không ghi tính năng chưa có là đã hoàn thành.
- Lint/build/test được chạy và báo cáo kết quả thật.
- Báo cáo nêu rõ auth hiện vẫn hỗ trợ `x-user-id` để tương thích UI, chưa phải mô hình production hoàn chỉnh.
