# KẾ HOẠCH DỰ ÁN — ĐỒ ÁN THỰC TẾ CÔNG NGHỆ PHẦN MỀM

## 1. Thông tin chung

| Mục | Nội dung |
|---|---|
| Tên đề tài | Hệ thống Tổng hợp & Gợi ý Du lịch Thông minh (Smart Travel Guide) |
| Loại sản phẩm | Web Application (responsive, dùng tốt trên cả desktop & mobile) |
| Số người thực hiện | 1 |
| Thời gian | 6 tuần |
| Phương pháp | Vibe coding (AI hỗ trợ viết code) + tự kiểm thử |

### Lý do chọn đề tài
- Lõi kỹ thuật là **tích hợp nhiều API thật** (bản đồ, định tuyến, thời tiết) — đúng sở trường về API/network.
- Có **lớp nghiệp vụ quản lý** (tài khoản, chuyến đi, lịch trình) đủ dày để thể hiện trọn quy trình CNPM: phân tích yêu cầu, thiết kế (use case, ERD, sequence), lập trình, kiểm thử, tài liệu.
- **Không phụ thuộc emulator/ảo hóa** (máy phát triển không chạy được emulator Android) — web chạy trực tiếp trên trình duyệt, vòng lặp phát triển và kiểm thử khép kín.
- Tận dụng kinh nghiệm/nền tảng web sẵn có để rút ngắn thời gian.

### Vì sao chọn Web thay vì Mobile
- Môn CNPM chấm **quy trình kỹ thuật phần mềm**, không ràng buộc nền tảng.
- Máy phát triển gặp lỗi phần cứng khi chạy ảo hóa (emulator Android sập máy) → mobile không khả thi để phát triển/kiểm thử nhanh.
- Web responsive vẫn demo được trên điện thoại (mở bằng trình duyệt điện thoại), đủ tính "thực tế".

---

## 2. Công nghệ sử dụng

| Lớp | Công nghệ | Ghi chú |
|---|---|---|
| Framework | Next.js (App Router) + React + TypeScript | Full-stack trong 1 codebase |
| Giao diện | Tailwind CSS | Responsive, gọn |
| Bản đồ | Leaflet + React-Leaflet | Hiển thị map, marker, tuyến đường |
| Cơ sở dữ liệu chính | MongoDB (Document Store) | Linh hoạt với dữ liệu POI/OSM, hỗ trợ geospatial index mạnh |
| ORM / ODM | Mongoose (khuyến nghị) hoặc mongodb driver | Kết nối Singleton, schema linh hoạt |
| Cache / Rate Limit / Session | Redis | Cache API bên thứ ba, rate limit, token blacklist, session |
| Xác thực | JWT (HttpOnly cookie) + bcrypt | Đăng nhập/đăng ký |
| Kiểm thử | Vitest | Unit test cho logic & API |
| Validation | Zod | Kiểm tra dữ liệu đầu vào |

### Các API bên ngoài (miễn phí, đăng ký được cho cá nhân)
| Dịch vụ | Dùng để | Ghi chú |
|---|---|---|
| OpenStreetMap (tile) | Nền bản đồ | Không cần key |
| Overpass API (OSM) | Tìm địa điểm (POI): quán ăn, khách sạn, điểm tham quan | Không cần key |
| OSRM | Tính tuyến đường & thời gian di chuyển | Public demo server |
| OpenWeatherMap | Thời tiết theo địa điểm | Cần API key miễn phí |
| Nominatim (OSM) | Tìm kiếm địa danh → toạ độ (geocoding) | Không cần key |

> Ghi chú: tất cả lời gọi API bên ngoài đi qua **route API của Next.js** (server-side) để giấu key, cache kết quả và chuẩn hoá dữ liệu.

---

## 3. Các vai trò người dùng (Actors)

| Vai trò | Mô tả |
|---|---|
| Khách (Guest) | Xem bản đồ, tìm địa điểm, xem thời tiết — không lưu được |
| Người dùng (User) | Đăng ký/đăng nhập; tạo & quản lý chuyến đi, lịch trình, địa điểm yêu thích; xem lịch sử |
| Quản trị (Admin) | Quản lý người dùng, xem thống kê, xem nhật ký hệ thống (audit log) |

