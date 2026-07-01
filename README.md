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
| `WEBHOOK_SECRET` | Secret cho admin webhook (header `x-webhook-secret`) |
| `WEBHOOK_IP_ALLOWLIST` | IP được phép chạy event phá hủy/seed. Trống ở production = từ chối các event này (bắt buộc khai báo khi deploy) |
| `CRON_SECRET` | Secret cho cron cảnh báo thời tiết (`x-cron-secret`). Production phải đặt riêng, không dùng chung `WEBHOOK_SECRET` |

> **Lưu ý reverse proxy:** IP client lấy từ `x-forwarded-for` / `x-real-ip`. Khi deploy production, Nginx/Cloudflare **phải** override/strip các header này từ client, nếu không `WEBHOOK_IP_ALLOWLIST` có thể bị bypass. Ví dụ Nginx an toàn (ghi đè, không dùng `$proxy_add_x_forwarded_for`):
>
> ```nginx
> proxy_set_header X-Forwarded-For $remote_addr;
> proxy_set_header X-Real-IP $remote_addr;
> ```
>
> Với Cloudflare: dùng `CF-Connecting-IP` và chặn truy cập trực tiếp bỏ qua CF.

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
| `npm run test:e2e` | Chạy Playwright E2E |
| `npm run test:e2e:ui` | Chạy Playwright E2E ở UI mode |

### Audit dữ liệu trùng orderIndex (trước khi bật unique index itinerary)

Script `scripts/audit-itinerary-orderindex.ts` chỉ đọc DB, liệt kê các nhóm `ItineraryItem` trùng `{ tripId, day, orderIndex }`. Chạy trước khi bật unique index:

```bash
npx tsx scripts/audit-itinerary-orderindex.ts
```

Script đọc `MONGODB_URI` từ `.env` (không tự sửa DB). Exit code: `0` nếu sạch, `1` nếu phát hiện trùng, `2` nếu lỗi/thiếu cấu hình.

### Migration index DB (chạy khi nâng cấp production)

Hai migration index dưới đây mặc định **dry-run** (chỉ in kế hoạch), thêm `--apply` để thực thi. Idempotent, an toàn chạy lại. Ở môi trường dev/test, Mongoose tự build index theo schema nên không bắt buộc; chỉ cần ở production có dữ liệu sẵn.

```bash
# Email: unique toàn cục → partial unique (chỉ khi deletedAt = null) → cho đăng ký lại sau soft-delete
npx tsx scripts/migrate-user-email-partial-index.ts
npx tsx scripts/migrate-user-email-partial-index.ts --apply

# Checklist: unique index { tripId, label } collation case-insensitive + Unicode-normalized
# (chống trùng nhãn khác hoa/thường hoặc khác dạng NFC/NFD). Kiểm tra trùng trước khi tạo.
npx tsx scripts/migrate-checklist-unique-index.ts
npx tsx scripts/migrate-checklist-unique-index.ts --apply --i-have-backup
```

> **⚠️ Checklist index dùng collation — đổi collation = DROP + CREATE lại index.** Trong khoảng giữa
> drop và create, uniqueness `{ tripId, label }` **không được enforce**. Vì vậy:
> - `--apply` **bắt buộc** kèm `--i-have-backup` (script từ chối nếu thiếu) và phải chạy trong **maintenance window**.
> - Script log mốc thời gian `BẮT ĐẦU`/`KẾT THÚC` cửa sổ (drop→recreate) để theo dõi.
> - **Rollback** nếu CREATE lại thất bại — tạm khôi phục enforce bằng index không-collation rồi điều tra dữ liệu trùng:
>   ```js
>   db.trip_checklists.createIndex({ tripId: 1, label: 1 }, { unique: true, sparse: true })
>   ```
> - Bước aggregation phát hiện trùng vẫn chạy và **dừng** trước khi drop nếu còn dữ liệu trùng.

### Tính năng Khách sạn

