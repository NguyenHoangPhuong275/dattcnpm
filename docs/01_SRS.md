# 1. ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)

## 1.1. Mục đích tài liệu
Tài liệu SRS mô tả phạm vi, tác nhân, yêu cầu chức năng và yêu cầu phi chức năng của hệ thống Smart Travel Guide trong giai đoạn Tuần 1. Tài liệu được dùng làm cơ sở để thiết kế use case, thiết kế dữ liệu, xây dựng sơ đồ tuần tự và dựng khung mã nguồn.

## 1.2. Phạm vi hệ thống trong Tuần 1
* Tập trung vào thiết kế hệ thống và dựng khung dự án, chưa triển khai đầy đủ nghiệp vụ sản phẩm.
* Hoàn thiện nhóm tài liệu trong thư mục `docs/`: `01_SRS.md`, `02_USE_CASE.md`, `03_DATA_MODEL.md`, `04_SEQUENCE.md`.
* Dựng scaffold dự án Next.js 15+ với App Router, TypeScript, Tailwind CSS và ESLint.
* Chuyển định hướng lưu trữ từ SQLite/Prisma sang MongoDB làm cơ sở dữ liệu chính.
* Sử dụng Redis cho cache, session và rate limit ở mức thiết kế và chuẩn bị kết nối kỹ thuật.

## 1.3. Ngoài phạm vi Tuần 1
* Giao diện hoàn chỉnh cho toàn bộ nghiệp vụ.
* Đăng nhập, đăng ký và phân quyền production-ready.
* Tích hợp bản đồ, thời tiết thực tế, gợi ý thông minh bằng AI/LLM (FR-13b) hoặc tích hợp cổng thanh toán thật.
* Upload ảnh, dashboard admin hoàn chỉnh và kiểm thử E2E đầy đủ.
* Deploy production.

## 1.4. Actor của hệ thống
| Actor | Mô tả | Quyền hạn chính |
|---|---|---|
| **Guest** | Khách chưa đăng nhập | Xem bản đồ, tìm địa danh, xem POI, xem thời tiết, đăng ký và đăng nhập. |
| **User** | Người dùng đã đăng nhập | Toàn bộ quyền Guest, quản lý chuyến đi, lịch trình, yêu thích và lịch sử tìm kiếm. |
| **Admin** | Quản trị viên hệ thống | Quản lý người dùng, quản lý địa điểm, xem thống kê và audit log. |
| **External Service** | Dịch vụ bên ngoài | Cung cấp dữ liệu bản đồ, geocoding, POI, thời tiết hoặc gợi ý trong các giai đoạn sau. |

## 1.5. Yêu cầu chức năng
### 1.5.1. Nhóm Guest
| Mã | Tên chức năng | Mô tả |
|---|---|---|
| **FR-01** | Xem bản đồ | Hiển thị bản đồ tương tác để người dùng quan sát khu vực du lịch. |
| **FR-02** | Tìm địa danh | Tìm địa danh theo từ khóa người dùng nhập. |
| **FR-03** | Xem POI xung quanh | Hiển thị các điểm tham quan hoặc dịch vụ gần vị trí đã chọn. |
| **FR-04** | Xem thời tiết | Hiển thị thông tin thời tiết tại địa điểm du lịch. |
| **FR-05** | Đăng ký | Tạo tài khoản mới bằng họ tên, email và mật khẩu. |
| **FR-06** | Đăng nhập | Xác thực người dùng bằng email và mật khẩu. |

### 1.5.2. Nhóm User
| Mã | Tên chức năng | Mô tả |
|---|---|---|
| **FR-07** | Đăng xuất | Hủy phiên đăng nhập hiện tại. |
| **FR-08** | Quản lý thông tin cá nhân | Xem và cập nhật thông tin cơ bản của tài khoản. |
| **FR-09** | Quản lý chuyến đi | Tạo, sửa, xóa và xem chi tiết chuyến đi. |
| **FR-10** | Lập lịch trình | Thêm địa điểm vào lịch trình theo ngày, ghi chú và thứ tự tham quan. |
| **FR-11** | Lưu yêu thích | Lưu hoặc bỏ lưu địa điểm khỏi danh sách yêu thích. |
| **FR-12** | Xem lịch sử tìm kiếm | Xem lại các truy vấn địa danh đã tìm kiếm. |
| **FR-13a** | Nhận gợi ý địa điểm (Luật) | Nhận gợi ý địa điểm dựa trên tag, lịch sử tìm kiếm hoặc danh sách địa điểm đã lưu bằng thuật toán lọc dựa trên quy tắc (rule-based). |
| **FR-13b** | Gợi ý địa điểm bằng AI | Nhận gợi ý địa điểm thông minh, cá nhân hóa sâu bằng việc tích hợp các mô hình ngôn ngữ lớn (LLM) hoặc học máy nâng cao (ngoài phạm vi Tuần 1). |

