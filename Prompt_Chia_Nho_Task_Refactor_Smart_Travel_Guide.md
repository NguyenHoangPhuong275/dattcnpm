# Prompt Chia Nhỏ Task Refactor — Smart Travel Guide

Tài liệu này dùng để đưa cho Codex/AI coding agent refactor project Smart Travel Guide theo từng task nhỏ, an toàn, không đổi nghiệp vụ.

Căn cứ hiện trạng: project đã review chức năng chính và đang ở trạng thái `SAFE TO COMMIT / SAFE TO DEPLOY`, `typecheck`, `lint`, `npm test` đều pass với `40 file / 170 tests`. Vì vậy toàn bộ refactor bên dưới phải là **behavior-preserving**.

---

## Nguyên tắc chung

- Chỉ làm đúng 1 task mỗi lượt.
- Không tự nhảy sang task tiếp theo.
- Không gộp nhiều task.
- Không rewrite lớn.
- Không refactor lan man.
- Không đổi API contract.
- Không đổi route, payload, response shape, status code.
- Không đổi database schema nếu task không yêu cầu rõ.
- Không làm yếu auth/admin/webhook/cron/rate-limit.
- Không phá reorder 2 pha và unique index itinerary `{ tripId, day, orderIndex }`.
- Không phá hotel matching, HotelSuggestions, TripAccommodation.
- Không thêm retry `E11000` không liên quan.
- Không hardcode dữ liệu giả.
- Không log secret/token/password/API key/PII.
- Không thêm comment mới vào code.
- Không thêm dependency mới nếu không thật sự cần.
- Không skip test để che lỗi.
- Không làm mất dấu tiếng Việt.

---

## Quy trình sau mỗi task

Sau mỗi task chỉ chạy:

```bash
npm run typecheck
npm run lint
```

Không chạy full test sau từng task.  
Full test chỉ chạy ở task cuối:

```bash
npm test
```

Format báo cáo sau mỗi task:

```md
## Báo cáo Task X

### 1. Kết luận task
DONE hoặc NEED FIX.

### 2. File đã sửa
| File | Thay đổi | Lý do | Có đổi behavior không? |
|---|---|---|---|

### 3. Phạm vi refactor

### 4. Những gì cố ý không đổi
- API contract
- Database schema
- Auth/admin/webhook/cron/rate-limit
- Reorder 2 pha + unique index itinerary
- Hotel dataset vs TripAccommodation
- UI/UX lớn
- Logic nghiệp vụ cốt lõi

### 5. Rủi ro còn lại

### 6. Kết quả kiểm tra nhanh
- npm run typecheck:
- npm run lint:

### 7. Trạng thái
Đã hoàn thành Task X, chưa chuyển sang Task X+1.
Chưa chạy npm test vì full test chỉ chạy ở Task cuối.
```

---

# Task 0 — Baseline Refactor Review

## Prompt

```text
Thực hiện Task 0: Baseline Refactor Review cho Smart Travel Guide.

Chỉ review, không sửa code.

Mục tiêu:
- Đọc code thực tế hiện tại.
- Xác định các khu vực có thể refactor an toàn.
- Không đổi behavior.
- Không triển khai refactor trong task này.

Phạm vi:
- src/app
- src/app/api
- src/components
- src/hooks
- src/lib
- src/lib/db/models
- scripts
- tests
- README.md
- package.json
- config files

Cần xác nhận:
- Auth/Profile/Search/Trips/Itinerary/Checklist/Budget/Hotels/Accommodation/Favorites/Collaborators/Admin/Webhook/Cron đang ổn.
- Không có issue blocking.
- Liệt kê refactor candidates theo mức độ an toàn.

Chạy:
- npm run typecheck
- npm run lint

Không chạy npm test.

Output:
## Báo cáo Task 0 — Baseline Refactor Review
### 1. Kết luận
### 2. Phạm vi đã kiểm tra
### 3. Refactor candidates
| Mức độ ưu tiên | Khu vực | Lý do | Rủi ro |
### 4. Kết quả typecheck/lint
### 5. Có thể bắt đầu Task 1 chưa?

Dừng lại sau Task 0.
```

---

# Task 1 — Cleanup Nhỏ: Imports, Naming, Dead Code

## Prompt

