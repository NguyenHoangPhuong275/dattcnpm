# Kế hoạch dự án - Smart Travel Guide

Ngày cập nhật: 2026-07-14

**Security & maintainability pass (12/06):**
- Completed P0 items: debug route blocking (SEC-01/02/03), webhook secret (SEC-04), N+1 broadcast + logAudit (BUG-03/04).
- P1: Removed localStorage user data (SEC-05), validation schemas split by domain (Q-01).
- Selected P2: Cleaned lib/index barrel (Q-02), mock production guard (Q-03), added types/ entrypoints (Q-04), marked proxy.ts legacy (STR-03).
- Lint clean on main code; typecheck has some pre-existing issues in route date handling (not part of this scope).

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
| UI | React, Tailwind CSS |
| Test | Vitest |

## 2. Trạng thái hiện tại

Project đã triển khai các module chính trong phạm vi repo hiện tại: auth OTP/login/logout, JWT cookie, middleware bảo vệ route, places search, POI, weather, khách sạn, đặt phòng, tra cứu hãng/lịch bay, đặt vé máy bay, ghi nhận thanh toán nội bộ, trips (lịch trình, ngân sách, checklist, chỗ ở, cộng tác viên, chia sẻ công khai), favorites, search history, đánh giá kèm report, cảnh báo thời tiết tự động, trang quản trị và rate limit. Trạng thái kiểm chứng của đợt refactor được ghi tại `docs/05_REFACTORING.md`; không suy diễn toàn bộ test/build đã pass khi chưa có kết quả hoàn tất.

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
| Itinerary | Đã có API CRUD và UI trong trip detail | `src/app/api/trips/[id]/itinerary/route.ts`, `src/app/api/trips/[id]/itinerary/[itemId]/route.ts`, `src/components/profile/TripDetailModal.tsx` |
| Favorites | Đã có GET/POST/DELETE | `src/app/api/favorites/route.ts`, `src/app/api/favorites/[id]/route.ts` |
| Search History | Đã có API và UI trong profile | `src/app/api/search-history/route.ts`, `src/app/api/search-history/[id]/route.ts`, `src/components/profile/SearchHistorySection.tsx` |
| Reviews | Đã có list review của user | `src/app/api/reviews/my/route.ts` |
| Admin | Đã có qua webhook | `src/app/admin/page.tsx`, `src/app/api/webhook/route.ts` |
| Tests | Đã có test tối thiểu | `src/lib/auth.test.ts`, `src/lib/rate-limit.test.ts`, `src/app/api/auth/logout/route.test.ts`, `src/__tests__/weather-utils.test.ts` |

## 4. Tổng quan tiến độ theo tuần

| Tuần | Mục tiêu | Trạng thái |
| --- | --- | --- |
| Tuần 1 | Tài liệu phân tích, scaffold, MongoDB/Redis, health/debug, env mẫu, Docker local | Hoàn thành |
| Tuần 2 | Auth, Places, Weather, Trips, Favorites, Itinerary, Search History API, UI, rate limit, test | Hoàn thành |
| Tuần 3 | Scope rút gọn: Search + POI + Weather + Search History UI; không còn bản đồ/trải nghiệm khám phá | Hoàn thành theo điều chỉnh |
| Tuần 4 | Trip/itinerary đầy đủ, search history UI, add place to trip | Hoàn thành |
| Tuần 5 | Admin hoàn thiện, test integration, responsive polish, security review | Hoàn thành |
| Tuần 6 | Báo cáo, rà soát tài liệu-code, bàn giao | Hoàn thành — báo cáo chốt trong `DATTCNPM_Smart_Travel_Guide.docx` |

## 5. Hướng phát triển tiếp theo

- Tích hợp cổng thanh toán thật, webhook xác minh giao dịch, đối soát và hoàn tiền; luồng hiện tại chỉ hiển thị QR và ghi nhận xác nhận chuyển khoản nội bộ.
- Gợi ý bằng AI nâng cao (thay cho gợi ý theo tag/sở thích hiện có).
- Mở rộng bộ kiểm thử E2E (Playwright) cho các luồng ngân sách, checklist, chia sẻ, report đánh giá.
- Cấu hình triển khai production chính thức (CI/CD, hosting, giám sát).
- Đa ngôn ngữ giao diện (hiện tại chỉ có tiếng Việt).

Luồng chính của app: **Tìm kiếm điểm đến → Xem weather/POI → Tạo trip hoặc thêm vào trip có sẵn → Quản lý lịch trình chi tiết (ngân sách, checklist, chỗ ở, cộng tác viên, chia sẻ)**.

## 6. Definition of Done

- App chạy được bằng `npm run dev`.
- MongoDB/Redis có hướng dẫn local qua `.env.example` và `docker-compose.yml`.
- API report khớp route thật.
- Docs không ghi tính năng chưa có là đã hoàn thành.
- Lint/typecheck/build/test được chạy và báo cáo kết quả thật.
- Auth dùng JWT HttpOnly cookie; header `x-user-id` chỉ hoạt động trong môi trường test.