---

## 4. Danh sách chức năng

### 4.1. Xác thực & tài khoản
- Đăng ký tài khoản (email + mật khẩu, validate bằng Zod)
- Đăng nhập / đăng xuất (JWT trong HttpOnly cookie)
- Đổi mật khẩu
- Phân quyền User / Admin

### 4.2. Bản đồ & tìm kiếm (lõi API)
- Hiển thị bản đồ nền (OpenStreetMap)
- Tìm địa danh theo tên → định vị trên bản đồ (Nominatim)
- Tìm địa điểm quanh khu vực theo loại: ăn uống, lưu trú, tham quan (Overpass)
- Xem chi tiết địa điểm (tên, loại, toạ độ)
- Định tuyến giữa 2 điểm + ước tính thời gian/quãng đường (OSRM)
- Xem thời tiết hiện tại & dự báo tại địa điểm (OpenWeatherMap)

### 4.3. Quản lý chuyến đi (lõi nghiệp vụ)
- Tạo / sửa / xoá chuyến đi (tên, ngày bắt đầu, ngày kết thúc, điểm đến)
- Thêm địa điểm vào chuyến đi
- Lập lịch trình theo ngày (gắn địa điểm vào từng ngày của chuyến đi)
- Đánh dấu địa điểm yêu thích
- Xem lại lịch sử tìm kiếm

### 4.4. Quản trị (Admin)
- Danh sách người dùng + khoá/mở
- Thống kê: số người dùng, số chuyến đi, địa điểm được lưu nhiều nhất
- Xem nhật ký hệ thống (audit log)

### 4.5. Tính năng nâng cao (làm nếu còn thời gian)
- Gợi ý lịch trình tự động bằng LLM (nhập điểm đến + số ngày → sinh lịch trình mẫu)
- Xuất lịch trình ra PDF
- Cảnh báo thời tiết xấu cho ngày có lịch trình

---

## 5. Mô hình dữ liệu (Logical Model)

**Lưu ý:** Dự án sử dụng **MongoDB (Document Store)**. Mô hình dưới đây là logical view (đơn giản hóa). Thực tế dùng `ObjectId` tham chiếu giữa các collection độc lập (để tránh document quá lớn) + flexible fields (tags, metadata, osmTags...).

Xem chi tiết + indexes + Redis keys tại:
- `docs/03_DATA_MODEL.md`
- `src/database/schema.ts` (nguồn types chính thức)

```
User
  └─< Trip
        └─< ItineraryItem (ref Place)
  └─< FavoritePlace (ref Place)
  └─< SearchHistory
  └─< Review (ref Place)
  └─< UserFollow

Place (cache POI từ Overpass + dữ liệu OSM phong phú)
Tag / PlaceTag / UserPreference   (hỗ trợ gợi ý rule-based)

TripBudget / TripAccommodation / ItineraryTransport / TripChecklist   (nghiệp vụ chi tiết)
TripShare / Notification

AuditLog
```

Quan hệ chính (tham chiếu bằng ObjectId ở tầng app):
- 1 User có nhiều Trip, Favorite, SearchHistory, Review, Follow...
- 1 Trip có nhiều ItineraryItem, Budget, Accommodation, Checklist...
- Place dùng làm cache + nguồn dữ liệu POI chung.

---

## 6. Kiến trúc tổng thể

```
[ Trình duyệt (React UI) ]
        │  fetch
        ▼
[ Next.js Route Handlers (API) ]  ── xác thực JWT, validate Zod, xử lý lỗi
        │
        ├── Mongoose / MongoDB driver
        │
        ▼
[ MongoDB (collections: users, trips, places, itineraryItems, reviews, ... ) ]
        │
        └── Redis (cache: geo:search:*, poi:*, weather:* | rate limit | session | blacklist)
                    │
                    └── Gọi API ngoài (Nominatim, Overpass, OpenWeatherMap, OSRM) khi cache miss
```

Nguyên tắc:
- UI không gọi thẳng API ngoài → đi qua route API của Next.js (giấu key, cache, chuẩn hoá).
- Mọi dữ liệu vào đều validate bằng Zod.
- Logic nghiệp vụ tách khỏi UI (đặt trong thư mục `lib/`).

