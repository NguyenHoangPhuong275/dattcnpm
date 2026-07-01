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