```text
Thực hiện Task 1: Cleanup imports/naming/dead code an toàn.

Chỉ làm cleanup nhỏ, không đổi behavior.

Phạm vi:
- src/app
- src/components
- src/hooks
- src/lib
- scripts
- tests

Cần làm:
- Xóa unused import.
- Xóa unused variable.
- Xóa dead code rõ ràng.
- Gộp import trùng.
- Chuẩn hóa naming local nếu không ảnh hưởng public API.
- Xóa console/debug log không cần thiết nếu không phải log vận hành.
- Không động vào logic nghiệp vụ.

Không được:
- Không đổi tên export public đang dùng rộng.
- Không đổi API route.
- Không đổi response shape.
- Không đổi UI layout.
- Không đổi schema/model.
- Không thêm comment mới.
- Không refactor component lớn.

Chạy:
- npm run typecheck
- npm run lint

Không chạy npm test.

Output:
## Báo cáo Task 1 — Cleanup Nhỏ
### 1. File đã sửa
### 2. Cleanup đã làm
### 3. Behavior có đổi không?
### 4. Kết quả typecheck/lint
### 5. Kết luận DONE/NEED FIX

Dừng lại sau Task 1.
```

---

# Task 2 — Refactor API Helpers Và Error Handling

## Prompt

```text
Thực hiện Task 2: Refactor API helpers và error handling consistency.

Chỉ làm refactor backend/API an toàn, không đổi contract.

Phạm vi:
- src/app/api/auth/**
- src/app/api/profile/**
- src/app/api/places/**
- src/app/api/trips/**
- src/app/api/hotels/search/route.ts
- src/app/api/webhook/route.ts
- src/app/api/cron/weather-alerts/route.ts
- src/lib/api-response.ts
- src/lib/validations/**
- src/lib/auth.ts
- src/lib/trip-permission.ts

Cần kiểm tra:
- Route nào lệch pattern sendSuccess/handleApiError.
- Route nào parse input chưa nhất quán.
- Route nào có try/catch lặp có thể gom nhẹ.
- Route nào thiếu validate ObjectId rõ ràng.
- Không leak stack trace.
- Không log secret/PII.

Có thể sửa:
- Dùng helper sẵn có thay vì duplicate response/error.
- Chuẩn hóa tên biến local.
- Xóa code bắt lỗi dư nếu helper đã xử lý.
- Chuẩn hóa validation import.

Không được:
- Không đổi status code hiện tại.
- Không đổi response shape.
- Không đổi route/payload.
- Không làm yếu auth/admin/permission guard.
- Không refactor logic nghiệp vụ route.
- Không chạm webhook/cron security nếu không có lỗi rõ.

Chạy:
- npm run typecheck
- npm run lint

Không chạy npm test.

Output:
## Báo cáo Task 2 — API Refactor
### 1. File đã sửa
### 2. Pattern đã chuẩn hóa
### 3. Contract có đổi không?
### 4. Security guard có đổi không?
### 5. Kết quả typecheck/lint
### 6. Kết luận DONE/NEED FIX

Dừng lại sau Task 2.
```

---

# Task 3 — Refactor TripDetailModal Và Component Sections

## Prompt

```text
Thực hiện Task 3: Refactor TripDetailModal và các section liên quan.

Chỉ làm refactor UI component, không đổi nghiệp vụ.

Phạm vi:
- src/components/profile/TripDetailModal.tsx
- src/components/trips/**
- src/components/hotels/HotelSuggestions.tsx

Mục tiêu:
- Nếu TripDetailModal quá dài, tách nhỏ section rõ ràng nhưng giữ nguyên UI.
- Giữ nguyên itinerary/checklist/budget/collaborators/hotel suggestions.
- Không đổi props public nếu không cần.
- Không đổi text UI nếu không cần.
- Không đổi flow lưu khách sạn vào TripAccommodation.
- Không làm stale state.
- Không phá AbortController/lastQueryRef trong HotelSuggestions.

Có thể làm:
- Tách component con nội bộ nếu giảm rõ độ phức tạp.
- Tách helper local nhỏ nếu logic lặp.
- Chuẩn hóa prop naming local.
- Xóa duplicated JSX rõ ràng.
- Giữ className/style hiện tại.

Không được:
- Không đổi layout lớn.
- Không đổi loading/empty/error/toast behavior.
- Không đổi permission UI.
- Không đổi API call endpoint.
- Không thêm dependency.
- Không thêm comment mới.

Chạy:
- npm run typecheck
- npm run lint

Không chạy npm test.

Output:
## Báo cáo Task 3 — Refactor TripDetailModal
### 1. File đã sửa
### 2. Component/helper đã tách nếu có
### 3. UI/behavior có đổi không?
### 4. Các luồng đã giữ nguyên
### 5. Kết quả typecheck/lint
### 6. Kết luận DONE/NEED FIX

Dừng lại sau Task 3.
```

