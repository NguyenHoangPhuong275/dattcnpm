# BUG REPORT — Hardening Pass (Smart Travel Guide)

Ngày rà soát: 2026-07-02. Nhánh: `refactor/cleanup-phase1`.
Phương pháp: đọc toàn bộ `src/`, đối chiếu với checklist A–F trong `phase-refactor.md`.
Triết lý: chứng minh lỗi trước, fix sau. Fix tối thiểu, không đổi API shape trừ khi đó là lỗi.

---

## Bảng tổng hợp

| # | Severity | Vị trí | Nhóm | Trạng thái | Commit |
|---|----------|--------|------|------------|--------|
| BUG-01 | High | `src/lib/validations/review.ts` | F/B | Đã fix | `c79619d` |
| BUG-02 | High | `src/app/api/profile/password/route.ts` | B | Đã fix | `b1922b1` |
| BUG-03 | Med  | `src/app/api/trips/[id]/itinerary/[itemId]/route.ts` | A/F | Đã fix | `de3c9fa` |
| BUG-04 | Med  | `src/app/api/search-history/route.ts` | B/C | Đã fix | `e0500e0` |
| BUG-05 | Low  | `src/app/api/trips/[id]/itinerary/reorder/route.ts` | A | Ghi nhận (frontend đã chặn) | — |
| BUG-06 | Low  | `src/lib/review-utils.ts` | C | Ghi nhận | — |

**Tăng test coverage:** `tests/lib/validations/review.test.ts` (mới), `tests/integration/password-change.integration.test.ts` (mới), thêm case dời-ngày trong `tests/integration/itinerary-order.integration.test.ts`.

---

## BUG-01 — [High] Mảng `images` trong review không giới hạn kích thước

**Vị trí:** `src/lib/validations/review.ts:9,15` (`createReviewSchema`, `updateReviewSchema`).

**Mô tả:** `images: z.array(z.string()).optional().nullable()` — không giới hạn **số phần tử** lẫn **độ dài mỗi chuỗi**. Người dùng có thể POST/PATCH một review với hàng nghìn phần tử hoặc chuỗi base64 nhiều MB. Dữ liệu này được lưu thẳng vào Mongo và trả về cho **mọi người xem địa điểm** qua các endpoint list review.

**Cách tái hiện:**
- `POST /api/reviews` với body `{ placeId, rating: 5, images: [<chuỗi 5MB>] }` → lưu thành công.
- Hoặc `images: Array(100000).fill('x')` → document phình to.

**Root cause:** thiếu ràng buộc `.max()` cho cả mảng và từng URL. `comment` đã có `.max(1000)` nhưng `images` bị bỏ sót.

**Hướng fix:** giới hạn tối đa 10 ảnh, mỗi URL ≤ 2048 ký tự; ràng buộc là http(s) URL (khớp với cách coverImage của trip được validate).

**Fixed:** thêm `reviewImagesSchema` (max 10 phần tử, URL http/https ≤ 2048). Test đỏ→xanh: `tests/lib/validations/review.test.ts`.

---

## BUG-02 — [High] Endpoint đổi mật khẩu không có rate limit

**Vị trí:** `src/app/api/profile/password/route.ts`.

**Mô tả:** Route `POST /api/profile/password` **không gọi `checkRateLimit`**. Một phiên đăng nhập hợp lệ (hoặc session bị chiếm) có thể thử `currentPassword` **không giới hạn số lần**. Ngoài rủi ro brute-force mật khẩu hiện tại, mỗi lần thử chạy `bcrypt.compare` (rounds cao) → còn là vector DoS CPU.

**Cách tái hiện:** gửi liên tiếp `POST /api/profile/password` với `currentPassword` sai — mọi request đều được xử lý, không bao giờ trả 429.

**Root cause:** thiếu bước rate limit (Bước 3 trong quy ước API route ở CLAUDE.md) so với các mutation khác (login, update-profile... đều có).

**Hướng fix:** thêm `checkRateLimit({ key: 'rl:change-password:<userId>', limit: 10, windowSeconds: 300 })`, ném `RATE_LIMITED` 429 khi vượt.

**Fixed:** thêm rate limit theo userId. Test: `tests/integration/profile.integration.test.ts` (case đổi mật khẩu bị chặn sau nhiều lần).

---

## BUG-03 — [Med] Đổi `day` của điểm dừng gây lỗi trùng khoá (409) khi dời ngày

**Vị trí:** `src/app/api/trips/[id]/itinerary/[itemId]/route.ts:58-66`.

