# CLEANUP REPORT — Smart Travel Guide

Refactor cleanup theo `phase-refactor.md`. Tài liệu này là **kết quả BƯỚC 1 (quét & lập danh sách)**.
Công cụ hỗ trợ: `knip` (phát hiện file/export/dep không dùng) + verify thủ công bằng grep/đọc code.

Nguyên tắc: chỉ xóa mục **chắc chắn 100%**; mục chạm vào barrel có tài liệu (`AGENTS.md`),
migration, hay có rủi ro → để phần **CHỜ DUYỆT** cho chủ dự án quyết.

Ràng buộc đã tuân thủ: không đổi behavior / API shape / route / schema DB; không xóa `.env*`,
`*.docx`, docs, migration.

---

## A. ĐÃ XỬ LÝ NGAY (chắc chắn 100%)

### A1. Dependency thừa
| Mục | Bằng chứng | Hành động |
|---|---|---|
| `@types/bcryptjs` (devDep, `^2.4.6`) | `bcryptjs@^3.0.3` đã kèm sẵn type (`node_modules/bcryptjs/index.d.ts`); bản `@types` v2 còn lệch major | Xóa khỏi `package.json` |

### A2. Dead code — hàm/biến/export không ai dùng (grep toàn repo xác nhận)
| Mục | File | Bằng chứng | Hành động |
|---|---|---|---|
| `isBadWeatherCode`, `getWeatherWarning` | `src/lib/weather.ts` | Không import ở đâu; chỉ dùng lẫn nhau nội bộ | Xóa cả 2 (giữ `getWeatherDescription` — vẫn dùng) |
| `resetEnvCache` | `src/lib/env.ts` | Không import ở đâu (kể cả test) | Xóa hàm |
| `isTripOwner` | `src/lib/trip-permission.ts` | Không import ở đâu, không dùng nội bộ | Xóa hàm |
| `HeartIcon`, `HeartFilledIcon`, `ChevronRightIcon` | `src/components/icons.tsx` | Không render ở đâu | Xóa 3 icon |

> ⚠️ Lưu ý quan trọng: `trip-permission.ts` **KHÔNG** phải file chết như knip gợi ý.
> `getTripForView` / `getTripForEdit` / `getTripSubItemForEdit` đang được các route dùng.

### A3. Giảm API surface — export thừa nhưng dùng nội bộ (chỉ bỏ từ khóa `export`, KHÔNG xóa logic)
| Symbol | File | Lý do |
|---|---|---|
| `canViewTrip`, `canEditTrip` | `src/lib/trip-permission.ts` | Chỉ dùng bởi `getTripFor*` trong cùng file |
| `removeVietnameseTones` | `src/lib/string.ts` | Chỉ dùng bởi `normalizeVietnameseText` cùng file |
| `WEATHER_ALERT_THRESHOLDS` | `src/lib/weather-alerts.ts` | Chỉ dùng bởi `evaluateWeatherAlert` cùng file |
| `normalizeTourismText` | `src/lib/vietnam-tourism.ts` | Chỉ dùng nội bộ trong file |
| `getLocalitiesByRegion` | `src/data/localities.ts` | Chỉ dùng nội bộ trong file |

### A4. Khử trùng lặp (dedup)
| Mục | Bằng chứng | Hành động |
|---|---|---|
| `DEFAULT_TRIP_IMAGE`, `DEFAULT_LOCALE`, `DEFAULT_CURRENCY` | Khai báo 2 nơi: `src/lib/constants.ts` (không ai dùng) và bản sao local trong `src/lib/trip-utils.ts` (đang dùng) | Giữ nguồn chuẩn ở `constants.ts`, cho `trip-utils.ts` import từ đó, xóa bản sao local |

---

## B. CHỜ DUYỆT (nghi ngờ / cần quyết định — CHƯA đụng)

### B1. Barrel file có tài liệu trong `AGENTS.md` — knip báo "unused" nhưng là API cố ý
Không xóa nếu chưa có chỉ đạo. `AGENTS.md §12` liệt kê chúng là barrel chính thức:

| File | Vai trò theo AGENTS.md |
|---|---|
| `src/lib/index.ts` | "Client-safe utilities" cho client components |
| `src/lib/validations/validation.ts` | Barrel tổng các schema (đánh dấu "Optional barrel") |
| `src/types/index.ts` | Barrel "All domain types" |
| `src/types/place.ts` | Re-export type Place/Review/... từ `@/lib/db` |