---

# Task 4 — Refactor Hotel Matching Và Hotel Search API

## Prompt

```text
Thực hiện Task 4: Refactor hotel matching và hotel API nhỏ gọn.

Chỉ làm refactor nội bộ, không đổi behavior matching.

Phạm vi:
- src/lib/hotel-matching.ts
- src/lib/vietnam-tourism.ts
- src/lib/validations/hotel.ts
- src/app/api/hotels/search/route.ts
- tests/lib/hotel-matching.test.ts
- tests/integration/hotels.integration.test.ts nếu cần cập nhật import/path

Mục tiêu:
- Làm hotel-matching dễ đọc hơn.
- Tách helper nếu function quá dài.
- Giữ nguyên các test case hiện tại:
  - Đà Nẵng chỉ match Đà Nẵng.
  - Hạ Long/Ha Long match Quảng Ninh.
  - multi-destination/coords vẫn đúng.
  - input thiếu không crash.
  - hotel thiếu province vẫn fallback an toàn khi province không rõ.
- Giữ nguyên API response.
- Giữ nguyên cache key nếu không có bug.
- Giữ nguyên rate limit/bounded scan.

Không được:
- Không thay đổi scoring làm đổi kết quả nếu không có bug rõ.
- Không đổi schema Hotel.
- Không đổi TripAccommodation.
- Không hardcode dữ liệu giả.
- Không thêm dependency.
- Không thêm comment mới.

Chạy:
- npm run typecheck
- npm run lint

Không chạy npm test.

Output:
## Báo cáo Task 4 — Refactor Hotel Matching/API
### 1. File đã sửa
### 2. Helper đã tách nếu có
### 3. Matching behavior có đổi không?
### 4. API contract có đổi không?
### 5. Kết quả typecheck/lint
### 6. Kết luận DONE/NEED FIX

Dừng lại sau Task 4.
```

---

# Task 5 — Refactor Hooks Và Client State

## Prompt

```text
Thực hiện Task 5: Refactor hooks và client state.

Chỉ refactor hooks/state an toàn, không đổi UI/behavior.

Phạm vi:
- src/hooks/**
- client components trong src/components/**
- src/app/hotels/page.tsx
- src/components/hotels/HotelSuggestions.tsx
- src/components/profile/TripDetailModal.tsx
- useHomepageTripActions nếu có
- useToast/useFeedback/usePlaceSearch nếu có

Cần kiểm tra:
- useEffect dependency array thiếu/sai.
- useCallback dependency thiếu/sai.
- State bị stale khi đổi trip/destination.
- Duplicate fetch logic có thể gom nhẹ.
- setState sau unmount.
- Button submit/loading state trùng lặp.

Có thể sửa:
- Dùng AbortController/active flag nếu cần.
- Tách hook nhỏ nếu lặp rõ ràng và ít rủi ro.
- Chuẩn hóa loading/error state local.
- Xóa state không dùng.

Không được:
- Không đổi UI layout.
- Không đổi endpoint API.
- Không đổi toast message nếu không cần.
- Không refactor quá rộng.
- Không thêm dependency.
- Không thêm comment mới.

Chạy:
- npm run typecheck
- npm run lint

Không chạy npm test.

Output:
## Báo cáo Task 5 — Hooks/State Refactor
### 1. File đã sửa
### 2. Hook/state đã cải thiện
### 3. Behavior có đổi không?
### 4. Race/stale state đã kiểm tra
### 5. Kết quả typecheck/lint
### 6. Kết luận DONE/NEED FIX

Dừng lại sau Task 5.
```

---

# Task 6 — Refactor Database Models Và Barrel Exports

## Prompt