**Mô tả:** Itinerary có unique index `(tripId, day, orderIndex)` (`supporting.model.ts:34`). Khi PATCH đổi `day` mà **không** gửi `orderIndex`, item giữ nguyên `orderIndex` cũ. Nếu ngày đích đã có item mang cùng `orderIndex` → Mongo `E11000` → `handleApiError` map thành **409 "Dữ liệu bị trùng lặp"**. Người dùng chỉ đơn giản dời một điểm dừng sang ngày khác lại nhận lỗi conflict và thao tác thất bại.

**Cách tái hiện:**
1. Tạo trip nhiều ngày.
2. Thêm item A vào ngày 1 (orderIndex 0), item B vào ngày 2 (orderIndex 0).
3. PATCH item A `{ day: 2 }` → 409 thay vì 200.

**Root cause:** không tính lại `orderIndex` khi chuyển ngày; giữ index cũ dễ đụng slot đã có ở ngày mới.

**Hướng fix:** khi `day` thay đổi và client không truyền `orderIndex`, tính `orderIndex = max(orderIndex của ngày đích) + 1` để đẩy item xuống cuối ngày mới (nhất quán với logic POST tạo item).

**Fixed:** trong nhánh đổi `day`, tự động dồn `orderIndex` về cuối ngày đích khi không có `orderIndex` tường minh. Test: `tests/integration/itinerary-order.integration.test.ts`.

---

## BUG-04 — [Med] `POST /api/search-history` không rate limit

**Vị trí:** `src/app/api/search-history/route.ts` (POST).

**Mô tả:** Khác với hầu hết mutation, POST search-history không rate limit. Mỗi request ghi 1 insert + chạy `pruneSearchHistory` (thêm truy vấn/xoá). Người dùng đã đăng nhập có thể spam ghi lịch sử không giới hạn → tải DB.

**Root cause:** thiếu `checkRateLimit`.

**Hướng fix:** thêm rate limit theo userId (limit 60/60s — đủ rộng cho thao tác thật, chặn spam).

**Fixed:** thêm rate limit. Không đổi response shape.

---

## BUG-05 — [Low] Reorder itinerary với tập con của một ngày có thể đụng unique index

**Vị trí:** `src/app/api/trips/[id]/itinerary/reorder/route.ts`.

**Mô tả:** Reorder gán `orderIndex = vị trí trong mảng` cho các id được gửi, chỉ kiểm tra chúng thuộc trip. Nếu client gửi **tập con** các item cùng một ngày (bỏ sót vài item), các item không nằm trong danh sách vẫn giữ index cũ → có thể trùng `(tripId, day, orderIndex)` → E11000 → rollback 500. Frontend (`TripDetailModal.handleMove`) luôn gửi **đủ toàn bộ** item nên không kích hoạt từ UI, nhưng API vẫn hở với client tuỳ biến.

**Root cause:** reorder không ràng buộc danh sách phải đầy đủ theo ngày.

**Trạng thái:** Ghi nhận, chưa fix (frontend đã chặn; fix an toàn cần thêm validate phạm vi ngày — cân nhắc ở vòng sau để tránh mở rộng scope).

---

## BUG-06 — [Low] `recalculatePlaceRating` nuốt toàn bộ lỗi

**Vị trí:** `src/lib/review-utils.ts:19` (`catch {}`).

**Mô tả:** Nếu cập nhật `ratingAvg/ratingCount` thất bại (mất kết nối tạm thời), lỗi bị nuốt im lặng → điểm trung bình địa điểm có thể lệch so với thực tế mà không có tín hiệu.

**Trạng thái:** Ghi nhận. Chấp nhận được (best-effort, không chặn luồng tạo review), chưa cần fix gấp.

---

## Ghi chú các vùng đã kiểm tra và KHÔNG phát hiện lỗi đáng kể

- **Authorization/ownership:** `getTripForView/Edit`, `findOwnedTrip`, kiểm tra `userId` ở favorites/search-history/reviews/hotel-reviews đều đúng; không thấy IDOR.
- **OTP:** verify atomic bằng Lua (đếm attempts + hết hạn trong DB), có giới hạn gửi và giới hạn thử — chắc chắn.
- **Auth/JWT:** cookie HttpOnly + SameSite lax, blacklist theo `jti`, cache 30s, chặn user bị khoá/xoá. `x-user-id` chỉ nhận trong `NODE_ENV=test` và middleware strip ngoài test.
- **Fetch dịch vụ ngoài:** đều bọc `fetchJsonWithTimeout` (timeout + trả null). Weather/POI có fallback mềm.
- **Redis/Mongo down:** circuit breaker + fallback in-memory cho rate limit; `getAuthUserFull` degrade mềm.
- **Webhook admin:** timing-safe compare secret, IP allowlist cho event nhạy cảm, confirm cho event phá huỷ.