→ **Đề xuất:** nếu muốn thật gọn, có thể xóa các barrel không nơi nào import + cập nhật `AGENTS.md`. Cần bạn xác nhận vì đây là quy ước dự án.

### B2. Script migration / import (rule cấm tự xóa migration)
`scripts/`: `audit-itinerary-orderindex.ts`, `backfill-hotel-location.ts`, `import-hotel-reviews.ts`,
`import-hotels-osm.ts`, `migrate-checklist-unique-index.ts`, `migrate-user-email-partial-index.ts`,
`load-env.ts`, `Reviews.csv`.
→ Không được import bởi app nhưng là công cụ vận hành/migrate chạy tay. **Giữ mặc định.** Xóa chỉ khi bạn xác nhận không còn cần.

### B3. Re-export không dùng trong barrel `@/lib/db` (`src/lib/db/index.ts`, `schema.ts`)
Rất nhiều type/const/schema re-export qua barrel `@/lib/db` hiện không được consume
(vd: `Review`, `SearchHistory`, `TripShare`, `Notification`, `Tag`, `UserPreference`, `AuditLog`,
`RedisKey`, các `*Schema` của model, các type `CachedPOI`, `SessionData`, `BlacklistEntry`, ...).
→ `@/lib/db` là API surface có chủ đích (CLAUDE.md). Cắt bớt là **churn lớn, rủi ro, lợi ích thấp**.
**Đề xuất giữ**, hoặc rà theo từng nhóm nếu bạn muốn.

### B4. Type suy luận từ Zod & interface return không dùng (~112 mục)
Nhiều `*Input` (vd `TripCreateInput`, `HotelSearchInput`, ...) và interface return của hook
(vd `UseCurrentUserReturn`, `UseMyTripsReturn`, ...) được export nhưng chưa ai import.
→ Đa phần vô hại, giá trị dọn thấp/churn cao. **Đề xuất để lại**, hoặc dọn chọn lọc nếu muốn.

### B5. Schema validation không dùng + export trùng
| Mục | File | Ghi chú |
|---|---|---|
| `changePasswordSchema` (trùng `passwordChangeSchema`) | `src/lib/validations/auth.ts` | Duplicate export — có thể gộp còn 1 tên |
| `deleteItineraryItemSchema` | `src/lib/validations/trip.ts` | Không dùng |
| `paginationSchema`, `optionalLatLngSchema` | `src/lib/validations/common.ts` | Không dùng |
| `updateCollaboratorSchema` | `src/lib/validations/collaborator.ts` | Không dùng |
| `weatherAlertThresholdsSchema` | `src/lib/validations/preferences.ts` | Không dùng |
| `ACCOMMODATION_CURRENCIES` | `src/lib/validations/accommodation.ts` | Không dùng |
→ Một số được re-export qua `validation.ts` barrel (B1). Cần duyệt cùng B1.

### B6. Helper DB/redis export không dùng (cần verify từng cái trước khi cắt)
`redisCircuitOpen`, `deleteResetOtp`, `deleteAvatar` (`src/lib/db/redis.ts`);
`listManagedCollections` (`src/lib/db/maintenance.ts`); `isConnected` (`src/lib/db/connection.ts`);
`ErrorCode`/`ErrorCodeType` (`src/lib/api-response.ts`).
→ Có thể là API tiện ích/để dành. **Đề xuất để lại** trừ khi bạn muốn cắt.

---

## C. Ghi chú công cụ
- `postcss` bị knip báo "unlisted dependency" (dùng trong `postcss.config.mjs`) — đây là dep gián tiếp
  do Next/Tailwind cung cấp, **không phải rác**, không cần xử lý.

---

## Kết quả gate (BƯỚC 1)
- `npm run lint` — ✅ pass (0 lỗi)
- `npm run typecheck` — ✅ pass (0 lỗi)
- `npm test` — ✅ 298/299 pass. 1 test (`accommodation.integration` → "accommodationId của trip khác → 404")
  fail do **timeout 5s (flaky, latency Atlas)**; chạy riêng file này pass 10/10 trong 14s.
  Không liên quan các file đã sửa. → Đây là hạn chế môi trường (test thiết kế cho Mongo local),
  không phải regression.
