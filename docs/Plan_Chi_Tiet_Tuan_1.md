# Kế hoạch Chi tiết Tuần 1 — Smart Travel Guide (Next.js + MongoDB + Redis)

Kế hoạch này được tổng hợp và tối ưu hóa dựa trên hai định hướng phân tích từ Grok và ChatGPT, chuyển đổi toàn bộ kiến trúc từ SQLite/Prisma sang MongoDB làm cơ sở dữ liệu chính và Redis làm lớp bộ nhớ đệm (Cache/Session/Rate limit).

---

## 1. Mục tiêu & Sản phẩm bàn giao Tuần 1

### 1.1 Tài liệu thiết kế (Thư mục `docs/`)
*   **`docs/01_SRS.md`**: Đặc tả yêu cầu phần mềm chi tiết (Actor, Scope, Functional/Non-functional).
*   **`docs/02_USE_CASE.md`**: Sơ đồ Use Case tổng quát (Mermaid) và đặc tả chi tiết 10 use case chính.
*   **`docs/03_DATA_MODEL.md`**: Thiết kế cấu trúc các Collection MongoDB (Mongoose Schema, Index, Reference) và Kiến trúc Cache Redis (Key, TTL, Rate limit).
*   **`docs/04_SEQUENCE.md`**: Sơ đồ tuần tự (Sequence Diagram) cho 3 luồng lõi hệ thống: Đăng nhập, Tìm kiếm địa danh có Cache, và Tạo chuyến đi có lưu Audit Log.

### 1.2 Mã nguồn khung (Scaffold)
*   Khung dự án Next.js 15+ (App Router, TypeScript, Tailwind CSS, ESLint).
*   Cấu hình môi trường (`.env.example`) và `docker-compose.yml` chạy MongoDB & Redis tại local.
*   Mã nguồn kết nối cơ sở dữ liệu (`src/lib/mongodb.ts`) và cache (`src/lib/redis.ts`).
*   Hệ thống Endpoint kiểm tra trạng thái hoạt động:
    *   `/api/health`: Kiểm tra chung ứng dụng.
    *   `/api/debug/db`: Kiểm tra kết nối MongoDB.
    *   `/api/debug/redis`: Kiểm tra phản hồi (PING-PONG) từ Redis.

---

## 2. Kế hoạch chi tiết theo từng ngày (7 ngày)

### Ngày 1: Phân tích Phạm vi & Đặc tả SRS (`docs/01_SRS.md`)
*   **Nhiệm vụ:**
    1. Phân chia rõ ràng phạm vi nghiệp vụ cho 3 Actor chính: Guest (Chưa đăng nhập), User (Đăng nhập), Admin (Quản trị viên).
    2. Xác định các tính năng bắt buộc (In-Scope) và trì hoãn các tính năng nâng cao (Out-of-Scope như AI Recommendation, Xuất PDF, Cảnh báo thời tiết) sang các tuần cuối.
    3. Viết tài liệu `docs/01_SRS.md` theo cấu trúc: Giới thiệu, Mô tả tác nhân, Danh sách yêu cầu chức năng (FR), Yêu cầu phi chức năng (NFR), Ràng buộc kỹ thuật.
*   **Chi tiết tài liệu `docs/01_SRS.md` cần tạo:**
    *   **FR-01 đến FR-04 (Guest):** Xem bản đồ, Tìm địa danh theo tên, Xem POI xung quanh vị trí, Xem thời tiết tại địa điểm.
    *   **FR-05 đến FR-11 (User):** Đăng ký, Đăng nhập (JWT HttpOnly cookie), Đăng xuất, Tạo/Sửa/Xóa chuyến đi, Thêm địa điểm vào lịch trình, Lưu địa điểm yêu thích, Xem lịch sử tìm kiếm.
    *   **FR-12 đến FR-15 (Admin):** Xem danh sách người dùng, Khóa/Mở tài khoản user, Xem thống kê hệ thống, Xem audit log.
*   **Tiêu chí hoàn thành:** File `docs/01_SRS.md` được tạo và viết đầy đủ các mục tiêu thiết kế.

