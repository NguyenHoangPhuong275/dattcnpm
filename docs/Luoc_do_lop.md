# Lược đồ Lớp & Cấu trúc Thực thể - Smart Travel Guide

Tài liệu này đặc tả lược đồ lớp (Class Diagram) đại diện cho các thực thể lưu trữ dữ liệu chính trong MongoDB, bao gồm thuộc tính, kiểu dữ liệu, các quan hệ liên kết và tự tham chiếu.

---

## 1. Sơ đồ lớp chi tiết (Unicode Diagram)

Sơ đồ mô tả cấu trúc của các thực thể chính trong mã nguồn của hệ thống và mối quan hệ (1-1, 1-N, tự tham chiếu):

```text
  ┌─────────────────────────────────┐
  │              User               │
  ├─────────────────────────────────┤
  │ - _id: MongoId                  │
  │ - email: string                 │
  │ - fullName: string              │
  │ - role: "USER" | "ADMIN"        │
  │ - travelStyles: string[]        │
  │ - weatherAlerts: AlertThreshold │
  └────────────────┬────────────────┘
                   │
                   │ 1
                   │
                   ▼ 0..*
  ┌─────────────────────────────────┐
  │              Trip               │◄─────────────[ TripCollaborator ]
  ├─────────────────────────────────┤            (userId, permission)
  │ - _id: MongoId                  │
  │ - userId: MongoId (Owner)       │
  │ - title: string                 │
  │ - startDate: Date               │
  │ - endDate: Date                 │
  └─┬────────────┬────────────┬───┬─┘
    │            │            │   │
    │ 1          │ 1          │ 1 │ 1
    ▼ 0..*       ▼ 0..*       ▼ 0..*  0..*
  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐
  │Itinerary │ │TripBudget│ │Trip    │ │TripShare │
  │  Item    │ │          │ │Checkl. │ │          │
  ├──────────┤ ├──────────┤ ├────────┤ ├──────────┤
  │-placeId  │ │-category │ │-label  │ │-shareCode│
  │-day: int │ │-amount   │ │-isDone │ │-isActive │
  └────┬─────┘ └──────────┘ └────────┘ └──────────┘
       │
       │ 0..*
       ▼ 1
  ┌─────────────────────────────────┐
  │             Place               │◄────────────────────────┐
  ├─────────────────────────────────┤                         │
  │ - _id: MongoId                  │                         │ 1
  │ - name: string                  │                         │
  │ - type: string                  │                         │
  │ - ratingAvg: number             │                         │
  └─────────────────────────────────┘                         │
                                                              │ 0..*
  ┌─────────────────────────────────┐                  ┌──────┴──────────────────┐
  │             Hotel               │                  │         Review          │
  ├─────────────────────────────────┤                  ├─────────────────────────┤
  │ - _id: MongoId                  │◄─────────────────┤ - userId: MongoId       │
  │ - name: string                  │ 1        0..*    │ - placeId: MongoId      │
  │ - provinceKey: string           │                  │ - parentId: MongoId (1) │
  │                                 │                  │ - rating: number        │
  └─────────────────────────────────┘                  └──────────┬──────────────┘
                                                                  │ 1
                                                                  │
                                                                  ▼ 0..*
                                                       ┌─────────────────────────┐
                                                       │      ReviewReport       │
                                                       ├─────────────────────────┤
                                                       │ - reportedBy: MongoId   │
                                                       │ - reason: string        │
                                                       │ - status: string        │
                                                       └─────────────────────────┘
```
*(1) Trường `parentId` trong thực thể `Review` tự tham chiếu đến chính lớp `Review` để tạo ra cấu trúc cây bình luận (phản hồi đánh giá địa điểm).*

---

## 2. Chi tiết các lớp và thuộc tính chính

### A. Lớp `User` (Người dùng)
Quản lý tài khoản, phân quyền và tùy chọn cài đặt của người dùng.
* `_id` (ObjectId): Khóa chính.
* `email` (string): Địa chỉ email (được lập chỉ mục duy nhất).
* `passwordHash` (string): Mật khẩu băm Bcrypt.
* `fullName` (string): Họ và tên.
* `role` (enum): Vai trò `"USER"` hoặc `"ADMIN"`.
* `isLocked` (boolean): Trạng thái khóa tài khoản.
* `travelStyles` (string[]): Danh sách phong cách du lịch ưa thích.
* `weatherAlerts` (Threshold): Ngưỡng cảnh báo thời tiết tự động.

### B. Lớp `Trip` (Chuyến đi)
Lớp trung tâm quản lý toàn bộ dữ liệu lịch trình của người dùng.
* `_id` (ObjectId): Khóa chính.
* `userId` (ObjectId): Người tạo/sở hữu chuyến đi.
* `title` (string): Tên chuyến đi.
* `destination` (string): Điểm đến chính.
* `startDate` & `endDate` (Date): Khoảng thời gian chuyến đi.
* `collaborators` (array): Danh sách người tham gia cùng xem/sửa (quyền `"READ"` hoặc `"EDIT"`).

### C. Lớp `ItineraryItem` (Mục lịch trình)
Định nghĩa chi tiết các hoạt động, điểm dừng chân của chuyến đi.
* `tripId` (ObjectId): Tham chiếu đến chuyến đi.
* `placeId` (ObjectId): Tham chiếu đến địa danh dừng chân.
* `day` (number): Ngày thứ mấy trong hành trình (bắt đầu từ 1).
* `orderIndex` (number): Thứ tự sắp xếp các điểm trong cùng 1 ngày.
* `timeSlot` (string): Thời gian dự kiến (ví dụ: "08:00", "Chiều").

### D. Lớp `TripBudget` (Ngân sách chi tiêu)
Quản lý các khoản thực chi hoặc chi phí dự kiến.
* `tripId` (ObjectId): Tham chiếu đến chuyến đi.
* `category` (enum): Danh mục chi tiêu (`"transport"`, `"food"`, `"accommodation"`, `"ticket"`, `"shopping"`, `"other"`).
* `amount` (number): Số tiền chi tiêu.
* `type` (enum): Trạng thái chi tiêu (`"planned"` - dự kiến, hoặc `"actual"` - thực tế).

### E. Lớp `Review` (Đánh giá)
Quản lý bình luận, số sao đánh giá cho địa điểm (`Place`) hoặc khách sạn (`Hotel`).
* `userId` (ObjectId): Người viết đánh giá.
* `placeId` / `hotelId` (ObjectId): Địa danh hoặc khách sạn được đánh giá.
* `parentId` (ObjectId): Tham chiếu đến đánh giá cha (nếu là phản hồi/reply).
* `rating` (number): Số sao chấm điểm (1 - 5).
* `content` (string): Nội dung bình luận.

---

## 3. Các quan hệ chính
1. **Quan hệ sở hữu (Composition - 1:N)**: `Trip` là đối tượng cha sở hữu toàn bộ các lớp phụ thuộc gồm `ItineraryItem`, `TripBudget`, `TripAccommodation`, `TripChecklist`. Khi `Trip` bị xóa, các đối tượng này cũng bị xóa theo.
2. **Quan hệ tự tham chiếu (Self-Reference)**: Lớp `Review` chứa thuộc tính `parentId` trỏ về chính lớp `Review` giúp tạo dựng luồng thảo luận/bình luận đa cấp.
3. **Quan hệ liên kết ngoài (Reference - 1:1)**: `ItineraryItem` liên kết với thực thể `Place` (lấy tên, mô tả địa danh dừng chân); `HotelBooking` liên kết với `Hotel` (để lấy thông tin khách sạn thực tế).
