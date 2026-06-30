# REFACTOR_PLAN.md — Smart Travel Guide

> Phase 0 (Audit) output. Cơ sở để thực thi Phase 1→5 theo `phase-refactor.md`.
> Ngày: 2026-07-01. Baseline: `npm run build` xanh, ~23.5k dòng `src/`, 60+ API route, 55 test file.

---

## 1. Kiến trúc thực tế hiện tại

```
src/
├── app/
│   ├── api/.../route.ts        # 60+ route handlers (App Router)
│   └── (pages)                 # admin, hotels, local, profile, trips, share, schedule-reference
├── components/                 # admin, auth, home, hotels, local, profile, trips, ui
├── hooks/                      # useProfile, usePlaceSearch, useCurrentUser, useHomepageTripActions...
├── lib/
│   ├── api-response.ts         # AppError + sendSuccess/sendError/handleApiError  [CHUẨN HÓA XONG]
│   ├── auth.ts                 # JWT (jose) + rotation + Redis cache + blacklist
│   ├── rate-limit.ts           # Redis + fallback in-memory
│   ├── constants.ts            # ERROR_CODES, ROUTES
│   ├── validations/            # 17 file Zod schema  [VALIDATION TẬP TRUNG XONG]
│   └── db/
│       ├── connection.ts       # getDb() singleton -> AppDatabase
│       ├── collections.ts      # createCollection<T>() wrapper Mongoose
│       ├── models/, schema.ts  # Mongoose models + plain types
│       └── redis.ts, audit.ts, maintenance.ts, users.ts, trips.ts
├── data/                       # localities.ts (tĩnh)
└── middleware.ts               # chặn x-user-id, redirect auth, 404 /api/debug ở prod
```

Luồng request chuẩn (đã áp dụng nhất quán ở phần lớn route):
`try → getAuthUserFull → checkRateLimit → Zod parse → getDb() → thao tác → createAuditLog (best-effort) → sendSuccess | catch handleApiError`.

---

## 2. Điều ĐÃ đạt chuẩn (không cần làm lại trong Phase 1)

| Hạng mục Phase 1 (doc) | Trạng thái thực tế |
|---|---|
| Chuẩn response API thống nhất | ✅ Đã có `{ success, status, data, error, message }` + `AppError` |
| Error handling tập trung | ✅ `handleApiError` map Zod→400, dup-key→409, ẩn message ở prod |
| Validation tập trung bằng Zod | ✅ 17 schema trong `src/lib/validations/` |
| Fetch ngoài có timeout | ✅ Tất cả dùng `AbortSignal.timeout(...)` (Nominatim/Overpass/Open-Meteo) |
| Data access layer | 🟡 Có `getDb()` + `createCollection`, nhưng logic nghiệp vụ còn nằm trong route |
| Auth nguồn-sự-thật JWT cookie | 🟡 JWT cookie là chính; `x-user-id` chỉ bật khi `NODE_ENV=test`; `localStorage` chỉ back-compat ở `api-client.ts` |

Code smell thật sự đo được khá thấp: chỉ **7 chỗ** `any`/`as any`; các `catch {}` còn lại đều là best-effort có chủ đích (audit log, sessionStorage, Redis) đúng thiết kế đã ghi trong CLAUDE.md.

---

## 3. Code smell / nợ kỹ thuật còn lại (đo từ code)

### 3.1 File quá lớn / trộn nhiều mối quan tâm
- `src/app/api/places/search/route.ts` (693) — trộn geocoding + Overpass query + parse + cache trong 1 route. **Tách service `lib/external/` (Nominatim/Overpass).**
- `src/components/profile/TripDetailModal.tsx` (743) — component khổng lồ, nhiều trạng thái.
- `src/app/schedule-reference/[id]/page.tsx` (548), `src/app/profile/page.tsx` (541) — page lớn.
- `src/app/api/webhook/route.ts` (502) — dispatcher maintenance dài.
- `src/components/trips/TripBudgetSummary.tsx` (445), `RegisterForm.tsx` (428).

### 3.2 Trùng lặp logic gọi dịch vụ ngoài
`fetch + cache Redis + parse` lặp ở `places/search`, `places/poi`, `weather`, `weather-alerts`. **Chưa có 1 service HTTP ngoài dùng chung** (timeout + retry + cache key + log gọn). → Ứng viên Phase 1.

### 3.3 `any` / ép kiểu (7 chỗ)
`rate-limit.ts`, `collections.ts`, `favorites/route.ts`, `collaborators/route.ts`, `places/search/route.ts`, `search-history/route.ts` (×2). Đa số vô hại nhưng nên siết kiểu.

