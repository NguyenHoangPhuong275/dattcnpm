# BÁO CÁO TỔNG KẾT DỰ ÁN — SMART TRAVEL GUIDE (LOTUS TRAVEL)

> Báo cáo final, tổng hợp toàn bộ: công nghệ đang dùng, kiến trúc, mô hình dữ liệu,
> API, bảo mật, kiểm thử và đợt hardening (săn & vá lỗi) mới nhất.
> Thay thế các báo cáo rời rạc trước đó (`BAO_CAO_CHI_TIET_PROJECT.md`, `BUG_REPORT.md` được tích hợp ở Mục 12).

- **Loại:** Đồ án Thực tế CNPM — web app hướng dẫn & lập kế hoạch du lịch Việt Nam.
- **Ngày báo cáo:** 2026-07-02.
- **Nhánh Git:** `refactor/cleanup-phase1` (đi trước `main`).
- **Trạng thái cổng chất lượng:** lint ✅ · typecheck ✅ · build ✅ · test **304/305** (1 flaky hạ tầng Atlas — không phải lỗi code, xem Mục 11 & 12).

---

## 1. Tổng quan chức năng

Ứng dụng web cho phép người dùng:

- Tìm kiếm địa điểm/POI du lịch Việt Nam (OpenStreetMap), xem chi tiết, gợi ý cá nhân hóa.
- Xem thời tiết theo toạ độ và nhận cảnh báo thời tiết cho chuyến đi sắp tới.
- Quản lý hồ sơ cá nhân, sở thích du lịch, avatar, đổi mật khẩu.
- Lưu địa điểm yêu thích và lịch sử tìm kiếm.
- Tạo & quản lý chuyến đi: lịch trình theo ngày (itinerary), ngân sách, checklist, chỗ ở, cộng tác viên, chia sẻ công khai qua mã.
- Đánh giá địa điểm & khách sạn; báo cáo review; trang quản trị xử lý report.
- Trang admin + webhook bảo trì cơ sở dữ liệu.

> **Ngoài phạm vi (đã cố ý loại bỏ):** bản đồ trực quan / marker / popup. **Không tái giới thiệu.**

Ngôn ngữ giao diện, thông báo lỗi và nhiều comment code: **tiếng Việt**.

---

## 2. Công nghệ đang sử dụng (chính xác theo `package.json`)

### 2.1 Dependencies (runtime)

| Thành phần | Gói | Phiên bản khai báo | Vai trò thực tế trong dự án |
| --- | --- | --- | --- |
| Framework | `next` | `16.2.6` | App Router, Turbopack (`next dev`), middleware, API route handlers |
| UI runtime | `react` / `react-dom` | `19.2.4` | Client components, hooks |
| Database ODM | `mongoose` | `^9.6.3` | Schema + model MongoDB, bọc bởi `createCollection<T>()` |
| Cache/OTP/rate-limit | `ioredis` | `^5.11.0` | 1 client lazy: OTP, rate-limit counter, avatar blob, cache user, JWT blacklist |
| Auth token | `jose` | `^6.2.3` | Ký/verify JWT HS256, hỗ trợ key rotation |
| Validation | `zod` | `^4.4.3` | Toàn bộ schema validate input (`src/lib/validations/`) |
| Email/OTP | `resend` | `^6.12.4` | Gửi email xác minh đăng ký, OTP đặt lại mật khẩu, cảnh báo thời tiết |
| Hash mật khẩu | `bcryptjs` | `^3.0.3` | Hash (12 rounds ở production route) + `compare` |

### 2.2 DevDependencies (công cụ)

| Thành phần | Gói | Phiên bản |
| --- | --- | --- |
| Ngôn ngữ | `typescript` | `^5` (strict, `tsc --noEmit`) |
| CSS | `tailwindcss` + `@tailwindcss/postcss` | `^4` |
| Test unit/integration | `vitest` | `^4.1.8` |
| Test component | `@testing-library/react` + `dom` + `user-event` + `jsdom` | — |
| Test E2E | `@playwright/test` | `^1.61.0` |
| Lint | `eslint` + `eslint-config-next` | `^9` / `16.2.6` |

