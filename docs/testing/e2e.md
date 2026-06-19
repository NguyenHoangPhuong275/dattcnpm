# E2E Smoke Test (Playwright)

> Task 3.3 — kiểm thử happy path đầu-cuối trên trình duyệt thật.

## Phạm vi

`e2e/smoke.spec.ts` chạy 1 kịch bản happy path:

đăng ký → nhập OTP → đăng nhập → tạo chuyến đi → thêm điểm dừng → áp dụng checklist
→ mở trang lịch trình trên trình duyệt và xác minh.

Các bước backend đi qua HTTP thật (`page.request`, dùng chung cookie với trình
duyệt). OTP và place được **seed trực tiếp** (Redis/Mongo) để bỏ phụ thuộc dịch vụ
email (Resend) và tìm kiếm địa điểm ngoài → test ổn định, không flaky.

## Chạy local

Cần MongoDB + Redis (xem README, `docker compose up -d`) và file `.env`.

```bash
# Cài browser cho Playwright (chỉ lần đầu)
npx playwright install chromium

# Chạy E2E (tự khởi động `npm run dev`, reuse nếu server đang chạy)
npm run test:e2e

# Chế độ UI để debug
npm run test:e2e:ui
```

> E2E seed/dọn dữ liệu trên **DB dev** (cùng `MONGODB_URI` với server). Dữ liệu test
> được dọn trong `afterAll`. Dùng email `e2e_<timestamp>@example.test`.

## Quan hệ với test khác

- `npm test` (vitest) **không** chạy E2E — `vitest.config.ts` đã `exclude: e2e/**`,
  và specs E2E dùng đuôi `*.spec.ts` trong thư mục `e2e/`.
- CI (`.github/workflows/ci.yml`) tách **job riêng** `e2e` để không làm chậm job
  `unit` (lint + typecheck + vitest).