---

## 7. Kế hoạch 6 tuần

### Tuần 1 — Phân tích & Thiết kế
- Viết đặc tả yêu cầu (SRS): mô tả chức năng, actor, ràng buộc
- Vẽ sơ đồ Use Case
- Thiết kế Data Model MongoDB (theo 03_DATA_MODEL.md) + Redis + tham chiếu đến src/database/schema.ts (nguồn types)
- Vẽ sơ đồ tuần tự (Sequence) cho 2-3 luồng chính (đăng nhập, tạo chuyến đi, tìm địa điểm)
- Chốt công nghệ, khởi tạo project, cấu hình MongoDB + Redis (docker-compose) + Mongoose
- **Sản phẩm:** tài liệu thiết kế + project khung chạy được "Hello World"

### Tuần 2 — Nền tảng & Xác thực
- Tạo Mongoose schemas (theo src/database/schema.ts)
- Chức năng đăng ký / đăng nhập / đăng xuất / đổi mật khẩu + rate limit Redis
- Kết nối MongoDB (Singleton) + Redis client
- Middleware bảo vệ route, phân quyền User/Admin
- Layout chung, trang chủ
- **Sản phẩm:** đăng nhập hoạt động, có phân quyền

### Tuần 3 — Lõi bản đồ & API
- Tích hợp Leaflet (bản đồ nền)
- Route API: tìm địa danh (Nominatim), tìm POI (Overpass)
- Hiển thị marker, popup chi tiết địa điểm
- Tích hợp thời tiết (OpenWeatherMap)
- Cache kết quả API
- **Sản phẩm:** tìm và xem địa điểm + thời tiết trên bản đồ

### Tuần 4 — Nghiệp vụ chuyến đi
- CRUD chuyến đi
- Thêm địa điểm vào chuyến đi, lập lịch trình theo ngày
- Địa điểm yêu thích, lịch sử tìm kiếm
- Định tuyến OSRM giữa các điểm
- **Sản phẩm:** quản lý chuyến đi hoàn chỉnh

### Tuần 5 — Quản trị, Kiểm thử & Hoàn thiện
- Trang Admin: quản lý user, thống kê, audit log
- Viết unit test (Vitest) cho logic & API chính
- Hoàn thiện giao diện, responsive, xử lý lỗi
- (Tuỳ chọn) gợi ý lịch trình bằng LLM
- **Sản phẩm:** đầy đủ chức năng + bộ test

### Tuần 6 — Tài liệu & Báo cáo
- Hoàn thiện báo cáo đồ án (chương: mở đầu, phân tích, thiết kế, cài đặt, kiểm thử, kết luận)
- Chuẩn bị slide + kịch bản demo
- Rà soát lại sơ đồ cho khớp code thực tế
- Test trên điện thoại thật (mở web bằng trình duyệt điện thoại)
- **Sản phẩm:** báo cáo + slide + bản demo sẵn sàng bảo vệ

---

## 8. Rủi ro & cách xử lý

| Rủi ro | Cách xử lý |
|---|---|
| API ngoài (Overpass/OSRM) chậm hoặc lỗi | Cache kết quả, có nhiều endpoint dự phòng, hiển thị trạng thái loading/error |
| Hết thời gian cho tính năng nâng cao | Tính năng LLM/PDF để cuối, là tuỳ chọn — không ảnh hưởng phần lõi |
| Bị hỏi sâu về thiết kế khi bảo vệ | Tài liệu thiết kế làm kỹ từ tuần 1, sơ đồ khớp với code |
| Cần demo "app điện thoại" | Web responsive → mở bằng trình duyệt điện thoại là đủ |

---

## 9. Tiêu chí hoàn thành (Definition of Done)
- Tất cả chức năng ở mục 4.1–4.4 chạy được
- Có phân quyền User/Admin
- Có bộ unit test cho logic và API chính, chạy pass
- Có đầy đủ tài liệu: SRS, Use Case, ERD, Sequence
- Demo được luồng: đăng nhập → tìm địa điểm → tạo chuyến đi → lập lịch trình → xem thời tiết
- Báo cáo + slide hoàn chỉnh
