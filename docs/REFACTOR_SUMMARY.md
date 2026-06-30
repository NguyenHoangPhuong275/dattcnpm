# REFACTOR_SUMMARY.md

> Tổng kết đợt refactor theo `phase-refactor.md`. Ngày: 2026-07-01.
> Cổng chất lượng: `lint + typecheck + test + build`.
> **Trạng thái cuối: full gate XANH** — `npm test` = **299 tests / 57 files passed** (chạy với MongoDB+Redis local Docker), build OK.

## Đã làm gì

| Commit | Phase | Thay đổi | Vì sao |
|--------|-------|----------|--------|
| `chore` postcss | pre | `overrides` postcss `^8.5.16` + `.npmrc` prefer-offline | Vá lỗ hổng XSS postcss mà không hạ Next; tránh tải lại khi `npm install` |
| `docs` plan | 0 | `docs/REFACTOR_PLAN.md` | Audit kiến trúc thực tế + backlog ưu tiên |
| `refactor` comments | 1 | Xóa comment 21 file source (giữ directive) | Mandate doc: source không comment |
| `refactor` any | 1 | Bỏ `any` ẩu ở favorites | Type-safety; để TS suy luận `Place[]` |
| `refactor` http | 1 | `src/lib/external/http.ts` + migrate 5 chỗ fetch | Dedupe fetch+timeout+cache; thêm type thay `any` ngầm |
| `docs` audit | 2 | Kết quả audit IDOR/Auth trong plan | Xác nhận không có IDOR |
| `refactor` sub-item | 1#2 | `getTripSubItemForEdit` + migrate 8 handler (budget/checklist/accommodation/itinerary) | Tập trung hóa check sở hữu sub-item (chống IDOR mặc định), dedupe |
| `test` http/date/itinerary/formatters | 4 | Unit test cho `fetchJsonWithTimeout`, `date`, `itinerary-utils`, `trip-formatters` | Nâng coverage; verify được không cần Atlas |

## ⚠️ Phát hiện quan trọng về môi trường test (Atlas vs local)

`.env` đặt `MONGODB_URI=mongodb+srv://…` → mặc định **tests chạy trên MongoDB Atlas (cloud)**, không dùng Docker local. Atlas shared-tier có **giới hạn 500 collection**; suite tạo nhiều DB `*_test_w*` nên chạm trần → lỗi `cannot create a new collection -- already using 500 collections of 500` (flaky, rơi vào file ngẫu nhiên). **Đây KHÔNG phải lỗi code.**

Khi trỏ về **Docker local**, toàn bộ **299 test pass**. Không sửa `.env` (rule #4 — secret). Cách chạy test ổn định:

```bash
docker compose up -d
# PowerShell:
$env:MONGODB_URI='mongodb://localhost:27017/smart_travel_guide'; npm test
```

Khuyến nghị: thêm `MONGODB_URI` local vào `.env` (hoặc một `.env.test`) khi chạy CI/local để tránh đụng trần Atlas.

## Phát hiện chính

Codebase **đã trưởng thành** trước đợt refactor: phần lớn mục Phase 1 của doc (response chuẩn `AppError`/`sendSuccess`/`handleApiError`, 17 Zod schema, error handling tập trung, fetch ngoài có `AbortSignal.timeout`) **đã tồn tại sẵn**. Authorization (Phase 2) cũng đã chắc — không tìm thấy IDOR.

Vì vậy đợt refactor này tập trung vào các cải thiện **thật, ít rủi ro, đo được**: gỡ comment, dedupe fetch ngoài, siết kiểu — thay vì viết lại thứ đã tốt.

## Thay đổi hành vi (theo rule #1 — ghi nhận)

- `GET /api/weather`: khi upstream trả HTTP 200 nhưng body không phải JSON, route nay trả `{ available: false }` (graceful) thay vì 500. Các call-site khác (poi, search, weather-alerts) giữ **nguyên** hành vi fallback.

## Việc CHƯA làm (cố ý) + khuyến nghị tiếp

1. **Phase 1 #2 — thin controller (phần còn lại)**: đã tập trung hóa pattern sub-item (8 handler). Việc tách service-repository cho ~60 route còn lại là đại tu kiến trúc giá trị biên thấp (route đã khá mỏng, dùng helper sẵn). Nếu làm, theo từng domain + chạy `npm test`.
2. **Phase 3 — UX/components**: tách `TripDetailModal.tsx` (743 dòng), `profile/page.tsx` (541), bổ sung loading/empty/error còn thiếu, a11y. Cần **chạy app** kiểm chứng visual — chưa làm để tránh đổi UI mù không verify được.
3. **Phase 4 — Test (mở rộng)**: đã thêm 4 file unit test mới (http/date/itinerary-utils/trip-formatters). Có thể chạy `npm run test:coverage` để lấy số liệu và bổ sung tiếp cho `recommendation`, `hotel-utils`, `trip-utils`.
4. **2 điểm security minor** (timing forgot-password, enumeration send-otp): xem mục 5b của plan — không khuyến nghị fix cho phạm vi đồ án.

## Rủi ro còn lại

- Toàn bộ refactor đã được **`npm test` (299 test) xác nhận xanh** trên Mongo local. Khi chạy CI/Atlas cần lưu ý trần 500 collection (xem phần môi trường test).
- Một số file lớn (`places/search/route.ts` 693, `TripDetailModal.tsx` 743) vẫn chưa tách — nợ kỹ thuật đã ghi nhận, chưa xử lý (cần verify visual).

## Cổng chất lượng — lệnh chạy lại đầy đủ

```bash
docker compose up -d
$env:MONGODB_URI='mongodb://localhost:27017/smart_travel_guide'  # tránh trần Atlas
npm run lint && npm run typecheck && npm test && npm run build
```