### 1.5.3. Nhóm Admin
| Mã | Tên chức năng | Mô tả |
|---|---|---|
| **FR-14** | Quản lý người dùng | Xem danh sách người dùng, khóa hoặc mở khóa tài khoản. |
| **FR-15** | Quản lý địa điểm | Thêm, sửa, xóa hoặc ẩn hiện dữ liệu địa điểm. |
| **FR-16** | Xem thống kê | Theo dõi số lượng người dùng, chuyến đi, địa điểm và lượt tìm kiếm. |
| **FR-17** | Xem audit log | Xem nhật ký thao tác quan trọng trong hệ thống. |

## 1.6. Yêu cầu phi chức năng
| Mã | Nhóm yêu cầu | Mô tả |
|---|---|---|
| **NFR-01** | Hiệu năng | API cơ bản trong môi trường local/dev nên phản hồi dưới 500ms với dữ liệu mẫu. Danh sách phải có phân trang. |
| **NFR-02** | Cache | Redis được dùng để cache kết quả tìm kiếm, POI, thời tiết, session và rate limit. |
| **NFR-03** | Bảo mật mật khẩu | Mật khẩu phải được hash, không lưu plain text và không trả passwordHash về client. |
| **NFR-04** | Phân quyền | Hệ thống phân biệt tối thiểu ba vai trò: guest, user và admin. |
| **NFR-05** | Bảo vệ API | Validate input, kiểm tra authentication/authorization, rate limit và không trả lỗi raw cho client. |
| **NFR-06** | Độ tin cậy | Kết nối MongoDB dùng lại connection; Redis lỗi không được làm sập các chức năng không bắt buộc. |
| **NFR-07** | Khả năng bảo trì | Code dùng TypeScript, ESLint, cấu trúc thư mục rõ ràng, tách lib và types. |
| **NFR-08** | Khả năng mở rộng | Thiết kế cho phép mở rộng AI recommendation, map API, weather API, review, booking và đa ngôn ngữ. |

## 1.7. Ràng buộc kỹ thuật
* Next.js 15+ sử dụng App Router và thư mục `src`.
* TypeScript là ngôn ngữ chính.
* Tailwind CSS dùng cho giao diện.
* MongoDB là database chính.
* Redis dùng cho cache, session và rate limit.
* Không dùng SQLite và không dùng Prisma trong thiết kế hiện tại.

## 1.8. Lý do chuyển đổi công nghệ
Quyết định loại bỏ SQLite và Prisma để chuyển đổi sang MongoDB kết hợp với Redis dựa trên các phân tích chuyên môn kỹ thuật sâu sắc sau:

### 1.8.1. Tại sao chọn MongoDB làm cơ sở dữ liệu chính?
1. **Bản chất của dữ liệu địa điểm (POIs):** Dữ liệu địa điểm du lịch từ các nguồn như OpenStreetMap (thông qua API Nominatim và Overpass) rất phong phú, không đồng nhất và có cấu trúc bán định dạng (semi-structured). Mỗi loại địa điểm (nhà hàng, khách sạn, công viên, bảo tàng) đều có các thuộc tính (`tags`) đặc thù riêng biệt. Mô hình document-store của MongoDB (lưu dưới dạng BSON/JSON linh hoạt) cực kỳ thích hợp để lưu trữ loại dữ liệu này mà không làm phình to hoặc phức tạp hóa các bảng dữ liệu như trong mô hình quan hệ của SQLite.
2. **Hỗ trợ không gian địa lý (Geospatial Queries):** Tính năng lõi của một ứng dụng hướng dẫn du lịch thông minh là tìm kiếm địa điểm, danh lam thắng cảnh xung quanh một vị trí tọa độ `(lat, lng)` trong một bán kính xác định. MongoDB hỗ trợ mặc định kiểu chỉ mục `2dsphere` cùng các toán tử không gian địa lý mạnh mẽ như `$near`, `$geoWithin`, giúp truy vấn cực nhanh các điểm POI mà không đòi hỏi cài đặt thêm extension phức tạp như SpatiaLite trên SQLite.
3. **Hiệu năng và khả năng mở rộng:** Hệ thống dự kiến mở rộng lưu trữ lịch trình chuyến đi lớn, ảnh chụp, và đánh giá. MongoDB có hiệu năng ghi cực cao và khả năng mở rộng quy mô (scaling) tốt hơn nhiều so với SQLite vốn bị giới hạn bởi ghi đồng thời (write lock toàn bộ file cơ sở dữ liệu).

### 1.8.2. Tại sao đưa Redis vào kiến trúc sớm?
1. **Vượt qua giới hạn Rate Limit của API bên thứ ba:** Các API của OpenStreetMap (Nominatim cho Geocoding và Overpass cho POI) cũng như OpenWeatherMap là các dịch vụ miễn phí hoặc giới hạn tần suất truy vấn rất nghiêm ngặt (ví dụ: tối đa 1 request/giây đối với Nominatim). Nếu người dùng tìm kiếm liên tục, hệ thống sẽ nhanh chóng bị chặn (HTTP 429). Redis đóng vai trò làm lớp bộ đệm (Cache Hit rate cao) lưu trữ kết quả tìm kiếm theo tọa độ và từ khóa, giúp giảm tải đến 80-90% request thực tế ra bên ngoài, đồng thời rút ngắn tốc độ phản hồi từ hàng giây xuống còn dưới 10ms.
2. **Quản lý Session và Token Blacklist hiệu năng cao:** Cơ chế xác thực dùng JWT (JSON Web Token) có nhược điểm là khó thu hồi trước khi hết hạn. Sử dụng Redis để quản lý Token Blacklist (lưu các mã `jti` của JWT đã đăng xuất với thời gian sống TTL tương ứng) giúp vô hiệu hóa token ngay lập tức khi người dùng click Đăng xuất mà không cần liên tục truy vấn ghi/đọc đĩa trong MongoDB.
3. **Bảo mật và Rate Limit API:** Redis cung cấp cấu trúc dữ liệu lưu trữ hiệu năng cao để thực hiện cơ chế chặn Brute-force mật khẩu (như giới hạn IP thử đăng nhập tối đa 5 lần/15 phút) thông qua các lệnh nguyên tử `INCR` và thiết lập `EXPIRE`.

### 1.8.3. Tại sao loại bỏ Prisma?
Mặc dù Prisma là một ORM phổ biến, việc hỗ trợ MongoDB của Prisma vẫn còn nhiều hạn chế kỹ thuật:
* Prisma yêu cầu định nghĩa schema cứng nhắc thông qua file `schema.prisma`, làm mất đi tính linh hoạt phi cấu trúc (schemaless) vốn là thế mạnh lớn nhất của MongoDB.
* Prisma tạo ra một lớp engine trung gian viết bằng Rust làm tăng dung lượng bundle và gánh nặng tài nguyên khi chạy trong môi trường serverless (như Next.js API Routes).
* Việc sử dụng **Mongoose** (một thư viện ODM chuyên dụng cho MongoDB) cung cấp khả năng kiểm soát kết nối trực tiếp dưới dạng Connection Pool (mô hình Singleton), hỗ trợ đầy đủ các tính năng nâng cao của MongoDB như Embedded Documents (lịch trình nằm trong chuyến đi), Geospatial Indexes, và Aggregation Framework một cách trực quan, tối ưu hiệu năng tốt nhất.