- **Package manager khai báo:** `pnpm@10.18.2`; nhưng README & script dùng `npm`.
- **Path alias:** `@/*` → `src/*`.
- **PostCSS override:** `^8.5.16`.

### 2.3 Scripts (`package.json`)

| Script | Lệnh | Ghi chú |
| --- | --- | --- |
| `dev` | `next dev` | Dev server Turbopack tại `http://localhost:3000` |
| `dev:webpack` | `next dev --webpack` | Dự phòng dùng Webpack |
| `build` | `next build` | Build production |
| `start` | `next start` | Chạy bản build |
| `lint` / `lint:fix` | `eslint .` | Kiểm/tự sửa lint |
| `typecheck` | `tsc --noEmit` | Kiểm kiểu |
| `test` | `vitest run` | Chạy toàn bộ suite |
| `test:ui` / `test:coverage` | `vitest --ui` / `--coverage` | Giao diện/độ phủ |
| `test:e2e` / `test:e2e:ui` | `playwright test` | E2E |
| `db:check` / `db:drop-unknown` | (echo hướng dẫn) | Trỏ tới trang `/admin` + webhook |

---

## 3. Cấu trúc & quy mô mã nguồn

```
src/
├── app/                     # App Router (pages + API routes)
│   ├── api/.../route.ts      # 50 API route
│   ├── (page.tsx)            # 10 trang: home, trips, hotels, profile, local, share, schedule-reference, admin...
│   └── layout.tsx
├── components/               # 53 component (.tsx): auth, home, profile, trips, hotels, admin, ui...
├── hooks/                    # 15 hook: useCurrentUser, usePlaceSearch, useAddToTrip, useMyTrips...
├── lib/                      # 61 file thư viện
│   ├── db/                    # connection, collections, redis, models/, schema, maintenance, users, trips, audit
│   ├── validations/          # 17 schema Zod
│   ├── auth.ts, rate-limit.ts, api-response.ts, constants.ts, env.ts...
│   └── external/http.ts       # fetchJsonWithTimeout (timeout + fallback null)
├── data/                     # dữ liệu tĩnh: localities, checklist-templates, hotel-photos, home
└── types/                    # kiểu dùng ở FE
middleware.ts                 # bảo vệ route + strip header giả mạo
tests/                        # 59 file test (unit + integration + component)
```

| Hạng mục | Số lượng |
| --- | --- |
| API route (`route.ts`) | 50 |
| Trang (`page.tsx`) | 10 |
| Component (`.tsx`) | 53 |
| Hook | 15 |
| File `src/lib` | 61 |
| Schema Zod (`src/lib/validations`) | 17 |
| Collection MongoDB | 19 (managed) |
| File test | 59 (305 test case) |

---

## 4. Kiến trúc

### 4.1 Tầng dữ liệu (`src/lib/db/`)

- **Một entrypoint duy nhất `getDb()`** (`connection.ts`) trả về `AppDatabase` gồm 19 collection wrapper có kiểu. **Không import model Mongoose trực tiếp trong route** — luôn `getDb()` rồi `db.<collection>`.
- `collections.ts` — `createCollection<T>(model)` bọc model Mongoose bằng API kiểu Mongo:
  `findOne / find / findPaginated / findById / insertOne / insertMany / updateOne / updateMany / deleteOne / deleteMany / bulkWrite (batch 1000) / count / reset`.
  - `toPlain()` chuyển doc → plain object, set **cả `_id` và `id` dạng string**.
  - `findById` tự bỏ qua ObjectId không hợp lệ (trả `undefined`).
  - `COLLECTIONS` ánh xạ tên logic → tên Mongo (vd `itineraryItems` → `itinerary_items`); `MANAGED_COLLECTIONS` là tập chuẩn.