Mục "Khách sạn" trên header → trang `/hotels` (tìm theo điểm đến) và phần "Khách sạn gợi ý" trong chi tiết chuyến đi (gợi ý theo `destination` của trip, có thể "Lưu vào chuyến đi" → `TripAccommodation`). Matching chuẩn hóa tiếng Việt, ưu tiên tỉnh/thành → khu vực → tên/điểm đến → tọa độ → keyword; không trả sai tỉnh khi tỉnh đã rõ.

**Lưu ý dữ liệu:** dataset khách sạn **không tự có** — DB trống cho tới khi chạy script import. Một số khách sạn OSM thiếu `stars`/`addr:district` nên `rating`/`district` có thể trống (UI đã guard). Tỉnh nào chưa import thì trang/section khách sạn sẽ hiện empty state — cần import thêm tỉnh đó.

**Rủi ro deploy:** nếu deploy mà DB production chưa import `hotels`, tính năng khách sạn sẽ luôn trống (không lỗi, chỉ empty). Chạy import (mục dưới) trước hoặc sau deploy để có dữ liệu.

### Import dataset khách sạn từ OpenStreetMap

Dataset khách sạn (collection `hotels`, tách biệt `trip_accommodations` của từng chuyến đi) được lấy từ OpenStreetMap Overpass (`tourism=hotel|guest_house|hostel|resort|apartment|motel`) — miễn phí, không cần API key. Mỗi bản ghi có: `name`, `province`, `provinceKey`, `district`, `address`, `lat/lng`, `rating` (từ `stars`), `priceLevel`, `source='osm'`.

```bash
npx tsx scripts/import-hotels-osm.ts                       # dry-run tất cả tỉnh hub
npx tsx scripts/import-hotels-osm.ts --import              # ghi DB tất cả tỉnh hub
npx tsx scripts/import-hotels-osm.ts --import --province="Da Nang"  # một tỉnh
npx tsx scripts/import-hotels-osm.ts --import --radius=10000        # bán kính (m), clamp 1000–100000
npx tsx scripts/import-hotels-osm.ts --import --limit=200           # giới hạn số khách sạn/tỉnh, clamp 1–5000
```

Mặc định là dry-run (không ghi DB). Upsert theo `osmId` nên chạy lại an toàn. Lỗi mạng/Overpass 429/504 được bỏ qua từng tỉnh, không làm hỏng các tỉnh khác. Mỗi lần chạy in tổng kết coverage: số lấy được, sau loại trùng, số thiếu district/tọa độ/rating, số có ảnh, số tỉnh lỗi (và số upsert/cập nhật nếu `--import`). API `/api/hotels/search` (query `destination`/`province`/`district`/`lat`/`lng`/`limit`) match khách sạn theo khu vực, không trả sai tỉnh khi đã rõ tỉnh. Import cũng lấy tag `image`/`wikimedia_commons` của OSM làm ảnh thật (độ phủ thấp ~1%); khách sạn không có ảnh OSM dùng ảnh đại diện từ bộ ảnh khách sạn Unsplash (`src/data/hotel-photos.ts`, gán cố định theo id, hotlink free) — fallback gradient nếu ảnh lỗi tải.

### Trang chi tiết khách sạn + đánh giá

`/hotels/[id]` hiển thị chi tiết một khách sạn (gallery, địa chỉ, Google Maps), **đánh giá thật do người dùng app viết** và "Khách sạn khác cùng tỉnh".

