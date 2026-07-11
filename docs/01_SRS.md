# Đặc tả yêu cầu phần mềm (SRS) - Smart Travel Guide

Đề tài: **Smart Travel Guide - Web hướng dẫn hỗ trợ du lịch**

Ngày cập nhật: 2026-07-11 (đồng bộ với báo cáo `DATTCNPM_Smart_Travel_Guide.docx`)

## 1. Mục đích tài liệu

Tài liệu SRS mô tả phạm vi, tác nhân, yêu cầu chức năng và yêu cầu phi chức năng của hệ thống Smart Travel Guide. Tài liệu là cơ sở để thiết kế use case, thiết kế dữ liệu, xây dựng sơ đồ tuần tự và phát triển hệ thống hoàn chỉnh.

## 2. Phạm vi hệ thống

- Ứng dụng web Next.js giúp người dùng tìm kiếm địa điểm/POI, xem thời tiết, tìm và xem đánh giá khách sạn, tạo chuyến đi và lập lịch trình chi tiết.
- Quản lý toàn diện một chuyến đi: lịch trình theo ngày, ngân sách, checklist chuẩn bị, chỗ ở, cộng tác viên và chia sẻ công khai qua mã.
- Hồ sơ cá nhân với sở thích du lịch, địa điểm yêu thích, lịch sử tìm kiếm và gợi ý cá nhân hóa.
- Đánh giá địa điểm/khách sạn kèm cơ chế báo cáo và xử lý đánh giá vi phạm.
- Cảnh báo thời tiết tự động cho chuyến đi sắp diễn ra, chạy định kỳ qua cron và gửi qua thông báo trong ứng dụng lẫn email.
- Cơ sở dữ liệu chính là MongoDB (truy cập qua Mongoose, thông qua một entrypoint `getDb()` duy nhất), Redis dùng cho cache, OTP, rate limit, blacklist token và cache hồ sơ ngắn hạn.
- Trang quản trị `/admin` và webhook bảo trì dữ liệu (kiểm tra tính nhất quán, dọn dữ liệu thừa).

## 3. Ngoài phạm vi đồ án (hướng phát triển)

- Tích hợp thanh toán thật cho đặt phòng/đặt vé.
- Gợi ý bằng AI nâng cao (mô hình học máy huấn luyện riêng thay vì gợi ý theo tag/sở thích).
- Mở rộng bộ kiểm thử E2E (Playwright) bao phủ toàn bộ luồng nghiệp vụ mới (ngân sách, checklist, chia sẻ).
- Cấu hình triển khai production chính thức (CI/CD, hosting, giám sát).
- Đa ngôn ngữ giao diện (hiện tại chỉ có tiếng Việt).
- Bản đồ tương tác/marker/popup: **đã chủ động loại bỏ khỏi phạm vi, không tái giới thiệu**.

## 4. Actor của hệ thống

| Actor | Mô tả | Quyền hạn chính |
| --- | --- | --- |
| Guest | Khách chưa đăng nhập | Tìm địa danh, xem POI, thời tiết, tìm khách sạn, đăng ký, đăng nhập, quên mật khẩu |
| User | Người dùng đã đăng nhập | Toàn bộ quyền Guest; quản lý chuyến đi (lịch trình, ngân sách, checklist, chỗ ở, cộng tác viên, chia sẻ), yêu thích, đánh giá, hồ sơ cá nhân |
| Admin | Quản trị viên hệ thống | Toàn bộ quyền User; quản lý người dùng, xem thống kê, audit log, xử lý report đánh giá |
| External Service | Dịch vụ bên ngoài | Cung cấp geocoding/POI (Nominatim, Overpass), thời tiết (Open-Meteo), gửi email/OTP (Resend) |
| Scheduler (Cron) | Tác vụ định kỳ hệ thống | Gọi API cảnh báo thời tiết theo lịch, xác thực bằng `x-cron-secret` |

## 5. Yêu cầu chức năng

### 5.1. Nhóm Guest

| Mã | Tên chức năng | Mô tả |
| --- | --- | --- |
| FR-01 | Khám phá điểm đến | Trang chủ cho phép tìm kiếm điểm đến và xem địa điểm tham quan nổi bật (không dùng bản đồ tương tác) |
| FR-02 | Tìm địa danh | Tìm địa danh theo từ khóa người dùng nhập |
| FR-03 | Xem POI xung quanh | Hiển thị điểm tham quan hoặc dịch vụ gần vị trí đã chọn |
| FR-04 | Xem thời tiết | Hiển thị thông tin thời tiết tại địa điểm du lịch |
| FR-05 | Tìm kiếm khách sạn | Tìm khách sạn theo điểm đến/khu vực, dữ liệu từ OpenStreetMap |
| FR-06 | Xem chi tiết khách sạn | Xem gallery, địa chỉ, bản đồ và đánh giá thật của khách sạn |
| FR-07 | Đăng ký | Tạo tài khoản bằng họ tên, email và mật khẩu, xác thực qua OTP gửi email |
| FR-08 | Đăng nhập | Xác thực người dùng bằng email và mật khẩu |
| FR-09 | Quên / đặt lại mật khẩu | Gửi yêu cầu đặt lại mật khẩu qua email khi quên mật khẩu |

### 5.2. Nhóm User