- `npm run build` — ✅ pass

> Ghi chú: hiện `.env` trỏ Atlas qua internet (dạng non-SRV) nên suite chạy chậm (~270s) và dễ
> flaky timeout. Nếu chạy Mongo local (`docker compose up -d`) sẽ nhanh và ổn định hơn.

---

## BƯỚC 2 — Xóa comment thông minh
Toàn bộ `src/**/*.{ts,tsx}` chỉ còn **4 dòng comment**, tất cả đều thuộc nhóm **PHẢI GIỮ**:
- `src/lib/validations/favorite.ts:14` — comment "tại sao" (ràng buộc nghiệp vụ, tránh tọa độ rác 0/0)
- `src/lib/db/connection.ts:74` — comment "tại sao" (fallback khi không set được DNS resolver)
- `src/app/api/trips/[id]/itinerary/reorder/route.ts:78` — comment "tại sao" (trạng thái khi rollback lỗi)
- `src/components/hotels/HotelImage.tsx:37` — directive `// eslint-disable-next-line`

→ **Không có comment thừa để xóa.** Không có block comment, JSDoc, code comment-out, TODO/FIXME.
Codebase đã sạch comment từ các refactor trước.

## BƯỚC 3 — Làm code tự diễn giải
- `grep` toàn repo: **0 lần dùng `any` / `as any`** → không có ép kiểu không an toàn để bỏ.
- Tên hàm/biến đã rõ nghĩa, nhất quán convention (`getTripForView`, `evaluateWeatherAlert`,
  `fetchDailyForecast`, ...). Không có tên mơ hồ cần đổi.
- Magic string/number ở route lớn đã là hằng có tên (`NOMINATIM_URL`, `CACHE_TTL`, `USER_AGENT`, ...).
- Dedup đã xử lý ở BƯỚC 1 (A4: `DEFAULT_*`).
- File lớn nhất là React component/route (JSX/handler nhiều dòng) — tách nhỏ sẽ đổi cấu trúc render,
  rủi ro regression cao, lợi ích thấp → **không đụng** (đúng nguyên tắc "không đổi behavior",
  "tránh trừu tượng hóa non").

→ **Không có thay đổi an toàn & đáng giá ngoài BƯỚC 1.**

## BƯỚC 4 — Nhất quán & format
- Không có Prettier; `eslint-config-next` không bật rule stylistic (`no-multiple-empty-lines`, ...).
- `npx eslint . --fix` → **0 thay đổi** (không có gì auto-fixable còn tồn).
- Không file rỗng, không thư mục rỗng, không config trùng.
- Còn vài dòng trắng liên tiếp (cosmetic) ở ~13 file nhưng **không có formatter cấu hình** để chuẩn hóa;
  theo yêu cầu "không format thủ công lung tung" → để nguyên (có thể thêm `no-multiple-empty-lines`
  vào eslint config nếu chủ dự án muốn — đây là thay đổi cấu hình cần bạn duyệt).

## BƯỚC 5 — Tổng kết

### Đã làm (commit `refactor: remove dead code and redundant exports (cleanup phase 1)`)
- Xóa 1 devDependency thừa (`@types/bcryptjs`) + sync `package-lock.json`.
- Xóa 6 hàm/biến chết + 3 icon không dùng.
- Thu hẹp API surface: bỏ `export` cho 5 symbol chỉ dùng nội bộ.
- Khử trùng lặp 3 hằng `DEFAULT_*`.
- Thêm tài liệu `docs/CLEANUP_REPORT.md`.
- Tổng: 12 file thay đổi (+122 / −63).

### Không đổi (đã xác minh sạch)
- Comment (BƯỚC 2), `any`/naming/magic-number (BƯỚC 3), format/cấu trúc (BƯỚC 4).

### Còn chờ chủ dự án duyệt (đã thống nhất GIỮ ở lần trao đổi này)
- B1 barrel có tài liệu, B2 script migration, B3/B4 re-export & type Zod/hook, B5 schema validation thừa,
  B6 helper DB/redis → **giữ nguyên** theo quyết định của chủ dự án.

### Gate cuối
lint ✅ · typecheck ✅ · build ✅ · test 298/299 (1 flaky timeout do latency Atlas — không phải regression).