### Ngày 2: Thiết kế Use Case chi tiết (`docs/02_USE_CASE.md`)
*   **Nhiệm vụ:**
    1. Thiết kế sơ đồ Use Case bằng Mermaid Flowchart thể hiện mối quan hệ giữa Guest, User, Admin và các chức năng hệ thống.
    2. Đặc tả chi tiết các Use Case quan trọng gồm: Tác nhân kích hoạt, Điều kiện tiên quyết (Pre-conditions), Luồng xử lý chính (Main Flow), và Điều kiện đầu ra (Post-conditions).
*   **Sơ đồ Use Case đề xuất (Mermaid):**
    ```mermaid
    flowchart LR
        Guest[Khách - Guest]
        User[Thành viên - User]
        Admin[Quản trị - Admin]

        subgraph Map_Search [Bản đồ & Tìm kiếm]
            UC1[Xem bản đồ]
            UC2[Tìm địa danh]
            UC3[Xem POI xung quanh]
            UC4[Xem thời tiết]
        end

        subgraph Auth [Xác thực]
            UC5[Đăng ký]
            UC6[Đăng nhập]
            UC7[Đăng xuất]
        end

        subgraph Trip_Mgmt [Quản lý Chuyến đi]
            UC8[Tạo/Sửa/Xóa chuyến đi]
            UC9[Lập lịch trình chi tiết]
            UC10[Lưu địa điểm yêu thích]
            UC11[Xem lịch sử tìm kiếm]
        end

        subgraph Admin_Panel [Quản trị hệ thống]
            UC12[Quản lý người dùng]
            UC13[Xem thống kê]
            UC14[Xem audit log]
        end

        Guest --> UC1
        Guest --> UC2
        Guest --> UC3
        Guest --> UC4
        Guest --> UC5
        Guest --> UC6

        User --> UC1
        User --> UC2
        User --> UC3
        User --> UC4
        User --> UC6
        User --> UC7
        User --> UC8
        User --> UC9
        User --> UC10
        User --> UC11

        Admin --> UC6
        Admin --> UC7
        Admin --> UC12
        Admin --> UC13
        Admin --> UC14
    ```
*   **Tiêu chí hoàn thành:** Hoàn thiện `docs/02_USE_CASE.md` chứa mã nguồn Mermaid hiển thị chuẩn xác sơ đồ phân rã chức năng.

### Ngày 3: Thiết kế dữ liệu MongoDB (`docs/03_DATA_MODEL.md` - Phần 1)
*   **Nhiệm vụ:**
    1. Chuyển đổi mô hình ERD cũ sang mô hình Document Store của MongoDB.
    2. Xác định quan hệ tham chiếu (Reference) bằng `ObjectId` đối với các collection lớn độc lập (`itineraryItems`) để tránh document `trips` vượt giới hạn kích thước 16MB.
    3. Định nghĩa cấu trúc Chi tiết (Schema) cho 7 Collection chính:
        *   `users`: `_id`, `email` (unique, lowercase), `passwordHash`, `fullName`, `role` ("USER" | "ADMIN"), `isLocked` (boolean), `createdAt`, `updatedAt`.
        *   `trips`: `_id`, `userId` (ref: users), `title`, `destination`, `startDate`, `endDate`, `createdAt`, `updatedAt`.
        *   `places`: `_id`, `osmId` (unique index), `name`, `type`, `lat`, `lng`, `address`, `raw` (lưu object thô từ OSM API), `createdAt`.
        *   `itineraryItems`: `_id`, `tripId` (ref: trips), `placeId` (ref: places), `day` (number), `orderIndex` (number), `note`, `startTime`, `endTime`, `createdAt`.
        *   `favoritePlaces`: `_id`, `userId` (ref: users), `placeId` (ref: places), `createdAt`.
        *   `searchHistories`: `_id`, `userId` (ref: users, optional), `query`, `lat`, `lng`, `createdAt`.
        *   `auditLogs`: `_id`, `userId` (ref: users, optional), `action`, `targetType`, `targetId`, `metadata`, `createdAt`.
    4. Xác định các trường cần đánh chỉ mục (Index) như:
        *   `users`: `{ email: 1 }` (unique)
        *   `trips`: `{ userId: 1, startDate: -1 }`
        *   `places`: `{ osmId: 1 }` (unique, sparse), `{ lat: 1, lng: 1 }`
        *   `favoritePlaces`: `{ userId: 1, placeId: 1 }` (unique)