```text
Thực hiện Task 6: Refactor database models và barrel exports.

Chỉ làm cleanup cấu trúc import/export an toàn. Không đổi schema/index nếu không có bug rõ.

Phạm vi:
- src/lib/db/models/**
- src/lib/db/schema.ts
- src/lib/db/collections.ts
- src/lib/db/connection.ts
- src/lib/db/index.ts
- src/lib/db/models/index.ts

Cần kiểm tra:
- Barrel export có gây circular import không.
- Model registration dùng models.ModelName || model(...) nhất quán.
- Hotel model không lẫn với TripAccommodation.
- Itinerary unique index vẫn giữ nguyên.
- Favorite/TripShare unique index vẫn giữ nguyên.
- Collection names không bị đổi.
- Type exports rõ ràng.

Có thể sửa:
- Sắp xếp export cho rõ.
- Xóa export không dùng nếu chắc chắn.
- Chuẩn hóa type/value export nếu lệch.
- Xóa import thừa.

Không được:
- Không đổi collection name.
- Không đổi field name.
- Không đổi index.
- Không đổi schema behavior.
- Không thêm migration.
- Không phá getDb().hotels.
- Không phá OverwriteModelError guard.

Chạy:
- npm run typecheck
- npm run lint

Không chạy npm test.

Output:
## Báo cáo Task 6 — DB Models Refactor
### 1. File đã sửa
### 2. Export/model cleanup đã làm
### 3. Schema/index có đổi không?
### 4. Kết quả typecheck/lint
### 5. Kết luận DONE/NEED FIX

Dừng lại sau Task 6.
```

---

# Task 7 — Refactor Scripts Và Docs Nhỏ Gọn

## Prompt

```text
Thực hiện Task 7: Refactor scripts và docs nhỏ gọn.

Chỉ làm scripts/docs. Không sửa runtime app nếu không cần.

Phạm vi:
- scripts/audit-itinerary-orderindex.ts
- scripts/import-hotels-osm.ts
- README.md
- package.json scripts nếu cần

Mục tiêu:
- Scripts có output rõ, không log secret.
- Docs không mâu thuẫn code.
- README không quá dài, không lặp.
- Hướng dẫn import hotels rõ.
- Hướng dẫn audit itinerary unique index rõ.
- Không hứa production có dữ liệu hotels nếu chưa import.
- Không hướng dẫn sai bảo mật.

Có thể sửa:
- Chuẩn hóa output script.
- Chuẩn hóa CLI options text.
- Gom docs bị lặp.
- Thêm npm script nếu thật sự giúp vận hành và không thêm dependency.

Không được:
- Không tự động chạy import/audit khi app start.
- Không gọi network trong test.
- Không log Mongo URI.
- Không ghi secret thật.
- Không thêm comment code mới.
- Không sửa API/runtime logic.

Chạy:
- npm run typecheck
- npm run lint

Không chạy npm test.

Output:
## Báo cáo Task 7 — Scripts/Docs Refactor
### 1. File đã sửa
### 2. Script/docs đã cải thiện
### 3. Runtime app có đổi không?
### 4. Kết quả typecheck/lint
### 5. Kết luận DONE/NEED FIX

Dừng lại sau Task 7.
```

---

# Task 8 — Refactor Tests Organization

## Prompt

```text
Thực hiện Task 8: Refactor tests organization.

Chỉ refactor test code. Không sửa production code nếu không có lỗi rõ.

Phạm vi:
- tests/**
- test setup/helper nếu có

Mục tiêu:
- Giảm duplicate setup rõ ràng.
- Chuẩn hóa naming test.
- Chuẩn hóa arrange/act/assert nếu đang lệch.
- Không xóa test có giá trị.
- Không skip test.
- Không mock quá mức.
- Không làm test yếu đi.
- Không gọi network thật trong test.

Có thể sửa:
- Tách helper test nếu duplicate rõ.
- Đổi mô tả test cho rõ hơn.
- Xóa mock thừa.
- Chuẩn hóa cleanup DB/Redis.

Không được:
- Không sửa production code.
- Không xóa assertion quan trọng.
- Không skip test.
- Không thay đổi test để che lỗi.
- Không thêm dependency nếu không cần.

Chạy:
- npm run typecheck
- npm run lint

Không chạy npm test.

Output:
## Báo cáo Task 8 — Tests Refactor
### 1. File test đã sửa
### 2. Test organization đã cải thiện
### 3. Có làm yếu test không?
### 4. Kết quả typecheck/lint
### 5. Kết luận DONE/NEED FIX

Dừng lại sau Task 8.
```

