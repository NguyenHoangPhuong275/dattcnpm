# Plan Chi Tiết Tuần 4 - Quản lý chuyến đi và lịch trình

## 1. Mục tiêu tuần

- Hoàn thiện quản lý trip.
- Hoàn thiện itinerary.
- Thêm/sửa/xóa điểm trong lịch trình.
- Hoàn thiện search history.
- Liên kết địa điểm đã tìm kiếm với trip.
- Chuẩn hóa trạng thái trip.

## 2. Phạm vi nghiệp vụ

User tạo chuyến đi, xem danh sách trip, xem chi tiết trip, thêm địa điểm vào itinerary, chỉnh sửa lịch trình, xóa trip hoặc itinerary item, xem lại lịch sử tìm kiếm và tạo trip từ địa điểm đã tìm.

## 3. Chức năng cần có

| Mã | Chức năng | Mô tả | API | UI | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| W4-01 | Trip list | Xem danh sách trip của user | `GET /api/trips` | My Trips | Đã có |
| W4-02 | Trip detail | Xem chi tiết trip | `GET /api/trips/[id]` | TripDetailModal | Đã có cơ bản |
| W4-03 | Create trip | Tạo trip mới | `POST /api/trips` | CreateTripModal | Đã có |
| W4-04 | Update trip | Sửa thông tin trip | `PATCH /api/trips/[id]` | Chưa có UI đầy đủ | API đã có |
| W4-05 | Delete trip | Xóa trip | `DELETE /api/trips/[id]` | My Trips | Đã có |
| W4-06 | Itinerary list | Xem lịch trình theo trip | `GET /api/trips/[id]/itinerary` | TripDetailModal | Đã có |
| W4-07 | Add itinerary item | Thêm điểm dừng | `POST /api/trips/[id]/itinerary` | TripDetailModal | Đã có |
| W4-08 | Update itinerary item | Sửa điểm dừng | `PATCH /api/trips/[id]/itinerary/[itemId]` | TripDetailModal | Đã có |
| W4-09 | Delete itinerary item | Xóa điểm dừng | `DELETE /api/trips/[id]/itinerary/[itemId]` | TripDetailModal | Đã có |
| W4-10 | Reorder itinerary | Đổi thứ tự điểm dừng | `PATCH /api/trips/[id]/itinerary/[itemId]` | TripDetailModal | Có bằng orderIndex, UI cơ bản |
| W4-11 | Search history list | Xem lịch sử tìm kiếm | `GET /api/search-history` | Chưa có UI riêng | API đã có |
| W4-12 | Clear search history | Xóa lịch sử | `DELETE /api/search-history` | Chưa có UI riêng | API đã có |
| W4-13 | Add place to trip | Thêm place từ search vào trip | `POST /api/trips/[id]/itinerary` | Chưa có UI từ search | Chưa hoàn thiện UI |

## 4. API liên quan

- `GET /api/trips`
- `POST /api/trips`
- `GET /api/trips/[id]`
- `PATCH /api/trips/[id]`
- `DELETE /api/trips/[id]`
- `GET /api/trips/[id]/itinerary`
- `POST /api/trips/[id]/itinerary`
- `PATCH /api/trips/[id]/itinerary/[itemId]`
- `DELETE /api/trips/[id]/itinerary/[itemId]`
- `GET /api/search-history`
- `POST /api/search-history`
- `DELETE /api/search-history`
- `DELETE /api/search-history/[id]`

## 5. Database liên quan

- `trips`
- `itinerary_items`
- `search_histories`
- `places`
- `audit_logs`

## 6. UI cần hoàn thiện

- My Trips.
- TripDetailModal.
- Itinerary editor.
- Add place to trip modal/action từ search.
- Search history panel/page.
- Empty/loading/error state.

## 7. Checklist nghiệm thu Tuần 4

- [x] Có CRUD API cho trips.
- [x] Có CRUD API cho itinerary item.
- [x] Có UI itinerary mức demo/báo cáo.
- [x] Có API search history tối thiểu.
- [ ] Có UI search history riêng.
- [ ] Có add-to-trip action trực tiếp từ search result.
- [ ] Có UI update trip đầy đủ.
- [ ] Có test integration cho trip/itinerary nếu có môi trường DB test.

## 8. Rủi ro

- Itinerary phụ thuộc placeId hợp lệ.
- UI add-to-trip từ search cần chọn trip rõ ràng.
- Search history có thể tăng nhanh nếu không giới hạn.
- Ownership check phải nhất quán giữa `x-user-id` và JWT cookie.

## 9. Kết quả bàn giao

- Trip management đủ demo.
- Itinerary editor đủ thêm/sửa/xóa.
- Search history API.
- Docs cập nhật theo route thật.
