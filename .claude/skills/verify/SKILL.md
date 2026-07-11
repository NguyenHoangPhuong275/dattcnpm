# Verify: Smart Travel Guide

Cách chạy và xác minh thay đổi trên app thật.

## Launch

```bash
npm run dev          # http://localhost:3000, ready sau ~1s (Turbopack)
```

- Nếu báo "Another next dev server is already running" nhưng port 3000 không có listener (`netstat -ano | findstr :3000` chỉ thấy TIME_WAIT): tiến trình cũ đã chết, chạy lại `npm run dev` là được.
- App cần MongoDB + Redis từ `.env` (máy này dùng Atlas non-SRV multi-host + Redis cloud, không cần Docker).

## Drive (GUI surface)

Playwright đã có sẵn (`@playwright/test` devDependency, Chromium đã cài). Script chạy từ ngoài repo phải resolve module qua repo:

```js
import { createRequire } from 'node:module';
const require = createRequire('file:///D:/LapTrinhAI/dattcnpm/package.json');
const { chromium } = require('@playwright/test');
```

Flows đáng lái:
- Trang chủ `/`: ô tìm trong `#planner`; `/?q=<query>` tự chạy tìm kiếm và cuộn tới planner.
- `/local/<slug>` (vd `ha-noi`, `thanh-hoa`): card Tin tức du lịch → `/travel-references/<slug>` (bài tham khảo + danh sách địa điểm theo vùng); card Khám phá thêm → `/local/<slug>/places?theme=van-hoa|thien-nhien` hoặc `/hotels?q=`.
- `/travel-references` (index) và `/travel-references/<slug>`: dữ liệu tĩnh từ `src/data/travel-references.ts` + curated destinations (`src/data/vietnam-tourism-destinations.json`).
- `/hotels?q=<tên>`: input được prefill và tự tìm.
- Auth: đăng nhập qua modal (`/?auth=login`); API test có thể dùng header `x-user-id` khi `NODE_ENV === 'test'`.

## Gotchas

- Screenshot/bằng chứng lưu vào `D:\Preview\<YYYY-MM-DD>_dattcnpm_<mô tả>\` (quy ước của user), script tạm để trong scratchpad và xóa sau khi xong.
- Tìm kiếm địa điểm gọi Nominatim/Overpass thật — chờ 8–12s cho kết quả mạng chậm.
