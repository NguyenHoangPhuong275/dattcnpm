# Smart Travel Guide (Hệ thống Tổng hợp & Gợi ý Du lịch Thông minh)

Smart Travel Guide là ứng dụng Web giúp người dùng khám phá địa điểm du lịch, xem thông tin điểm tham quan (POI), cập nhật tình hình thời tiết, lưu địa điểm yêu thích và lập lịch trình chuyến đi cá nhân một cách chi tiết.

Dự án được xây dựng phục vụ môn học **Đồ án Thực tế Công nghệ Phần mềm**.

---

## 🛠️ Công nghệ sử dụng

*   **Framework:** Next.js 15+ (App Router, TypeScript, ESLint)
*   **Giao diện:** Tailwind CSS
*   **Cơ sở dữ liệu chính:** MongoDB
*   **Cache, Session & Rate Limit:** Redis
*   **Định vị & Bản đồ:** OpenStreetMap (Tile Server), Overpass API, Nominatim, OSRM

---

## 📂 Cấu trúc thư mục (Scaffold Tuần 1)

```text
smart-travel-guide/
├── docs/                      # Tài liệu phân tích và thiết kế Tuần 1
│   ├── 01_SRS.md              # Đặc tả yêu cầu phần mềm
│   ├── 02_USE_CASE.md         # Biểu đồ và đặc tả Use Case
│   ├── 03_DATA_MODEL.md       # Thiết kế dữ liệu MongoDB và Redis
│   └── 04_SEQUENCE.md         # Sơ đồ tuần tự các luồng xử lý chính
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── health/        # Endpoint kiểm tra trạng thái hoạt động
│   │   │   └── debug/
│   │   │       ├── db/        # Kiểm tra kết nối MongoDB
│   │   │       └── redis/     # Kiểm tra kết nối Redis
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── lib/
│   │   ├── mongodb.ts         # Singleton kết nối MongoDB (Mongoose)
│   │   └── redis.ts           # Kết nối Redis client (ioredis)
│   └── types/                 # Định nghĩa kiểu dữ liệu TypeScript
├── .env.example               # Khung biến môi trường
├── docker-compose.yml         # Container chạy MongoDB & Redis tại local
├── package.json
└── README.md
```

---

## 🚀 Hướng dẫn cài đặt & Chạy ứng dụng

### 1. Yêu cầu hệ thống
Đảm bảo máy tính của bạn đã cài đặt các công cụ sau:
*   [Node.js (phiên bản 18 trở lên)](https://nodejs.org/)
*   [Docker & Docker Compose](https://www.docker.com/)

### 2. Thiết lập cơ sở dữ liệu và bộ nhớ đệm
Khởi chạy dịch vụ MongoDB và Redis bằng Docker Compose:
```bash
docker compose up -d
```
Lệnh này sẽ tải xuống các hình ảnh và khởi chạy hai container:
*   **MongoDB:** chạy trên cổng `27017`
*   **Redis:** chạy trên cổng `6379`

### 3. Cấu hình biến môi trường
Sao chép tệp tin cấu hình môi trường mẫu:
```bash
cp .env.example .env
```
*(Nếu sử dụng Windows PowerShell, dùng lệnh: `copy .env.example .env`)*

Tệp tin `.env` được cấu hình mặc định để kết nối trực tiếp đến các container chạy qua Docker Compose ở local.

### 4. Cài đặt các thư viện phụ thuộc
Cài đặt tất cả các package cần thiết của dự án Next.js:
```bash
npm install
```

### 5. Khởi chạy dự án ở môi trường Phát triển (Development)
Chạy lệnh khởi động máy chủ phát triển:
```bash
npm run dev
```
Mở trình duyệt và truy cập [http://localhost:3000](http://localhost:3000) để xem ứng dụng hoạt động.

---

## 🔌 Các Endpoint Kiểm tra kỹ thuật (Health & Debug API)

Để hỗ trợ kiểm tra tính thông suốt của kết nối dịch vụ trong giai đoạn phát triển, hệ thống cung cấp các API sau:

*   **Health Check:** `GET /api/health`
    *   *Mục đích:* Kiểm tra ứng dụng hoạt động.
    *   *Kết quả mong đợi:* `{"status": "ok", ...}`
*   **MongoDB Connection Check:** `GET /api/debug/db`
    *   *Mục đích:* Kiểm tra kết nối từ Next.js đến MongoDB.
    *   *Kết quả mong đợi:* `{"status": "success", "connected": true, ...}`
*   **Redis Connection Check:** `GET /api/debug/redis`
    *   *Mục đích:* Kiểm tra kết nối từ Next.js đến Redis qua lệnh PING-PONG.
    *   *Kết quả mong đợi:* `{"status": "success", "connected": true, "response": "PONG"}`