Review là user-generated (collection `hotel_reviews`): người dùng đăng nhập tự chấm sao (1–5) + viết nhận xét, mỗi người 1 đánh giá/khách sạn (sửa/xoá được của mình). Trang hiển thị điểm trung bình, **phân bố theo từng mức sao (5★→1★) + lọc review theo sao**, và danh sách kèm tên người đánh giá + thời gian. API: `GET/POST /api/hotels/[id]/reviews`, `DELETE /api/hotels/[id]/reviews/[reviewId]`. Miễn phí, không cần key.

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
| GET | `/api/hotels/search` | Tìm khách sạn theo khu vực (collection `hotels`), Redis cache, rate limit |
| GET | `/api/hotels/[id]` | Chi tiết 1 khách sạn |
| GET/POST | `/api/hotels/[id]/reviews` | Đánh giá thật của người dùng: liệt kê + tổng hợp + phân bố sao / đăng (upsert) |
| DELETE | `/api/hotels/[id]/reviews/[reviewId]` | Xoá đánh giá của chính mình |
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
| PATCH | `/api/trips/[id]/itinerary/reorder` | Sắp xếp lại thứ tự itinerary (2 pha + compensating write) |
| POST | `/api/trips/[id]/checklist/bulk` | Thêm nhiều checklist item theo batch (template hoặc list) |
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

## Testing

### Unit & Integration Tests

```bash
npm test
```

> Cần MongoDB + Redis đang chạy (`docker compose up -d`). `tests/setupEnv.ts` tự thêm hậu tố `_test` vào tên DB nên test không đụng dữ liệu dev.

### E2E Tests (Playwright)

```bash
# Cài đặt browsers lần đầu
npx playwright install

# Chạy smoke test
npm run test:e2e

# Chạy với UI mode
npx playwright test --ui
```

## API Reference

### PATCH /api/trips/:id/checklist/bulk → thực tế là `POST /api/trips/:id/checklist/bulk`

Thêm nhiều checklist item vào chuyến đi theo batch. Yêu cầu quyền EDIT (chủ trip hoặc cộng tác viên). Khử trùng lặp theo nhãn (chuẩn hoá trim + lowercase) ở tầng ứng dụng; tầng DB có thêm unique index `{ tripId, label }` chống race condition.

**Body (một trong hai):**

```json
{ "templateId": "beach" }
```

```json
{ "items": ["Mua vé máy bay", "Đặt khách sạn"] }
```

**Response 201:**

```json
{
  "success": true,
  "status": 201,
  "data": { "added": 2, "skipped": 0, "items": [ /* checklist items */ ] },
  "message": "Đã thêm 2 mục."
}
```

**Response 409** (một request song song vừa thêm cùng nhãn — unique index `{ tripId, label }`):

```json
{
  "success": false,
  "status": 409,
  "error": { "code": "CONFLICT", "message": "Một số mục đã được thêm bởi thao tác khác. Vui lòng tải lại và thử lại.", "details": { "duplicates": ["Mua vé máy bay"] } }
}
```

### PATCH /api/trips/:id/itinerary/reorder

Sắp xếp lại thứ tự itinerary theo `orderedIds`. Chạy 2 pha (gán `orderIndex` âm tạm thời → gán giá trị cuối) để không vi phạm unique index `{ tripId, day, orderIndex }`. Vì MongoDB ở môi trường này là standalone (không có replica set, không dùng transaction), nếu một pha thất bại sẽ tự **compensating write** khôi phục `orderIndex` về giá trị gốc.

**Body:**

```json
{ "orderedIds": ["<itemId1>", "<itemId2>", "<itemId3>"] }
```

**Response 200:**

```json
{ "success": true, "status": 200, "data": { "message": "Đã cập nhật thứ tự lịch trình", "modified": 3, "orderedIds": ["..."] } }
```

## Chức năng còn thiếu hoặc chưa hoàn chỉnh

| Hạng mục | Trạng thái |
| --- | --- |
| Bản đồ trực quan/marker/popup | **Đã loại bỏ** khỏi phạm vi theo yêu cầu |
| Add-to-trip trực tiếp từ search result | ✅ Đã có (nút "Thêm" trên mỗi kết quả trong dropdown tìm kiếm) |
| Cập nhật thông tin trip đầy đủ | ✅ Form sửa trip đủ trường (title, điểm đến, ngày, mô tả, ảnh bìa, công khai) |
| Test integration mở rộng (trips, itinerary, favorites...) | Có một số, cần bổ sung thêm |
| Responsive + polish UI | Đang thực hiện |
| Production deployment | Chưa có cấu hình riêng |