*   **Tiêu chí hoàn thành:** Viết xong phần thiết kế MongoDB trong `docs/03_DATA_MODEL.md`.

### Ngày 4: Thiết kế Kiến trúc Redis Cache & Rate Limit (`docs/03_DATA_MODEL.md` - Phần 2)
*   **Nhiệm vụ:**
    1. Xác định cơ chế caching cho các API bên ngoài để tránh nghẽn và vượt quá định mức (Rate Limit) của các nhà cung cấp bên thứ ba (Nominatim, Overpass, OpenWeatherMap, OSRM).
    2. Thiết kế định dạng Key và chính sách TTL (Time-To-Live) tối ưu cho Redis:
        *   **Cache Geocoding:** Key `geo:search:{query}` -> Value: JSON string kết quả (TTL: 24 giờ).
        *   **Cache POI:** Key `poi:{lat}:{lng}:{radius}:{type}` -> Value: JSON string danh sách địa điểm (TTL: 12 giờ).
        *   **Cache thời tiết:** Key `weather:{lat}:{lng}` -> Value: JSON string hiện tại + dự báo (TTL: 15-30 phút).
        *   **Đăng xuất mạnh:** Key `blacklist:{jti}` -> Value: `"1"` (TTL khớp với thời gian hết hạn còn lại của JWT).
    3. Thiết kế luồng chặn Brute-force Login (`rl:login:{ip}`) và Rate limit tìm kiếm (`rl:search:{ip}`) bằng thuật toán Token Bucket / Fixed Window trên Redis.
*   **Tiêu chí hoàn thành:** Hoàn thành toàn bộ `docs/03_DATA_MODEL.md` gồm MongoDB và Redis.

### Ngày 5: Thiết kế Sequence Diagrams (`docs/04_SEQUENCE.md`)
*   **Nhiệm vụ:**
    1. Vẽ sơ đồ Sequence đăng nhập tích hợp Redis Rate Limit (chặn IP spam đăng nhập) và MongoDB query kiểm tra mật khẩu băm.
    2. Vẽ sơ đồ Sequence tìm kiếm địa điểm có kiểm tra Cache Redis (Luồng Hit/Miss): Trả kết quả ngay nếu có cache; gọi API ngoài, lưu ngược vào Redis và DB nếu không có cache.
    3. Sơ đồ tuần tự tạo chuyến đi kết hợp chèn dữ liệu vào MongoDB và tự động sinh nhật ký hoạt động (`auditLogs`).
*   **Sơ đồ Sequence Tìm kiếm Địa danh đề xuất (Mermaid):**
    ```mermaid
    sequenceDiagram
        actor User as Người dùng
        participant UI as Search UI
        participant API as /api/places/search
        participant Redis as Redis Cache
        participant Nominatim as Nominatim API
        participant Overpass as Overpass API
        participant Mongo as MongoDB

        User->>UI: Nhập từ khóa địa danh (ví dụ: "Da Lat")
        UI->>API: GET /api/places/search?q=Da%20Lat
        API->>API: Validate từ khóa (Zod)
        API->>Redis: GET geo:search:da-lat
        
        alt Trường hợp: Cache Hit
            Redis-->>API: Trả về kết quả tọa độ + POI cũ
        else Trường hợp: Cache Miss
            API->>Nominatim: Gửi request Geocode lấy tọa độ
            Nominatim-->>API: Trả về vĩ độ (lat) & kinh độ (lng)
            API->>Overpass: Tìm các POI xung quanh tọa độ
            Overpass-->>API: Trả về danh sách POI thô
            API->>Mongo: Lưu/Cập nhật POI vào collection `places` (Upsert)
            API->>Redis: SET geo:search:da-lat [Dữ liệu] (TTL: 24h)
        end
        
        API-->>UI: Trả về JSON dữ liệu địa điểm & danh sách POI
        UI-->>User: Hiển thị kết quả tìm kiếm & Marker trên bản đồ
    ```
