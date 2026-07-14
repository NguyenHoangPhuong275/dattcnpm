# Kiến trúc hệ thống - Smart Travel Guide

Dự án **Smart Travel Guide** được xây dựng theo mô hình **Next.js App Router (Full-Stack Monolith)** áp dụng kiến trúc phân lớp (Layered Architecture) rõ ràng, kết hợp cơ chế SSR (Server-Side Rendering) để tối ưu hóa SEO và CSR (Client-Side Rendering) cho các bảng điều khiển động.

---

## 1. Sơ đồ kiến trúc tổng quan (Unicode Diagram)

Sơ đồ dưới đây mô tả luồng xử lý từ trình duyệt người dùng qua tầng bảo mật Edge Middleware, xử lý nghiệp vụ tại API Router và cuối cùng là lưu trữ tại MongoDB/Redis hoặc gọi các dịch vụ bên ngoài:

```text
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                          TẦNG GIAO DIỆN (CLIENT - BROWSER)                           ║
║                                                                                      ║
║   ┌───────────────────────┐      ┌────────────────────────┐      ┌───────────────┐   ║
║   │   React Pages (SSR)   │ ───► │  Custom Hooks (Client)  │ ───► │ api-client.ts │   ║
║   │  (/trips, /profile..) │      │   (useMyTrips,...)     │      │ (apiRequest)  │   ║
║   └───────────────────────┘      └────────────────────────┘      └───────┬───────┘   ║
╚══════════════════════════════════════════════════════════════════════════┼═══════════╝
                                                                           │
                                               HTTP Request (HttpOnly JWT) │
                                                                           ▼
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                       TẦNG CHỐT CHẶN BẢO MẬT (EDGE MIDDLEWARE)                       ║
║                                                                                      ║
║   ┌──────────────────────────────────────────────────────────────────────────────┐   ║
║   │        middleware.ts: Auth Guard, Route Protection, Header Blacklist         │   ║
║   └──────────────────────────────────────┬───────────────────────────────────────┘   ║
╚══════════════════════════════════════════┼═══════════════════════════════════════════╝
                                           │
                                 Request đã chứng thực
                                           ▼
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                   TẦNG NGHIỆP VỤ & API (SERVER-SIDE ROUTE HANDLERS)                  ║
║                                                                                      ║
║   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌───────────┐ ║
║   │   Auth Routes   │    │   Trip Routes   │    │ Place/Hotel R.  │    │ Cron Alert│ ║
║   │(/api/auth/...)  │    │(/api/trips/...) │    │(/api/places/...)│    │(/api/cron)│ ║
║   └────────┬────────┘    └────────┬────────┘    └────────┬────────┘    └─────┬─────┘ ║
║            │                      │                      │                   │       ║
║            ▼                      ▼                      ▼                   ▼       ║
║   ┌──────────────────────────────────────────────────────────────────────────────┐   ║
║   │ Core Helpers: Zod Validation, JWT (jose), Rate-Limiter, Audit Log Generation │   ║
║   └──────────────────────────────────────┬───────────────────────────────────────┘   ║
╚══════════════════════════════════════════┼═══════════════════════════════════════════╝
                                           │ Mongoose (qua getDb Singleton)
                                           ├─────────────────────────┐
                                           ▼                         ▼
╔══════════════════════════════════════════════════════════╗ ╔═════════════════════════╗
║                TẦNG CƠ SỞ DỮ LIỆU CHÍNH                  ║ ║    TẦNG CÁCHING & OTP   ║
║                                                          ║ ║                         ║
║     ┌──────────────────────────────────────────────┐     ║ ║  ┌───────────────────┐  ║
║     │             MongoDB / Mongoose               │     ║ ║  │       Redis       │  ║
║     │           (21 Collections Store)             │◄────╫─╬─►│   (ioredis)       │  ║
║     └──────────────────────┬───────────────────────┘     ║ ║  └───────────────────┘  ║
╚════════════════════════════┼═════════════════════════════╝ ╚═════════════════════════╝
                             │ Lấy dữ liệu hoặc đồng bộ
                             ▼
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                           CÁC DỊCH VỤ LIÊN KẾT NGOÀI                                 ║
║                                                                                      ║
║   ┌───────────────────────────┐    ┌────────────────────────┐    ┌─────────────────┐ ║
║   │   OpenStreetMap API       │    │   Open-Meteo API       │    │Resend Email API │ ║
║   │  (Nominatim / Overpass)   │    │  (Thời tiết thực tế)   │    │ (Gửi Email/OTP) │ ║
║   └───────────────────────────┘    └────────────────────────┘    └─────────────────┘ ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

---

## 2. Chi tiết các tầng thành phần

### A. Tầng Giao Diện (Client - Browser Layer)
* **Next.js & React Server Components (RSC)**: Sử dụng mô hình kết xuất phía máy chủ cho các trang thông tin tĩnh (như tin tức `/news`, trang chủ `/`, chi tiết địa điểm `/places/[id]`) để tăng tốc độ tải trang và tối ưu hóa SEO.
* **Client Components & Hooks**: Các phần tương tác động (như trang cá nhân `/profile`, danh sách chuyến đi `/trips`) sử dụng React State và Custom Hooks để gọi API.
* **api-client.ts**: Đầu mối duy nhất gọi API từ phía Client, bọc hàm `fetch` bằng helper `apiRequest` và kiểm soát mã lỗi thống nhất.

### B. Tầng Kiểm soát Bảo mật (Edge Middleware)
* **middleware.ts**: Sử dụng công nghệ Edge Runtime của Next.js để chặn và xác thực mã JWT (`auth_token` lưu trong HttpOnly Cookie) ngay khi yêu cầu đi vào hệ thống. Bảo vệ các tuyến đường riêng tư (`/profile`, `/trips`, `/schedule-reference`).
* **Lọc Header**: Loại bỏ các Header mô phỏng kiểm thử (`x-user-id`, `x-forwarded-user`) ở môi trường Production.

### C. Tầng Nghiệp Vụ & API Route Handlers
* **Route Handlers (`/api/*`)**: Toàn bộ luồng nghiệp vụ chạy ở Server-side để bảo vệ logic tính toán giá phòng, lưu trữ dữ liệu, và gọi dịch vụ ngoài.
* **Hỗ trợ xử lý API (`src/lib/api-handler.ts`)**: Cung cấp các hàm tiện ích chuẩn hóa như:
  * `requireAuthUser`: Bắt buộc người dùng đã đăng nhập và trả về đối tượng `User`.
  * `parseJsonBody`: Phân giải dữ liệu JSON an toàn có xử lý ngoại lệ.
  * `enforceRateLimit`: Thực thi giới hạn tần suất yêu cầu dựa trên Redis.
* **Xác thực dữ liệu (Zod Validation)**: Mọi dữ liệu đi vào API đều phải đi qua Zod Schemas định nghĩa tại `src/lib/validations/` trước khi gọi cơ sở dữ liệu.

### D. Tầng Truy cập Dữ liệu & Lưu trữ (DAL)
* **getDb Entrypoint**: Hàm singleton trả về kết nối MongoDB tái sử dụng, ngăn chặn việc tràn kết nối ở môi trường máy chủ Serverless/Dev.
* **Mongoose Models**: Ánh xạ Schema chặt chẽ cho 21 collection, định nghĩa chỉ mục (indexes) để tăng hiệu suất truy vấn.
* **Redis caching & Best-effort**: Redis được sử dụng làm bộ nhớ đệm cache kết quả tìm kiếm vị trí (OSM), thời tiết (Open-Meteo), thông tin hồ sơ và mã xác thực OTP. 
  * *Nguyên tắc Best-effort*: Nếu Redis gặp lỗi kết nối, hệ thống sẽ tự động chuyển sang cơ chế cache in-memory thay thế để tránh làm ngắt quãng trải nghiệm người dùng.

### E. Dịch vụ bên thứ ba (External Services)
* **OpenStreetMap (OSM) / Nominatim / Overpass**: Thực hiện chuyển đổi từ khóa thành tọa độ địa lý (Geocoding) và truy vấn các địa danh (POI), khách sạn xung quanh tọa độ đã chọn.
* **Open-Meteo**: Cung cấp thông tin thời tiết thực tế cho widget trang chủ và cung cấp dữ liệu dự báo cho tiến trình cảnh báo thời tiết tự động.
* **Resend**: Trực tiếp gửi thư điện tử chứa OTP đăng ký/đổi mật khẩu và gửi cảnh báo thời tiết khi phát hiện thời tiết xấu đe dọa lịch trình chuyến đi của người dùng.