### 1.8.4. Đánh đổi kỹ thuật (Trade-offs)
* **Độ phức tạp hạ tầng tăng:** Thay vì chỉ cần quản lý duy nhất một file cơ sở dữ liệu SQLite cục bộ, nhà phát triển và hệ thống vận hành phải thiết lập, cấu hình và chạy đồng thời cả MongoDB và Redis. Vấn đề này đã được giải quyết triệt để ở môi trường local bằng Docker Compose.
* **Không có ràng buộc toàn vẹn khóa ngoại (Foreign Key Constraints) ở mức database:** MongoDB không ép buộc tính toàn vẹn tham chiếu như cơ sở dữ liệu quan hệ. Do đó, việc duy trì tính nhất quán dữ liệu (ví dụ: khi xóa một User thì phải tự động xóa các Trips liên quan) phải được kiểm soát cẩn thận ở tầng ứng dụng bằng các cơ chế tiền xử lý (pre-save/pre-remove middleware của Mongoose) hoặc viết code nghiệp vụ tường minh.

## 1.9. Ma trận truy vết yêu cầu (Traceability Matrix)
Bảng dưới đây thể hiện sự liên kết chặt chẽ từ yêu cầu chức năng (FR) đến ca sử dụng (UC), các collection dữ liệu chịu ảnh hưởng trong MongoDB/Redis và sơ đồ tuần tự (Sequence Diagram) tương ứng nhằm kiểm soát tiến độ và chất lượng dự án.

| Mã FR | Tên yêu cầu chức năng | Ca sử dụng (UC) | Cơ sở dữ liệu ảnh hưởng (MongoDB / Redis Keys) | Sơ đồ tuần tự tương ứng | Trạng thái |
|---|---|---|---|---|---|
| **FR-01** | Xem bản đồ | UC01 | Không trực tiếp lưu DB (gọi API Leaflet/OpenStreetMap ở client) | N/A | Trong phạm vi |
| **FR-02** | Tìm địa danh | UC02 | `places`, `searchHistories` / Cache `geo:search:*` | Sơ đồ 4.1: Tìm kiếm địa danh có cache | Trong phạm vi |
| **FR-03** | Xem POI xung quanh | UC03 | `places` / Cache `poi:*` | Sơ đồ 4.1: Tìm kiếm địa danh có cache | Trong phạm vi |
| **FR-04** | Xem thời tiết | UC04 | Không lưu MongoDB / Cache `weather:*` | N/A | Trong phạm vi |
| **FR-05** | Đăng ký | UC05 | `users` | N/A | Trong phạm vi |
| **FR-06** | Đăng nhập | UC06 | `users` / Rate limit `rl:login:*`, Session `session:*` | Sơ đồ 4.2: Đăng nhập có rate limit | Trong phạm vi |
| **FR-07** | Đăng xuất | UC07 | Không lưu MongoDB / Blacklist `blacklist:*`, Hủy `session:*` | N/A | Trong phạm vi |
| **FR-08** | Quản lý thông tin cá nhân | UC06 (Profile) | `users` | N/A | Trong phạm vi |
| **FR-09** | Quản lý chuyến đi | UC08 | `trips`, `auditLogs` | Sơ đồ 4.3: Tạo chuyến đi có audit log | Trong phạm vi |
| **FR-10** | Lập lịch trình | UC09 | `itineraryItems`, `trips` | N/A | Trong phạm vi |
| **FR-11** | Lưu yêu thích | UC10 | `favoritePlaces`, `places` | N/A | Trong phạm vi |
| **FR-12** | Xem lịch sử tìm kiếm | UC11 | `searchHistories` | N/A | Trong phạm vi |
| **FR-13a** | Nhận gợi ý địa điểm (Luật) | UC03, UC11 | `places`, `searchHistories`, `favoritePlaces` | N/A | Trong phạm vi |
| **FR-13b** | Gợi ý địa điểm bằng AI | N/A | N/A (Tích hợp LLM API ở các tuần sau) | N/A | Ngoài phạm vi Tuần 1 |
| **FR-14** | Quản lý người dùng | UC12 | `users`, `auditLogs` | N/A | Trong phạm vi |
| **FR-15** | Quản lý địa điểm | UC12 | `places`, `auditLogs` | N/A | Trong phạm vi |
| **FR-16** | Xem thống kê | UC13 | Truy vấn tổng hợp trên tất cả các collection | N/A | Trong phạm vi |
| **FR-17** | Xem audit log | UC14 | `auditLogs` | Sơ đồ 4.3: Tạo chuyến đi có audit log | Trong phạm vi |