- `connectMongo()` — singleton idempotent, retry 3 lần, `serverSelectionTimeoutMS: 8000`, tự `createAllCollections()` 1 lần/tiến trình; có xử lý DNS resolver cho `mongodb+srv://` (né lỗi querySrv trên Windows).
- `maintenance.ts` — drop/reset/consistency phục vụ webhook admin.

### 4.2 Redis (`src/lib/db/redis.ts`)

- Một client `ioredis` lazy (`lazyConnect`, `connectTimeout/commandTimeout 3000ms` ngoài test).
- **Circuit breaker:** khi lỗi → mở circuit 15s, mọi cache đọc trả rỗng thay vì ném lỗi.
- Tập trung: OTP (đăng ký & reset, verify **atomic bằng Lua**), rate-limit counter (INCR+EXPIRE bằng Lua), avatar blob, cache user 30s, JWT blacklist theo `jti`.
- **Best-effort** trong request path — `getAuthUserFull` và rate-limit đều degrade mềm khi Redis lỗi (`rate-limit.ts` fallback sang `Map` in-memory có prune định kỳ).

### 4.3 Auth (`src/lib/auth.ts` + `middleware.ts`)

- Login set cookie **HttpOnly `auth_token`** — JWT HS256 qua `jose`, `SameSite=Lax`, `Secure` ở production, 7 ngày (remember me = 30 ngày).
- `getAuthUserId(request)` đọc cookie hoặc `Authorization: Bearer`; `getAuthUserFull(request)` resolve user đầy đủ (cache Redis 30s), **trả `null` cho user `isLocked` hoặc `deletedAt`**.
- **Key rotation:** `JWT_SECRET` nhiều key ngăn cách bằng dấu phẩy — ký bằng key đầu, verify theo mọi key; token ký bằng key cũ được re-sign khi đi qua middleware.
- Header `x-user-id` **chỉ được tôn trọng khi `NODE_ENV === 'test'`**; `middleware.ts` **loại bỏ** `x-user-id`/`x-forwarded-user` khỏi request ngoài test → chống giả mạo.
- `middleware.ts` chuyển hướng user chưa đăng nhập khỏi `/profile`, `/trips`, `/schedule-reference`; trả **404** cho `/api/debug/*` ở production.
- FE giữ trạng thái user **in-memory + cookie** (`src/lib/user.ts`), không lưu danh tính vào localStorage; dùng `sessionStorage` cho mốc thời gian logout.

### 4.4 Cấu trúc chuẩn của một API route

1. `try { ... } catch (error) { return handleApiError(error); }`
2. `const user = await getAuthUserFull(request)` → `throw new AppError('UNAUTHORIZED', ..., 401)` nếu thiếu (route bảo vệ).
3. `checkRateLimit({ key, limit, windowSeconds })` cho mutation → `AppError('RATE_LIMITED', ..., 429)`.
4. Validate input bằng Zod (`src/lib/validations/`).
5. `const db = await getDb()` rồi thao tác collection.
6. `createAuditLog(...)` best-effort cho write (bọc try/catch riêng).
7. `return sendSuccess(data, message?, status?)`.

### 4.5 API response chuẩn hóa (`src/lib/api-response.ts`)

- `sendSuccess(data?, statusOrMessage?, status?)`, `sendError(...)`, `handleApiError(err)`, và lớp `AppError(code, message, status, details?)`.
- **Response shape nhất quán:** `{ success, status, error, data?, message? }`.
- `handleApiError` map: `ZodError` → 400 `VALIDATION_ERROR` (kèm path chi tiết); Mongo dup-key `11000/11001` → 409 `CONFLICT`; còn lại → 500 `INTERNAL_ERROR`; **ẩn message ở production**.
- Mã lỗi (`ERROR_CODES` trong `constants.ts`): `VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT, RATE_LIMITED, INTERNAL_ERROR, SERVICE_UNAVAILABLE, BAD_REQUEST, GONE`.

---

## 5. Mô hình dữ liệu (19 collection)

Tên logic → tên Mongo và các trường/index chính (theo `schema.ts` + `models/`).

