# Smart Travel Guide

Smart Travel Guide là web app hỗ trợ tìm kiếm địa điểm du lịch, xem POI/thời tiết, quản lý hồ sơ người dùng, lưu địa điểm yêu thích, tạo chuyến đi và lập lịch trình cá nhân.

Project phục vụ môn Đồ án Thực tế Công nghệ Phần mềm.

## Trạng thái hiện tại (cập nhật 2026-06-11)

Tuần 1 đã hoàn thành. Tuần 2 đã hoàn thành phần lõi ở mức demo/báo cáo (auth, places, weather, trips, itinerary, favorites, search history).

**Phạm vi điều chỉnh:** Bản đồ trực quan, marker, popup map và plan trải nghiệm khám phá của Tuần 3 **đã được loại bỏ hoàn toàn**. Tuần 3 chỉ ghi nhận phần đã có: search + POI + Weather + Search History UI. Tiếp theo ưu tiên luồng tạo/add vào trip, hoàn thiện quản lý lịch trình, test và polish.

Tuần 3 đã hoàn thành theo scope rút gọn. Code hiện tập trung hoàn thiện luồng "tìm kiếm → thêm vào trip/itinerary", polish Trip UI, test integration và responsive. Tuần 4-6 còn lại chủ yếu là add-to-trip từ search, integration test, polish và final verification.

## Stack hiện tại

| Nhóm | Công nghệ |
| --- | --- |
| Framework | Next.js 16.2.6 App Router |
| Ngôn ngữ | TypeScript |
| UI | React 19, Tailwind CSS 4 |
| Database | MongoDB qua Mongoose |
| Cache/OTP/Rate limit | Redis qua ioredis |
| Email OTP | Resend |
| Validation | Zod và validation thủ công ở một số API nghiệp vụ |
| Password hash | bcryptjs |
| Auth token | jose JWT |
| Test runner | Vitest |

Auth hiện set HttpOnly JWT cookie khi login và vẫn giữ `localStorage` + `x-user-id` để tương thích UI hiện có. Các API user đọc được `x-user-id` hoặc JWT cookie. Middleware đã bảo vệ `/profile`.

Font chuẩn toàn hệ thống là **Be Vietnam Pro**, khai báo bằng `next/font/google` trong `src/app/layout.tsx` và map vào `--font-sans`, `--font-display` tại `src/app/globals.css`. Form controls kế thừa cùng font để hiển thị tiếng Việt có dấu nhất quán trên desktop và mobile browser.

## Cấu trúc thư mục chính

```
DATTCNPM/
  docs/
  public/images/
  scripts/
  src/
    app/
      admin/
      api/
      login/
      profile/
      register/
    components/
    database/
    hooks/
    lib/
    types/
  .env.example
  docker-compose.yml
  API_REPORT.md
  KE_HOACH_DU_AN.md
  package.json
  README.md
```

## Cài đặt local

1. Cài dependencies:

```bash
npm install
```

2. Tạo file môi trường:

```bash
copy .env.example .env
```

3. Chạy MongoDB và Redis local nếu không dùng dịch vụ cloud:

```bash
docker compose up -d
```

4. Chạy dev server:

```bash
npm run dev
```

Ứng dụng chạy tại `http://localhost:3000`.

## Biến môi trường

| Biến | Mục đích |
| --- | --- |
| `MONGODB_URI` | Kết nối MongoDB |
| `REDIS_URL` | Kết nối Redis |
| `JWT_SECRET` | Secret ký JWT auth cookie |
| `NEXT_PUBLIC_APP_URL` | URL app |
| `ENABLE_DEFAULT_TEST_ACCOUNT` | Bật/tắt tài khoản test mặc định |
| `DEFAULT_TEST_EMAIL` | Email test mặc định |
| `DEFAULT_TEST_PASSWORD` | Mật khẩu test mặc định |
| `API_KEY_RESEND` | API key Resend |
| `WEBHOOK_SECRET` | Secret cho admin webhook |

## Scripts thật

| Lệnh | Mục đích |
| --- | --- |
| `npm run dev` | Chạy dev server |
| `npm run build` | Build production |
| `npm run start` | Chạy production server sau build |
| `npm run lint` | Chạy ESLint |
| `npm run lint:fix` | Chạy ESLint fix |
| `npm run typecheck` | Chạy TypeScript no emit |
| `npm test` | Chạy Vitest |
| `npm run test:ui` | Chạy Vitest UI |
| `npm run test:coverage` | Chạy Vitest coverage |

## API chính hiện có

| Method | Path | Ghi chú |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| GET | `/api/debug/db` | Kiểm tra MongoDB |
| GET | `/api/debug/redis` | Kiểm tra Redis |
| POST | `/api/auth/login` | Đăng nhập, JWT cookie, rate limit |
| POST | `/api/auth/logout` | Logout, xóa auth cookie |
| POST | `/api/auth/send-otp` | Gửi OTP đăng ký |
| POST | `/api/auth/verify-otp` | Xác minh OTP và tạo user |
| GET | `/api/profile` | Lấy profile |
| PATCH | `/api/profile` | Cập nhật profile |
| POST | `/api/profile/password` | Đổi mật khẩu |
| GET | `/api/places/search` | Tìm địa điểm bằng Nominatim/Overpass, Redis cache, rate limit |
| GET | `/api/places/poi` | Tìm POI quanh tọa độ |
| GET | `/api/weather` | Thời tiết Open-Meteo |
| GET | `/api/trips` | Danh sách trip |
| POST | `/api/trips` | Tạo trip |
| GET | `/api/trips/[id]` | Chi tiết trip |
| PATCH | `/api/trips/[id]` | Cập nhật trip |
| DELETE | `/api/trips/[id]` | Xóa trip |
| GET | `/api/trips/[id]/itinerary` | Danh sách itinerary |
| POST | `/api/trips/[id]/itinerary` | Thêm itinerary item |
| PATCH | `/api/trips/[id]/itinerary/[itemId]` | Sửa itinerary item |
| DELETE | `/api/trips/[id]/itinerary/[itemId]` | Xóa itinerary item |
| GET | `/api/favorites` | Danh sách yêu thích |
| POST | `/api/favorites` | Thêm yêu thích |
| DELETE | `/api/favorites/[id]` | Xóa yêu thích |
| GET | `/api/search-history` | Danh sách lịch sử tìm kiếm |
| POST | `/api/search-history` | Thêm lịch sử tìm kiếm |
| DELETE | `/api/search-history` | Xóa toàn bộ lịch sử tìm kiếm |
| DELETE | `/api/search-history/[id]` | Xóa một bản ghi lịch sử |
| GET | `/api/reviews/my` | Review của user |
| POST | `/api/webhook` | Admin/maintenance events |

## Kiểm tra

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Chức năng còn thiếu hoặc chưa hoàn chỉnh

| Hạng mục | Trạng thái |
| --- | --- |
| Bản đồ trực quan/marker/popup | **Đã loại bỏ** khỏi phạm vi theo yêu cầu |
| Add-to-trip trực tiếp từ search result | Chưa triển khai (**ưu tiên cao**) |
| Cập nhật thông tin trip đầy đủ | API có, UI còn cơ bản |
| Test integration mở rộng (trips, itinerary, favorites...) | Có một số, cần bổ sung thêm |
| Responsive + polish UI | Đang thực hiện |
| Production deployment | Chưa có cấu hình riêng |