### 3.4 Comment trong source
`phase-refactor.md` yêu cầu **không comment trong source**. Hiện còn rải rác (vd `api-response.ts:105-106`, `auth.ts:149`, nhiều route). → Dọn cơ học, rủi ro thấp, diff rộng.

### 3.5 Nghiệp vụ / Auth
- Authorization: đã có `lib/trip-permission.ts`; cần rà soát đủ mọi route con của trips/itinerary/favorites/search-history để chắc chống IDOR (Phase 2).
- OTP/rate-limit/đổi mật khẩu: rà message lỗi tránh leak (timing, user-enumeration).

---

## 4. Danh sách ưu tiên

| # | Hạng mục | Phase | Mức | Rủi ro | Ước lượng |
|---|---|---|---|---|---|
| 1 | Tách service HTTP ngoài dùng chung (`lib/external/http.ts` + nominatim/overpass/open-meteo) | 1 | High | TB (đụng route places/weather) | M |
| 2 | Tách nghiệp vụ ra service/repository, route thành thin controller (trips, reviews, favorites) | 1 | High | TB-cao | L |
| 3 | Siết 7 chỗ `any` → kiểu cụ thể | 1 | Med | Thấp | S |
| 4 | Dọn toàn bộ comment trong source + thu gọn dòng | 1 | Med | Thấp (diff rộng) | M |
| 5 | Rà authorization chống IDOR mọi route trips/itinerary/favorites | 2 | High | Thấp | M |
| 6 | Rà OTP/rate-limit/reset-password tránh leak | 2 | High | Thấp | S |
| 7 | Tách component lớn (TripDetailModal, profile page) + loading/empty/error đủ | 3 | Med | TB | L |
| 8 | A11y cơ bản (label/aria/focus/contrast) | 3 | Med | Thấp | M |
| 9 | Bổ sung unit test cho service mới + integration còn thiếu | 4 | Med | Thấp | M |
| 10 | Cập nhật README/API_REPORT/AGENTS + REFACTOR_SUMMARY | 5 | Low | Thấp | S |

---

## 5. Cổng chất lượng mỗi phase

`npm run lint && npm run typecheck && npm test && npm run build` — phải xanh trước khi qua phase sau.

**Blocker hiện tại:** `npm test` cần MongoDB (27017) + Redis (6379). Hiện **Docker daemon chưa chạy** nên integration suite (37 file) không chạy được. `lint`/`typecheck`/`build` không cần DB.

→ Để thực thi đúng kỷ luật doc, cần khởi động `docker compose up -d` trước. Nếu DB không thể bật, sẽ chạy cổng rút gọn `lint + typecheck + build` và đánh dấu rõ test bị hoãn trong từng commit.

---

## 5b. Phase 2 — Kết quả audit IDOR/Auth (2026-07-01)

Đã rà toàn bộ route thao tác tài nguyên user. **Không phát hiện lỗ hổng IDOR.**

| Khu vực | Cơ chế phân quyền | Kết luận |
|---|---|---|
| trips/[id] + sub-routes (itinerary, budget, checklist, accommodation, weather) | `getTripForEdit/View(id, userId)` **kèm** `String(item.tripId) !== id` | ✅ chống IDOR lồng |
| itinerary/reorder, checklist/bulk | lọc `foreign` item không thuộc trip | ✅ |
| favorites/[id], search-history/[id], reviews/[id] | check `userId` sở hữu → 404/403 | ✅ |
| collaborators (+/[userId]) | `findOwnedTrip` → chỉ chủ trip | ✅ collaborator không quản lý người khác |
| forgot-password | message generic "nếu email tồn tại…", chỉ gửi mail khi user hợp lệ | ✅ chống user-enumeration |

Quan sát minor (không sửa — rủi ro/UX):
- forgot-password có timing side-channel nhẹ (skip gửi mail khi user không tồn tại). Fix đúng cần constant-time padding — rủi ro cao, lợi ích thấp cho đồ án.
- send-otp (đăng ký) trả 409 "Email đã được đăng ký" — tradeoff UX chuẩn, không coi là lỗ hổng.

## 6. Nguyên tắc thực thi (theo doc)
- Không đổi behavior công khai (response shape, route path, schema DB) trừ khi ghi rõ + giữ backward-compat.
- Commit nhỏ theo Conventional Commits.
- Không đụng secrets/.env.
- Quyết định nhiều hướng (vd đổi auth flow) → DỪNG, hỏi trước.
- Không tái thêm bản đồ/marker/popup (ngoài scope).