---

# Task 9 — Final Regression Review Và Full Test

## Prompt

```text
Thực hiện Task 9: Final Regression Review và Full Test sau chuỗi refactor.

Đây là task cuối cùng. Bây giờ mới chạy full test.

Không sửa code nếu không có lỗi rõ ràng. Nếu có lỗi, chỉ sửa tối thiểu và báo cáo rõ.

Phạm vi kiểm tra:
- Auth / Account
- Profile
- Search / Places / Recommendations
- Trips
- Itinerary / Reorder / Unique Index
- Checklist
- Budget
- Hotels / Hotel Matching / HotelSuggestions
- TripAccommodation
- Favorites
- Collaborators / Share
- Admin / Webhook / Cron
- Database / Models / Import Scripts
- UI/UX tổng thể
- Security tổng thể
- Docs / Config
- Tests

Bắt buộc xác nhận:
- Không đổi API contract.
- Không đổi route/payload/response/status cũ.
- Không đổi schema ngoài task được phép.
- Auth/admin/webhook/cron/rate-limit không yếu.
- Reorder 2 pha + unique index itinerary còn đúng.
- Hotel dataset và TripAccommodation vẫn tách biệt.
- HotelSuggestions không stale state.
- Không hardcode dữ liệu giả.
- Không gọi network thật trong test.
- Không log secret/PII.
- Không lỗi tiếng Việt.
- Không skip test.

Chạy đầy đủ:
- npm run typecheck
- npm run lint
- npm test

Nếu npm test fail:
- Phân loại lỗi do refactor, lỗi cũ, flaky, hay tooling.
- Nếu do refactor thì sửa tối thiểu.
- Nếu flaky thì chạy lại file liên quan đơn lẻ để xác minh.
- Không kết luận SAFE nếu còn lỗi blocking.

Output:
# Báo cáo Final Regression Review — Refactor

## 1. Kết luận nhanh
SAFE TO COMMIT hoặc NOT SAFE TO COMMIT.

## 2. Task refactor đã hoàn tất

## 3. Luồng chức năng đã kiểm tra

## 4. Issue phát hiện
| Mức độ | File/khu vực | Vấn đề | Ảnh hưởng | Hướng xử lý |

## 5. File đã sửa trong regression nếu có
| File | Thay đổi | Lý do |

## 6. Kết quả kiểm tra
- npm run typecheck:
- npm run lint:
- npm test:

## 7. Kết luận commit/deploy
Chỉ ghi SAFE nếu không có issue blocking và mọi check pass.
```

---

# Thứ tự triển khai khuyến nghị

1. Task 0 — Baseline Refactor Review.
2. Task 1 — Cleanup Nhỏ: Imports, Naming, Dead Code.
3. Task 2 — Refactor API Helpers Và Error Handling.
4. Task 3 — Refactor TripDetailModal Và Component Sections.
5. Task 4 — Refactor Hotel Matching Và Hotel Search API.
6. Task 5 — Refactor Hooks Và Client State.
7. Task 6 — Refactor Database Models Và Barrel Exports.
8. Task 7 — Refactor Scripts Và Docs Nhỏ Gọn.
9. Task 8 — Refactor Tests Organization.
10. Task 9 — Final Regression Review Và Full Test.

---

# Prompt điều phối chung cho Codex/AI Agent

```text
Bạn đang làm project Smart Travel Guide. Hãy chỉ thực hiện đúng task refactor được giao bên dưới.

Không tự ý làm task khác.
Không tự ý nhảy sang task tiếp theo.
Không refactor lan man.
Không đổi API contract/schema/security nếu task không yêu cầu.
Không làm yếu auth/admin/webhook/cron/rate-limit.
Không phá unique index itinerary hoặc reorder 2 pha.
Không phá hotel matching, HotelSuggestions, TripAccommodation.
Sau task chỉ chạy npm run typecheck và npm run lint.
Không chạy npm test cho đến Task cuối cùng.
Làm xong phải báo cáo và dừng lại.

Task cần làm:
[DÁN TASK CỤ THỂ Ở ĐÂY]
```