## 1.10. Phân loại ưu tiên yêu cầu (MoSCoW)
Để đảm bảo dự án bàn giao đúng hạn và tập trung nguồn lực hiệu quả nhất cho các tính năng cốt lõi của Tuần 1, toàn bộ 18 yêu cầu chức năng (sau khi tách FR-13) được phân loại theo mô hình MoSCoW:

### 1.10.1. Must Have (Bắt buộc phải có - 8 chức năng)
Các tính năng cốt lõi, bắt buộc phải hoàn thành để hệ thống có thể chạy được luồng nghiệp vụ cơ bản nhất.
* **Mã FR:** `FR-01` (Xem bản đồ), `FR-02` (Tìm địa danh), `FR-03` (Xem POI xung quanh), `FR-05` (Đăng ký), `FR-06` (Đăng nhập), `FR-07` (Đăng xuất), `FR-09` (Quản lý chuyến đi), `FR-10` (Lập lịch trình).
* **Lý do:** Đây là xương sống của ứng dụng. Người dùng bắt buộc phải đăng ký/đăng nhập được, tìm kiếm được địa điểm trên bản đồ và tạo lập được một chuyến đi kèm lịch trình cơ bản. Nếu thiếu bất kỳ tính năng nào trong nhóm này, dự án coi như thất bại.
* **Nỗ lực ước lượng:** Cao (~55% tổng thời gian phát triển).

### 1.10.2. Should Have (Nên có - 4 chức năng)
Các chức năng quan trọng mang lại giá trị gia tăng cực lớn cho trải nghiệm người dùng, cần được ưu tiên triển khai ngay sau khi hoàn thành nhóm Must Have.
* **Mã FR:** `FR-04` (Xem thời tiết), `FR-08` (Quản lý thông tin cá nhân), `FR-11` (Lưu yêu thích), `FR-12` (Xem lịch sử tìm kiếm).
* **Lý do:** Thời tiết và lịch sử tìm kiếm giúp tối ưu hóa kế hoạch du lịch. Tuy nhiên, nếu thiếu chúng trong phiên bản thử nghiệm cực hạn đầu tiên, người dùng vẫn có thể lên kế hoạch cho chuyến đi của họ.
* **Nỗ lực ước lượng:** Trung bình (~25% tổng thời gian phát triển).

### 1.10.3. Could Have (Có thể có - 3 chức năng)
Các tính năng hữu ích nhưng không bắt buộc, chỉ thực hiện khi còn dư dả thời gian và nguồn lực.
* **Mã FR:** `FR-13a` (Nhận gợi ý địa điểm - Luật), `FR-14` (Quản lý người dùng - Admin), `FR-15` (Quản lý địa điểm - Admin).
* **Lý do:** Thuật toán gợi ý theo quy tắc (rule-based) đơn giản giúp hệ thống thông minh hơn. Việc quản lý user/địa điểm của admin có thể thực hiện tạm thời thông qua các công cụ quản trị Database trực tiếp (như MongoDB Compass) thay vì phải code giao diện Admin hoàn chỉnh ngay ở Tuần 1.
* **Nỗ lực ước lượng:** Trung bình thấp (~15% tổng thời gian phát triển).

### 1.10.4. Won't Have (Chưa có trong Tuần 1 - 3 chức năng)
Các tính năng nâng cao, phức tạp, thống nhất sẽ dời lại để phát triển ở các giai đoạn sau của đồ án.
* **Mã FR:** `FR-13b` (Gợi ý địa điểm bằng AI), `FR-16` (Xem thống kê), `FR-17` (Xem audit log - giao diện Admin đầy đủ).
* **Lý do:** Đòi hỏi thời gian nghiên cứu tích hợp LLM/AI hoặc thiết kế biểu đồ phân tích sâu, vượt quá quỹ thời gian và yêu cầu khung kỹ thuật của Tuần 1.
* **Nỗ lực ước lượng:** Thấp (~5% thời gian ở Tuần 1 để thiết kế schema cơ sở hạ tầng lưu trữ ngầm, giao diện UI là 0%).
