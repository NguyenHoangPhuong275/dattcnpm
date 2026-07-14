# Lược đồ Use Case - Smart Travel Guide

Hệ thống có 5 nhóm chức năng chính (Khám phá & tìm kiếm, Tài khoản, Chuyến đi, Tương tác cộng đồng, Quản trị). 

* **User kế thừa toàn bộ use case của Guest** (Generalization).
* **Admin kế thừa toàn bộ use case của User** (Generalization).

---

## 1. Sơ đồ Use Case tổng quát (Unicode Diagram)

Sơ đồ dưới đây thể hiện sự tương tác của 4 tác nhân chính (**Guest**, **User**, **Admin**, **Scheduler**) với các nhóm tính năng tương ứng:

```text
       ┌───────────────┐
       │   GUEST (*)   │
       └───────┬───────┘
               │
               ├──────► [ Khám phá điểm đến (UC01) ]
               ├──────► [ Tìm kiếm địa danh (UC02) ]
               ├──────► [ Tìm & xem chi tiết khách sạn (UC05 & UC06) ]
               ├──────► [ Đăng ký tài khoản mới & xác thực OTP (UC07) ]
               ├──────► [ Đăng nhập / Đặt lại mật khẩu (UC08 & UC10) ]
               │
               ▼ (Kế thừa quyền của Guest)
       ┌───────────────┐
       │     USER      │
       └───────┬───────┘
               │
               ├──────► [ Quản lý hồ sơ cá nhân & travel styles (UC11) ]
               ├──────► [ Thao tác Chuyến đi: Tạo / Sửa / Xóa (UC12) ]
               ├──────► [ Lập lịch trình tham quan chi tiết theo ngày (UC13) ]
               ├──────► [ Quản lý ngân sách dự kiến và thực chi (UC14) ]
               ├──────► [ Quản lý checklist chuẩn bị hành lý (UC15) ]
               ├──────► [ Đăng ký thông tin chỗ ở & booking (UC16) ]
               ├──────► [ Thêm cộng tác viên cùng chỉnh sửa lịch trình (UC17) ]
               ├──────► [ Chia sẻ chuyến đi công khai qua mã Code (UC18) ]
               ├──────► [ Đánh giá / Phản hồi địa điểm du lịch (UC22) ]
               │
               ▼ (Kế thừa quyền của User)
       ┌───────────────┐
       │     ADMIN     │
       └───────┬───────┘
               │
               ├──────► [ Quản lý trạng thái khóa/mở tài khoản User (UC25) ]
               ├──────► [ Xem thống kê tổng lượng truy cập hệ thống (UC26) ]
               ├──────► [ Xem Audit Log hoạt động của hệ thống (UC27) ]
               └──────► [ Kiểm duyệt và xử lý báo cáo đánh giá vi phạm (UC28) ]

 ┌───────────────────────────┐
  │  SCHEDULER (Cron Server)  │ ──► [ Kích hoạt cảnh báo thời tiết tự động (UC24) ]
  └───────────────────────────┘
```
*\*Chú thích: Guest chỉ thực hiện được các chức năng đọc dữ liệu công khai và quản lý phiên đăng nhập.*

---

## 2. Danh sách các Use Case chi tiết

| Mã UC | Tên Use Case | Tác nhân chính | Mô tả ngắn gọn |
| --- | --- | --- | --- |
| **UC01** | Khám phá điểm đến | Guest | Xem danh mục các địa phương, điểm du lịch tiêu biểu |
| **UC02** | Tìm địa danh | Guest | Nhập từ khóa tìm kiếm POI (điểm quan tâm) xung quanh |
| **UC03** | Xem POI xung quanh | Guest | Xem các điểm du lịch lân cận tọa độ bản đồ |
| **UC04** | Xem thời tiết | Guest | Xem thông tin thời tiết hiện tại và dự báo 7 ngày |
| **UC05** | Tìm kiếm khách sạn | Guest | Tìm kiếm danh sách khách sạn theo địa bàn tỉnh/thành |
| **UC06** | Xem chi tiết khách sạn | Guest | Xem thông tin phòng, giá, đánh giá của một khách sạn |
| **UC07** | Đăng ký tài khoản | Guest | Đăng ký tài khoản mới qua Email và xác thực OTP |
| **UC08** | Đăng nhập | Guest | Đăng nhập hệ thống qua Email/Mật khẩu |
| **UC09** | Đăng xuất | User | Xóa phiên đăng nhập (JWT Token) |
| **UC10** | Đặt lại mật khẩu | Guest | Nhập email nhận OTP để tạo mật khẩu mới |
| **UC11** | Quản lý hồ sơ | User | Sửa thông tin cá nhân, sở thích du lịch (travel styles) |
| **UC12** | Quản lý chuyến đi | User | Tạo mới, sửa tên/ngày hoặc xóa lịch trình chuyến đi |
| **UC13** | Lập lịch trình | User | Thêm địa điểm cần đi vào từng ngày, sắp xếp thứ tự đi |
| **UC14** | Quản lý ngân sách | User | Ghi nhận các mục chi tiêu dự kiến hoặc chi thực tế |
| **UC15** | Quản lý checklist | User | Tạo danh sách đồ dùng chuẩn bị, tích chọn hoàn thành |
| **UC16** | Quản lý chỗ ở | User | Lưu thông tin lưu trú khách sạn tương ứng lịch trình |
| **UC17** | Quản lý cộng tác viên | User | Mời người dùng khác cùng xem hoặc chỉnh sửa chuyến đi |
| **UC18** | Chia sẻ công khai | User | Lấy mã chia sẻ chuyến đi dưới dạng chỉ đọc (Read-only) |
| **UC19** | Lưu địa điểm yêu thích | User | Đánh dấu yêu thích các địa điểm du lịch |
| **UC20** | Xem lịch sử tìm kiếm | User | Theo dõi danh sách các từ khóa đã tìm kiếm |
| **UC21** | Nhận gợi ý địa điểm | User | Nhận gợi ý địa điểm cá nhân hóa dựa trên sở thích |
| **UC22** | Đánh giá địa điểm | User | Đăng bình luận kèm số sao đánh giá (Rating) |
| **UC23** | Báo cáo đánh giá | User | Báo cáo các bình luận có nội dung không phù hợp |
| **UC24** | Nhận cảnh báo thời tiết | Scheduler / User | Gửi thông báo/email nếu phát hiện thời tiết xấu cho chuyến đi |
| **UC25** | Quản lý người dùng | Admin | Khóa hoặc mở khóa tài khoản người dùng vi phạm |
| **UC26** | Xem thống kê | Admin | Theo dõi biểu đồ và dữ liệu truy cập hệ thống |
| **UC27** | Xem Audit Log | Admin | Truy vết nhật ký các hành động nhạy cảm trên hệ thống |
| **UC28** | Xử lý báo cáo | Admin | Phê duyệt gỡ bỏ hoặc bác bỏ các đánh giá bị báo cáo |