| Mã | Tên chức năng | Mô tả |
| --- | --- | --- |
| FR-10 | Đăng xuất | Hủy phiên đăng nhập hiện tại, đưa token vào blacklist |
| FR-11 | Quản lý hồ sơ cá nhân | Xem/cập nhật thông tin, sở thích du lịch, avatar và đổi mật khẩu |
| FR-12 | Quản lý chuyến đi | Tạo, sửa, xóa chuyến đi: tiêu đề, điểm đến, ngày, mô tả, ảnh bìa, công khai |
| FR-13 | Lập lịch trình | Thêm địa điểm theo ngày, ghi chú, chi phí và sắp xếp lại thứ tự tham quan |
| FR-14 | Quản lý ngân sách chuyến đi | Ghi nhận khoản chi dự kiến/thực tế theo danh mục (di chuyển, ăn uống, chỗ ở, vé, mua sắm, khác) |
| FR-15 | Quản lý checklist chuyến đi | Thêm việc cần chuẩn bị theo mẫu hoặc tùy chỉnh, đánh dấu hoàn thành |
| FR-16 | Quản lý chỗ ở chuyến đi | Lưu thông tin nơi lưu trú: tên, địa chỉ, ngày nhận/trả phòng, chi phí |
| FR-17 | Quản lý cộng tác viên | Mời người khác cùng xem/sửa chuyến đi với quyền READ hoặc EDIT |
| FR-18 | Chia sẻ chuyến đi công khai | Bật chế độ công khai hoặc tạo mã chia sẻ để người khác xem chuyến đi |
| FR-19 | Lưu yêu thích | Lưu hoặc bỏ lưu địa điểm khỏi danh sách yêu thích |
| FR-20 | Xem lịch sử tìm kiếm | Xem lại và xóa các truy vấn địa danh đã tìm kiếm |
| FR-21 | Nhận gợi ý địa điểm | Gợi ý dựa trên sở thích, tag, lịch sử tìm kiếm hoặc địa điểm đã lưu |
| FR-22 | Đánh giá địa điểm / khách sạn | Chấm điểm 1-5 sao và viết nhận xét |
| FR-23 | Báo cáo đánh giá vi phạm | Báo cáo một đánh giá không phù hợp kèm lý do cụ thể |
| FR-24 | Nhận cảnh báo thời tiết | Nhận thông báo và email khi thời tiết vượt ngưỡng cảnh báo đã thiết lập |

### 5.3. Nhóm Admin

| Mã | Tên chức năng | Mô tả |
| --- | --- | --- |
| FR-25 | Quản lý người dùng | Xem danh sách người dùng, khóa hoặc mở khóa tài khoản |
| FR-26 | Xem thống kê | Theo dõi số lượng người dùng, chuyến đi, địa điểm, khách sạn, lượt tìm kiếm |
| FR-27 | Xem audit log | Xem nhật ký thao tác quan trọng trong hệ thống |
| FR-28 | Xử lý report đánh giá | Xem xét report đánh giá vi phạm và đánh dấu đã xử lý hoặc bỏ qua |

## 6. Yêu cầu phi chức năng

| Mã | Nhóm yêu cầu | Mô tả |
| --- | --- | --- |
| NFR-01 | Hiệu năng | API cơ bản phản hồi dưới 500ms với dữ liệu mẫu ở môi trường local/dev; danh sách có phân trang |
| NFR-02 | Cache | Redis cache kết quả tìm kiếm, POI, thời tiết, khách sạn, session, OTP và rate limit |
| NFR-03 | Bảo mật mật khẩu | Mật khẩu hash bằng bcrypt, không lưu plain text, không trả passwordHash về client |
| NFR-04 | Phân quyền | Hai vai trò hệ thống USER/ADMIN, cộng phân quyền cấp chuyến đi (chủ sở hữu, cộng tác viên READ/EDIT) |
| NFR-05 | Bảo vệ API | Mọi route theo chuẩn: xác thực JWT, rate limit cho thao tác ghi, validate bằng Zod, ẩn lỗi chi tiết ở production |
| NFR-06 | Độ tin cậy | MongoDB dùng lại kết nối qua `getDb()`; Redis lỗi không làm sập chức năng không bắt buộc (fallback in-memory) |
| NFR-07 | Khả năng bảo trì | TypeScript strict, ESLint, kiến trúc tách lib/db/validations, không import model Mongoose trực tiếp trong route |
| NFR-08 | Khả năng mở rộng | 19 collection MongoDB, có thể bổ sung tính năng mới mà không phá vỡ cấu trúc hiện tại |
| NFR-09 | Kiểm thử tự động | Bộ kiểm thử Vitest (unit + integration chạm DB thật) và cấu hình Playwright cho E2E |
| NFR-10 | Audit & truy vết | Ghi audit log cho các thao tác ghi quan trọng (tạo/sửa/xóa chuyến đi, khóa tài khoản, xử lý report...) |

## 7. Ràng buộc kỹ thuật

- Next.js (App Router, Turbopack), thư mục `src`.
- TypeScript (strict mode) là ngôn ngữ chính.
- React và Tailwind CSS dùng cho giao diện.
- MongoDB qua Mongoose là database chính, truy cập duy nhất qua `getDb()`.
- Redis qua ioredis dùng cho cache, session, OTP và rate limit.
- Xác thực bằng JWT (thư viện jose), cookie HttpOnly, hỗ trợ xoay vòng khóa ký (key rotation).
- Validate dữ liệu bằng Zod; gửi email/OTP qua Resend; hash mật khẩu bằng bcryptjs.
- Kiểm thử bằng Vitest (unit/integration) và Playwright (E2E).
- Không dùng SQLite, không dùng Prisma, không dùng bản đồ tương tác.