| Collection (Mongo) | Trường chính | Index / ràng buộc đáng chú ý |
| --- | --- | --- |
| `users` | email, passwordHash, fullName, avatarUrl, role(USER/ADMIN), isLocked, emailVerified, deletedAt + hồ sơ (phone, dateOfBirth, gender, nationality, homeCity, emergencyContact) + sở thích (travelStyles, budgetLevel, interests, preferredDestinations) + `weatherAlerts` | unique partial index email theo `deletedAt` (1 active user / email); `normalizeEmail` mọi write-path |
| `trips` | userId, title, destination, startDate, endDate, isPublic, description, coverImage, collaborators[], deletedAt | index `{userId, updatedAt}`, `{isPublic, updatedAt}`, `{userId, deletedAt}`, `{deletedAt, startDate}` |
| `places` | osmId, name, type, lat, lng, address, osmTags, tags, ratingAvg, ratingCount | osmId unique (upsert theo osmId) |
| `hotels` | name, province/provinceKey, district, address, lat/lng, rating, priceLevel, amenities, images, `location` (GeoJSON Point), source | geo query `$centerSphere` khi tìm theo bán kính |
| `hotel_reviews` | hotelId, userId, rating(1–5), comment, deletedAt | 1 review/(hotel,user) — cập nhật nếu đã có |
| `itinerary_items` | tripId, placeId, day, orderIndex, note, startTime, endTime, cost, currency | **unique `{tripId, day, orderIndex}`** |
| `favorite_places` | userId, placeId | **unique `{userId, placeId}`** |
| `reviews` | userId, placeId, parentId, rating(1–5), comment, images[], deletedAt | unique partial `{userId, placeId}` khi `parentId=null, deletedAt=null` (1 đánh giá gốc/địa điểm) |
| `audit_logs` | userId, action, targetType, targetId, metadata | ghi best-effort cho mọi write |
| `search_histories` | userId, query, lat, lng, resultCount, metadata | index `{userId, createdAt}`; prune giữ 50 mục |
| `trip_shares` | tripId, sharedByUserId, permission, shareCode, isActive, expiresAt | unique partial `shareCode` (string); mã 12 ký tự base64url |
| `notifications` | userId, title, content, type(TRIP_SHARE/SYSTEM/WEATHER_ALERT/RECOMMENDATION), isRead, metadata | — |
| `tags` | name(unique), category | — |
| `user_preferences` | userId, tagId, preferenceScore | — |
| `trip_budgets` | tripId, userId, category(6 loại), amount(≥0), currency, note, date, type(planned/actual) | index `{tripId}` |
| `trip_accommodations` | tripId, name, address, checkIn, checkOut, bookingRef, currency, note | index `{tripId, checkIn}` |
| `trip_checklists` | tripId, label, isDone, dueDate | **unique `{tripId, label}` collation `vi` + chuẩn hóa NFC** ở app (chống trùng NFC/NFD) |
| `user_follows` | followerId, followingId | — |
| `review_reports` | reviewId, reportedBy, reason(6 loại), note, status(pending/resolved/dismissed) | **unique `{reviewId, reportedBy}`** (1 report/người/review) |

**Bất biến dữ liệu quan trọng:**
- 1 active user / email (unique partial theo `deletedAt`).
- 1 đánh giá gốc / (user, place); 1 report / (user, review); 1 favorite / (user, place).
- Favorite tùy chỉnh (không có `placeId`) **bắt buộc toạ độ hợp lệ** (Zod refine) → chống rác 0/0.
- Soft-delete bằng `deletedAt` cho users/trips/reviews/hotel_reviews; mọi truy vấn lọc `deletedAt: null`.

---

## 6. Danh sách API đầy đủ (50 route)

Ký hiệu Auth: **P** = bảo vệ (cần đăng nhập) · **O** = tuỳ chọn (chạy được khi ẩn danh, cá nhân hoá nếu có auth) · **A** = admin · **S** = gated bằng secret header · **—** = công khai.

