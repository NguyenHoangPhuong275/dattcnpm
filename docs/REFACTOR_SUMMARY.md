# REFACTOR_SUMMARY.md

> Tổng kết đợt refactor theo `phase-refactor.md`. Ngày: 2026-07-01.
> Cổng chất lượng áp dụng: `lint + typecheck + build` xanh sau **mỗi** commit.
> `npm test` (integration) bị **hoãn** vì Docker (MongoDB/Redis) không chạy trong môi trường này.

## Đã làm gì

| Commit | Phase | Thay đổi | Vì sao |
|--------|-------|----------|--------|
| `chore` postcss | pre | `overrides` postcss `^8.5.16` + `.npmrc` prefer-offline | Vá lỗ hổng XSS postcss mà không hạ Next; tránh tải lại khi `npm install` |
| `docs` plan | 0 | `docs/REFACTOR_PLAN.md` | Audit kiến trúc thực tế + backlog ưu tiên |
| `refactor` comments | 1 | Xóa comment 21 file source (giữ directive) | Mandate doc: source không comment |
| `refactor` any | 1 | Bỏ `any` ẩu ở favorites | Type-safety; để TS suy luận `Place[]` |
| `refactor` http | 1 | `src/lib/external/http.ts` + migrate 5 chỗ fetch | Dedupe fetch+timeout+cache; thêm type thay `any` ngầm |
| `docs` audit | 2 | Kết quả audit IDOR/Auth trong plan | Xác nhận không có IDOR |

## Phát hiện chính

Codebase **đã trưởng thành** trước đợt refactor: phần lớn mục Phase 1 của doc (response chuẩn `AppError`/`sendSuccess`/`handleApiError`, 17 Zod schema, error handling tập trung, fetch ngoài có `AbortSignal.timeout`) **đã tồn tại sẵn**. Authorization (Phase 2) cũng đã chắc — không tìm thấy IDOR.

Vì vậy đợt refactor này tập trung vào các cải thiện **thật, ít rủi ro, đo được**: gỡ comment, dedupe fetch ngoài, siết kiểu — thay vì viết lại thứ đã tốt.

## Thay đổi hành vi (theo rule #1 — ghi nhận)

- `GET /api/weather`: khi upstream trả HTTP 200 nhưng body không phải JSON, route nay trả `{ available: false }` (graceful) thay vì 500. Các call-site khác (poi, search, weather-alerts) giữ **nguyên** hành vi fallback.

## Việc CHƯA làm (cố ý) + khuyến nghị tiếp

1. **Phase 1 #2 — thin controller / tách service-repository** (~60 route): đại tu kiến trúc, behavior-sensitive. **Hoãn** vì không chạy được integration test để kiểm chứng. Nên làm **sau khi bật Docker**, từng domain một (trips → reviews → …), mỗi domain 1 commit + chạy `npm test`.
2. **Phase 3 — UX/components**: tách `TripDetailModal.tsx` (743 dòng), `profile/page.tsx` (541), bổ sung loading/empty/error còn thiếu, a11y. Cần **chạy app** để kiểm chứng visual — nên làm khi môi trường dev sẵn sàng.
3. **Phase 4 — Test**: cần MongoDB+Redis. Sau khi bật Docker: chạy `npm run test:coverage` lấy baseline, bổ sung unit test cho `src/lib/external/http.ts` và integration còn thiếu.
4. **2 điểm security minor** (timing forgot-password, enumeration send-otp): xem mục 5b của plan — không khuyến nghị fix cho phạm vi đồ án.

## Rủi ro còn lại

- Các refactor fetch ngoài chưa được integration test chạy lại (Docker tắt). Logic runtime giữ nguyên (fetch→!ok→fallback→json) nên rủi ro thấp, nhưng **nên chạy `npm test` sau khi bật Docker** để xác nhận.
- Một số file lớn (`places/search/route.ts` 693, `TripDetailModal.tsx` 743) vẫn chưa tách — nợ kỹ thuật đã ghi nhận, chưa xử lý.

## Cổng chất lượng — chạy lại đầy đủ khi có Docker

```bash
docker compose up -d
npm run lint && npm run typecheck && npm test && npm run build
```