*   **Tiêu chí hoàn thành:** File `docs/04_SEQUENCE.md` hiển thị đúng các sơ đồ Sequence bằng Mermaid.

### Ngày 6: Khởi tạo Project & Cấu hình Docker Local
*   **Nhiệm vụ:**
    1. Khởi tạo mã nguồn Next.js:
       ```bash
       npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --yes
       ```
    2. Cài đặt các thư viện cần thiết:
       ```bash
       npm install mongoose ioredis zod bcryptjs jose
       npm install -D vitest @types/bcryptjs
       ```
    3. Tạo file `docker-compose.yml` để dựng nhanh môi trường chạy MongoDB và Redis local cho lập trình viên.
       ```yaml
       # docker-compose.yml
       services:
         mongodb:
           image: mongo:7
           container_name: smart-travel-mongodb
           ports:
             - "27017:27017"
           volumes:
             - mongo_data:/data/db
         redis:
           image: redis:7-alpine
           container_name: smart-travel-redis
           ports:
             - "6379:6379"
           command: redis-server --appendonly yes
           volumes:
             - redis_data:/data
       volumes:
         mongo_data:
         redis_data:
       ```
    4. Thiết lập file mẫu cấu hình môi trường `.env.example` chứa đầy đủ các biến kết nối.
    5. Viết mã nguồn kết nối Singleton cho MongoDB (`src/lib/mongodb.ts`) sử dụng Mongoose và Redis (`src/lib/redis.ts`) sử dụng ioredis.
*   **Tiêu chí hoàn thành:** Khởi chạy được lệnh `npm run dev`, container MongoDB và Redis chạy ổn định ở local.

### Ngày 7: Tạo Debug Route, Kiểm thử & Đóng gói
*   **Nhiệm vụ:**
    1. Tạo Route API kiểm tra trạng thái `/api/health` trả về JSON đơn giản.
    2. Tạo Route API debug `/api/debug/db` (kết nối thử MongoDB và trả về trạng thái).
    3. Tạo Route API debug `/api/debug/redis` (gửi lệnh PING tới Redis và kiểm tra phản hồi PONG).
    4. Chạy kiểm tra toàn bộ ứng dụng Next.js để đảm bảo không lỗi biên dịch (build success).
    5. Đóng gói mã nguồn và đẩy lên Git Repository.
*   **Tiêu chí hoàn thành:** Gọi thành công 3 endpoint debug đạt kết quả trạng thái `ok`, mã nguồn được cập nhật sạch sẽ lên GitHub.

---

## 3. Checklist nghiệm thu Tuần 1

*   [ ] Có `docs/01_SRS.md` mô tả các actor, chức năng chính phụ, yêu cầu phi chức năng và ràng buộc kỹ thuật.
*   [ ] Có `docs/02_USE_CASE.md` gồm sơ đồ use case tổng thể và đặc tả chi tiết 10 use case.
*   [ ] Có `docs/03_DATA_MODEL.md` mô tả cấu trúc MongoDB Collection, field, index, và thiết kế key/TTL cho Redis cache.
*   [ ] Có `docs/04_SEQUENCE.md` chứa tối thiểu 3 sequence diagram lõi.
*   [ ] Khung Next.js + TS + Tailwind chạy thành công bằng `npm run dev`.
*   [ ] Có `docker-compose.yml` định nghĩa dịch vụ MongoDB & Redis local.
*   [ ] Có file `src/lib/mongodb.ts` và `src/lib/redis.ts` xử lý kết nối an toàn.
*   [ ] Tồn tại các api route `/api/health`, `/api/debug/db`, `/api/debug/redis` trả về dữ liệu kết nối thành công.
*   [ ] Đã commit và push toàn bộ tài liệu cùng project khung lên GitHub.