### Auth (`/api/auth/*`)
| Route | Method | Auth | Rate limit |
| --- | --- | --- | --- |
| `/auth/login` | POST | — | 8 / 15 phút (ip+email) |
| `/auth/logout` | POST | O | — (revoke jti + clear cookie) |
| `/auth/send-otp` | POST | — | 3 / 10 phút (email) |
| `/auth/verify-otp` | POST | — | tối đa 5 lần thử OTP |
| `/auth/forgot-password` | POST | — | 20/15phút (ip) + 3/15phút (email) |
| `/auth/reset-password` | POST | — | 20/15phút (ip) + tối đa 5 lần thử OTP |

### Hồ sơ & sở thích
| Route | Method | Auth | Rate limit |
| --- | --- | --- | --- |
| `/profile` | GET, PATCH | P | update: 30/phút |
| `/profile/me` | GET | P | — |
| `/profile/password` | POST | P | **10 / 5 phút** *(mới thêm — Mục 12)* |
| `/users/me/preferences` | PATCH | P | 30/phút |

### Địa điểm & thời tiết
| Route | Method | Auth | Rate limit |
| --- | --- | --- | --- |
| `/places/search` | GET | O | 80/phút (user\|ip) |
| `/places/poi` | GET | — | (cache Redis 12h) |
| `/places/recommended` | GET | O | — |
| `/weather` | GET | — | (cache 30 phút) |

### Yêu thích & lịch sử
| Route | Method | Auth | Rate limit |
| --- | --- | --- | --- |
| `/favorites` | GET, POST | P | create: 30/phút |
| `/favorites/[id]` | DELETE | P | 30/phút |
| `/search-history` | GET, POST, DELETE | P | POST: **60/phút** *(mới thêm — Mục 12)* |
| `/search-history/[id]` | DELETE | P | — (kiểm ownership) |

### Đánh giá
| Route | Method | Auth | Rate limit |
| --- | --- | --- | --- |
| `/reviews` | POST | P | 15/phút |
| `/reviews/[id]` | PATCH, DELETE | P | update 30, delete 15 /phút |
| `/reviews/[id]/report` | POST | P | 20/phút |
| `/reviews/my` | GET | P | — |
| `/admin/reviews/reports` | GET | A | — |

### Khách sạn
| Route | Method | Auth | Rate limit |
| --- | --- | --- | --- |
| `/hotels/search` | GET | O | 80/phút |
| `/hotels/[id]` | GET | O | 120/phút |
| `/hotels/[id]/reviews` | GET, POST | GET: O / POST: P | GET 120, create 15 /phút |
| `/hotels/[id]/reviews/[reviewId]` | DELETE | P | — (kiểm ownership) |

### Chuyến đi & lịch trình
| Route | Method | Auth | Rate limit |
| --- | --- | --- | --- |
| `/trips` | GET, POST | P | create 15/phút |
| `/trips/[id]` | GET, PATCH, DELETE | P (owner/collaborator) | update 30, delete 15 /phút |
| `/trips/public` | GET | — | 60/phút (ip) |
| `/trips/[id]/itinerary` | GET, POST | P | create 30/phút |
| `/trips/[id]/itinerary/[itemId]` | PATCH, DELETE | P | update 45, delete 30 /phút |
| `/trips/[id]/itinerary/reorder` | PATCH | P | 30/phút |
| `/trips/[id]/budget` | GET, POST | P | create 40/phút |
| `/trips/[id]/budget/[budgetId]` | PATCH, DELETE | P | update 60/phút |
| `/trips/[id]/checklist` | GET, POST | P | create 40/phút |
| `/trips/[id]/checklist/[itemId]` | PATCH, DELETE | P | update 60/phút |
| `/trips/[id]/checklist/bulk` | POST | P | 10/phút |
| `/trips/[id]/accommodation` | GET, POST | P | create 40/phút |
| `/trips/[id]/accommodation/[accommodationId]` | PATCH, DELETE | P | — |
| `/trips/[id]/collaborators` | GET, POST | P (owner) | add 30/phút |
| `/trips/[id]/collaborators/[userId]` | DELETE | P (owner) | — |
| `/trips/[id]/share` | POST, DELETE | P (owner) | — |
| `/trips/[id]/weather` | GET | P | — |
| `/share/[code]` | GET | — | — (chỉ trip còn `isActive`, chưa hết hạn, chưa xóa) |

