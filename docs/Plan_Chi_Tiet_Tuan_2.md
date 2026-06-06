# Kế hoạch Tuần 2 — Smart Travel Guide

<aside>
🎯

**Mục tiêu Tuần 2:** Hiện thực hoá các tính năng lõi (Auth + Places Search + Trips/Itinerary) theo thiết kế Tuần 1. Ưu tiên chạy được end-to-end ở local với MongoDB + Redis.

</aside>

## 📦 Sản phẩm bàn giao

### A. Backend/API (Next.js Route Handlers)

- [ ]  Auth: đăng ký / đăng nhập / đăng xuất (JWT HttpOnly cookie)
- [ ]  Places: tìm địa danh (Nominatim) + POI xung quanh (Overpass) + cache Redis
- [ ]  Weather: xem thời tiết (OpenWeatherMap) + cache Redis
- [ ]  Trips: CRUD chuyến đi
- [ ]  Itinerary: thêm/xoá/sắp xếp địa điểm theo ngày (orderIndex)
- [ ]  Favorites: lưu/bỏ lưu địa điểm
- [ ]  Audit log: ghi log cho các hành động chính (tối thiểu CREATE_TRIP)

### B. Nền tảng kỹ thuật

- [ ]  Middleware/Guard: kiểm tra JWT cho route cần đăng nhập
- [ ]  Validate input bằng Zod cho tất cả API
- [ ]  Error handling thống nhất (HTTP status + message)
- [ ]  Rate limit Redis: login + search
- [ ]  Seed/fixtures (tuỳ chọn): dữ liệu mẫu để test nhanh

### C. Frontend (tối thiểu để demo)

- [ ]  Trang Login/Register
- [ ]  Trang Search địa danh + hiển thị kết quả
- [ ]  Trang Trips: tạo chuyến đi + xem danh sách
- [ ]  Trang Trip detail: itinerary theo ngày (tối thiểu list)

---

## 📅 Lộ trình 7 ngày (Tuần 2)

### Ngày 8 — Setup nền Auth + Model

- [ ]  Tạo schema Mongoose: `User`, `Trip`, `Place`, `ItineraryItem`, `FavoritePlace`, `AuditLog`
- [ ]  Viết helper hash/verify password (bcrypt)
- [ ]  Viết helper JWT (jose): sign/verify + set cookie HttpOnly
- [ ]  Viết middleware/utility `requireAuth` cho API

### Ngày 9 — API Auth (Register/Login/Logout) + Rate limit login

- [ ]  `POST /api/auth/register`
- [ ]  `POST /api/auth/login` (rate limit `rl:login:{ip}`)
- [ ]  `POST /api/auth/logout` (blacklist token nếu dùng jti)
- [ ]  Test bằng Postman/Thunder Client

### Ngày 10 — API Places Search (Cache Hit/Miss)

- [ ]  `GET /api/places/search?q=` gọi Nominatim
- [ ]  Cache Redis `geo:search:{query}` (TTL 24h)
- [ ]  Lưu/Upsert vào MongoDB collection `places`

### Ngày 11 — API POI + Weather + Rate limit search

- [ ]  `GET /api/places/poi?lat=&lng=&radius=&type=` gọi Overpass
- [ ]  Cache Redis `poi:{lat}:{lng}:{radius}:{type}` (TTL 12h)
- [ ]  `GET /api/weather?lat=&lng=` gọi OpenWeatherMap
- [ ]  Cache Redis `weather:{lat}:{lng}` (TTL 15–30 phút)
- [ ]  Rate limit search `rl:search:{ip}`

### Ngày 12 — API Trips CRUD + Audit log

- [ ]  `POST /api/trips` (tạo trip) + ghi `auditLogs`
- [ ]  `GET /api/trips` (list theo user)
- [ ]  `GET /api/trips/:id`, `PATCH /api/trips/:id`, `DELETE /api/trips/:id`

### Ngày 13 — API Itinerary + Favorites

- [ ]  `POST /api/trips/:id/itinerary` (thêm item)
- [ ]  `PATCH /api/trips/:id/itinerary/:itemId` (đổi orderIndex/note/time)
- [ ]  `DELETE /api/trips/:id/itinerary/:itemId`
- [ ]  Favorites: `POST/DELETE /api/favorites` + `GET /api/favorites`

### Ngày 14 — Frontend demo tối thiểu + tổng hợp

- [ ]  UI Login/Register
- [ ]  UI Search địa danh + POI + Weather (tối thiểu hiển thị text)
- [ ]  UI Trips + Trip detail + itinerary list
- [ ]  Review: eslint/build pass, refactor nhẹ, cập nhật README

---

## ✅ Checklist nghiệm thu Tuần 2

- [ ]  Auth end-to-end hoạt động (cookie JWT)
- [ ]  Places search có cache Redis (Hit/Miss)
- [ ]  POI + Weather có cache Redis
- [ ]  Trips CRUD hoạt động theo user
- [ ]  Itinerary thêm/xoá/sắp xếp theo ngày
- [ ]  Favorites lưu/bỏ lưu
- [ ]  Rate limit login + search hoạt động
- [ ]  Có demo UI tối thiểu để chạy luồng chính