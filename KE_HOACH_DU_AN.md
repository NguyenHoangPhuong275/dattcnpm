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

Project đã hoàn thành Tuần 1 theo phạm vi repo hiện tại, trừ mục commit/push GitHub vì không đủ dữ liệu để xác minh. Tuần 2 đã hoàn thành phần lõi phục vụ demo/báo cáo: auth OTP/login/logout, JWT cookie, middleware profile, places search, POI, weather, trips, itinerary, favorites, search history API + UI, rate limit OTP/login/search và test tối thiểu.

**Điều chỉnh phạm vi (cập nhật 2026-06-11):** Theo yêu cầu, **phần bản đồ trực quan, marker, popup và plan trải nghiệm khám phá của Tuần 3 đã được loại bỏ hoàn toàn**. Tuần 3 chỉ ghi nhận search + POI + Weather + Search History UI đã có. Các kế hoạch Tuần 4-6 được điều chỉnh ưu tiên sang luồng "Add place từ search vào trip", hoàn thiện Trip/Itinerary UI, test integration và polish.

## 3. Module hiện có

| Module | Trạng thái | File chính |
| --- | --- | --- |
| Home/Search | Đã có search, POI, weather (bản đồ trực quan đã lược bỏ) | `src/app/page.tsx` |
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
| Search History | Đã có API và UI trong profile | `src/app/api/search-history/route.ts`, `src/app/api/search-history/[id]/route.ts`, `src/components/profile/SearchHistorySection.tsx` |
| Reviews | Đã có list review của user | `src/app/api/reviews/my/route.ts` |
| Admin | Đã có qua webhook | `src/app/admin/page.tsx`, `src/app/api/webhook/route.ts` |
| Tests | Đã có test tối thiểu | `src/lib/auth.test.ts`, `src/lib/rate-limit.test.ts`, `src/app/api/auth/logout/route.test.ts`, `src/__tests__/weather-utils.test.ts` |

## 4. Tổng quan tiến độ theo tuần

| Tuần | Mục tiêu | Trạng thái |
| --- | --- | --- |
| Tuần 1 | Tài liệu phân tích, scaffold, MongoDB/Redis, health/debug, env mẫu, Docker local | Hoàn thành trong repo; commit/push GitHub không đủ dữ liệu để xác minh |
| Tuần 2 | Auth, Places, Weather, Trips, Favorites, Itinerary, Search History API, UI demo, rate limit, test tối thiểu | Hoàn thành phần lõi demo/báo cáo |
| Tuần 3 | Scope rút gọn: Search + POI + Weather + Search History UI; không còn bản đồ/trải nghiệm khám phá | Đã hoàn thành theo điều chỉnh |
| Tuần 4 | Trip/itinerary đầy đủ, search history UI, add place to trip | Đã có plan chi tiết; API lõi đã có, UI nâng cao chưa xong |
| Tuần 5 | Admin hoàn thiện, test integration, responsive polish, security review | Đã có plan chi tiết, chưa hoàn thành code |
| Tuần 6 | Báo cáo, slide, demo script, rà soát tài liệu-code | Đã có plan chi tiết, chưa hoàn thành bàn giao cuối |

## 5. Việc cần làm tiếp theo (phạm vi mới - không còn bản đồ)

### Ưu tiên cao (cho demo/report tốt)

- Thêm action **Add-to-trip / Add to existing itinerary** trực tiếp từ kết quả tìm kiếm trên trang chủ (luồng quan trọng nhất sau khi bỏ map).
- Hoàn thiện UI edit trip (tên, mô tả, ngày) và reorder itinerary item nếu cần.
- Đảm bảo TripDetailModal mượt mà (loading, error, empty states).

### Ưu tiên trung bình

- Bổ sung integration test cho trips, itinerary, favorites, places/weather (với MongoDB/Redis thật).
- Rà soát và polish responsive trên toàn bộ home + profile + admin.
- Chuẩn hóa error/empty/loading state nhất quán.

### Ưu tiên thấp / ngoài phạm vi hiện tại

- Gợi ý (rule-based hoặc AI)
- Export PDF lịch trình
- Routing (OSRM)
- Admin nâng cao hơn (nếu thời gian còn)

**Lưu ý:** Vì bản đồ và plan trải nghiệm khám phá Tuần 3 đã bị bỏ, luồng chính của app giờ là: **Tìm kiếm điểm đến → Xem weather/POI → Tạo trip hoặc thêm vào trip có sẵn → Quản lý itinerary chi tiết**. Cần tập trung làm mượt luồng này.

## 6. Definition of Done cập nhật

- App chạy được bằng `npm run dev`.
- MongoDB/Redis có hướng dẫn local qua `.env.example` và `docker-compose.yml`.
- API report khớp route thật.
- Docs không ghi tính năng chưa có là đã hoàn thành.
- Lint/build/test được chạy và báo cáo kết quả thật.
- Báo cáo nêu rõ auth hiện vẫn hỗ trợ `x-user-id` để tương thích UI, chưa phải mô hình production hoàn chỉnh.