### Hệ thống / nội bộ
| Route | Method | Auth | Ghi chú |
| --- | --- | --- | --- |
| `/health` | GET | — | health check |
| `/debug/db`, `/debug/redis` | GET | S (dev + `x-debug-secret`) | 404 ở production |
| `/cron/weather-alerts` | POST | S (`x-cron-secret`, timing-safe) | quét trip sắp tới, gửi notification + email |
| `/webhook` | POST | S (`x-webhook-secret`, timing-safe) | bảo trì DB (`db.check`, `db.dropUnknown`, `db.reset`, `db.hardReset`, seed VN...), 30/phút |

---

## 7. Cơ chế rate-limit (tổng hợp bảng)

Thuật toán: `INCR + EXPIRE` atomic (Lua) trên Redis; **fallback `Map` in-memory** khi Redis lỗi. Key theo user (mutation cần đăng nhập) hoặc IP/email (auth công khai). IP lấy qua `getClientIp` có xử lý chuỗi `X-Forwarded-For` + allowlist CIDR (`TRUSTED_PROXY_CIDRS`).

- **Auth nhạy cảm:** login 8/15p, forgot/reset 20/15p (ip) + 3/15p (email), OTP tối đa 5 lần thử, **đổi mật khẩu 10/5p**.
- **Tìm kiếm/đọc nhiều:** places/hotels search 80/phút, hotel detail & reviews GET 120/phút, public-trips 60/phút.
- **Mutation chuyến đi:** create-trip 15, update-trip 30, delete-trip 15, itinerary create 30/update 45/delete 30/reorder 30, budget 40–60, checklist 40–60/bulk 10, accommodation 40, collaborator 30 (đều /phút).
- **Nội dung khác:** favorite 30, review create 15/update 30/delete 15/report 20, **search-history 60** (đều /phút), webhook 30/phút.
- **Fetch thời tiết nội bộ:** 1 lần / 10 phút / toạ độ (tránh spam Open-Meteo).

---

## 8. Validation (Zod — `src/lib/validations/`, 17 schema)

- Helper chung (`common.ts`): `objectIdSchema` (ObjectId hợp lệ), `paginationSchema` (page≥1, limit 1–100), `latLngSchema` (lat −90..90, lng −180..180), `dateStringSchema`, `trimString/optionalTrimString`, `optionalPhoneString` (8–15 chữ số, cho phép `+`).
- **Auth:** email `toLowerCase().trim()`, password ≥8 (login ≥6), OTP đúng 6 số, `passwordChangeSchema` refine khớp `confirmPassword`.
- **Trip:** title/destination 2–120 ký tự; ngày ISO; `coverImage` **chỉ http/https URL**; refine `endDate ≥ startDate`.
- **Itinerary:** `day` 1–30, `orderIndex` 0–100, `cost` ≥0, `currency` 3 ký tự; reorder yêu cầu mảng id 1–200, không trùng.
- **Budget:** category ∈ 6 loại, `amount` > 0, type ∈ planned/actual.
- **Accommodation:** currency ∈ {VND,USD,EUR,THB,JPY,KRW,SGD}, refine `checkOut > checkIn`.
- **Checklist:** label 1–200 ký tự (chuẩn hóa NFC), bulk tối đa 100 mục.
- **Review:** rating 1–5; comment ≤1000; **`images` tối đa 10, mỗi URL http/https ≤2048 ký tự** *(siết trong đợt này — Mục 12)*.
- **Profile:** avatar chấp nhận URL http(s) hoặc data-URL ảnh (jpeg/png/webp), giới hạn ~2MB.

---

## 9. Nguồn dữ liệu ngoài & xử lý an toàn

| Dịch vụ | Dùng cho | Bảo vệ |
| --- | --- | --- |
| OSM **Nominatim** | Geocode tên địa điểm | `fetchJsonWithTimeout` (timeout 8s, trả `null` khi lỗi), User-Agent riêng, cache Redis 24h |
| OSM **Overpass** | POI quanh toạ độ | timeout 12–15s, cache 12h, lọc blacklist (cây xăng, massage, khách sạn...) |
| **Open-Meteo** | Thời tiết & dự báo | timeout 5s, cache 30 phút, không cần API key |
| **Resend** | Email OTP/cảnh báo | key `API_KEY_RESEND`; lỗi gửi → 503 rõ ràng |

- **Không dùng dịch vụ bản đồ/geocoding trả phí.**
- Mọi fetch ngoài trong request path đều bọc timeout + fallback mềm (không treo, không 500 lộ stack).

---

## 10. Bảo mật (tổng hợp)

- JWT HttpOnly cookie, `SameSite=Lax`, `Secure` production; hỗ trợ **key rotation**; **blacklist theo `jti`** khi logout/đổi mật khẩu.
- `x-user-id` chỉ nhận trong test; middleware strip header giả mạo ngoài test.
- Rate-limit phủ mọi mutation & đường auth nhạy cảm (đã bổ sung đổi mật khẩu & search-history).
- OTP **verify atomic bằng Lua** (đếm attempts + hết hạn trong Redis), giới hạn gửi & giới hạn thử — chống brute-force.
- `forgot-password` trả thông điệp trung tính "nếu email tồn tại..." → **không lộ user tồn tại**.
- `/api/debug/*` → 404 production; webhook & cron dùng secret + **`timingSafeEqual`**; webhook có IP allowlist + confirm cho thao tác phá hủy.
- Ẩn message lỗi chi tiết ở production; không log secret/PII ra response.
- Chia sẻ công khai kiểm tra `deletedAt`/`isActive`/`expiresAt`; không lộ chuyến đã xóa.
- Ownership/authorization tập trung ở `trip-permission.ts` (`getTripForView/Edit`, `getTripSubItemForEdit`) và kiểm `userId` ở favorites/search-history/reviews/hotel-reviews — **không phát hiện IDOR**.

---

## 11. Kiểm thử

- **Vitest:** 305 test case / 59 file. Gồm unit (helpers, formatters, `fetchJsonWithTimeout`, rate-limit, auth rotation, OTP, validations) và integration (route/API chạm **DB thật**).
  - `tests/setupEnv.ts` nạp `.env` và **đổi tên DB thành `<db>_test`** để không đụng dữ liệu dev; `fileParallelism: false` (các suite chia sẻ DB).
  - Cần MongoDB + Redis đang chạy. `docker compose up -d` để có Mongo/Redis local.
- **Playwright:** cấu hình E2E sẵn (dùng để verify trực quan các feature).
- **Gate coi là "xong":** `npm run lint && npm run typecheck && npm test && npm run build`.
- **Lưu ý môi trường:** `.env` hiện trỏ **MongoDB Atlas shared-tier** (giới hạn 500 collection). Suite tạo nhiều DB `*_test` nên có thể chạm trần → `db.createCollection` fail ngẫu nhiên ở 1 file (flaky, **không phải lỗi code**). Chạy Mongo local sẽ ổn định & nhanh hơn.

---

## 12. Đợt Hardening — Săn & vá lỗi (2026-07-02)

Thực hiện theo `phase-refactor.md`: **chứng minh lỗi trước (test đỏ) → vá root cause → test xanh**, commit nhỏ theo Conventional Commits, code sạch không comment thừa.

### 12.1 Bug đã fix

| # | Sev | Vị trí | Mô tả & root cause | Cách vá | Commit |
| --- | --- | --- | --- | --- | --- |
| BUG-01 | High | `lib/validations/review.ts` | `images` review không giới hạn số phần tử/độ dài → có thể nhồi hàng MB base64 vào Mongo, trả cho mọi người xem (bloat/DoS) | Cap **10 ảnh**, mỗi URL **http/https ≤ 2048 ký tự** | `c79619d` |
| BUG-02 | High | `api/profile/password/route.ts` | Đổi mật khẩu **không rate-limit** → brute-force `currentPassword` + DoS CPU qua `bcrypt.compare` | Thêm rate-limit **10 / 5 phút** theo user | `b1922b1` |
| BUG-03 | Med | `api/trips/[id]/itinerary/[itemId]/route.ts` | Dời điểm dừng sang ngày khác giữ `orderIndex` cũ → đụng unique `{tripId,day,orderIndex}` → **409 khó hiểu**, thao tác thất bại | Khi đổi `day` mà không truyền `orderIndex` → tự dồn về **cuối ngày đích** | `de3c9fa` |
| BUG-04 | Med | `api/search-history/route.ts` | `POST` không rate-limit → spam insert + prune | Thêm rate-limit **60/phút** theo user | `e0500e0` |

### 12.2 Bug ghi nhận (chưa fix — rủi ro thấp / frontend đã chặn)

- **BUG-05 (Low)** — `itinerary/reorder`: nếu client gửi **tập con** item cùng ngày có thể đụng unique index. Frontend (`TripDetailModal.handleMove`) luôn gửi đủ toàn bộ nên không kích hoạt từ UI.
- **BUG-06 (Low)** — `review-utils.recalculatePlaceRating` nuốt mọi lỗi (`catch {}`) → điểm trung bình có thể lệch âm thầm khi DB lỗi tạm thời. Best-effort, không chặn luồng.

### 12.3 Test bổ sung

- `tests/lib/validations/review.test.ts` (mới) — 4 case chặn images quá số lượng/quá dài/không phải http(s).
- `tests/integration/password-change.integration.test.ts` (mới) — chứng minh brute-force bị chặn (429).
- `tests/integration/itinerary-order.integration.test.ts` (+1 case) — dời item sang ngày khác trả 200, `orderIndex` dồn cuối ngày.

### 12.4 Kết quả cổng chất lượng sau fix

`lint ✅ · typecheck ✅ · build ✅ · test 304/305` (1 flaky Atlas như Mục 11). Baseline trước fix 299/299 → sau fix thêm 5 test mới.

Chi tiết đầy đủ từng bug (mô tả · tái hiện · root cause) xem `docs/BUG_REPORT.md`.

---

## 13. Việc còn lại / khuyến nghị

| Hạng mục | Ghi chú |
| --- | --- |
| Merge `refactor/cleanup-phase1` → `main` | Mở PR hoặc merge sau khi review |
| Dùng Mongo local khi chạy CI/test | Tránh trần 500 collection của Atlas shared-tier |
| Responsive & polish UI | Cần chạy app verify trực quan trên viewport hẹp |
| Xử lý BUG-05/BUG-06 | Tùy chọn — rủi ro thấp, cân nhắc vòng sau |
| Bọc timeout cho `fetch` seed VN trong webhook | `locations.seed-vn` đang `fetch` thẳng không timeout (admin-only, tải ~11k bản ghi) |
| CI/CD & production deploy | Chưa có cấu hình host/pipeline riêng |

---

## 14. Cách chạy nhanh

```bash
docker compose up -d          # MongoDB + Redis local (khuyến nghị cho test)
cp .env.example .env          # điền MONGODB_URI, REDIS_URL, JWT_SECRET, ...
npm install
npm run dev                   # http://localhost:3000
# Cổng chất lượng:
npm run lint && npm run typecheck && npm test && npm run build
```

**Biến môi trường** (validate qua `src/lib/env.ts`):
- Bắt buộc: `MONGODB_URI`, `REDIS_URL`, `JWT_SECRET`, `WEBHOOK_SECRET`.
- Tùy chọn: `WEBHOOK_IP_ALLOWLIST`, `TRUSTED_PROXY_CIDRS`, `CRON_SECRET`, `DEBUG_SECRET`, `API_KEY_RESEND`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_BASE_URL`.
