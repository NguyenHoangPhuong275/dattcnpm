# Plan Chi Tiết Tuần 3 - Scope rút gọn: Search, POI, Weather

> [!NOTE]
> Theo yêu cầu điều chỉnh của dự án, phần bản đồ trực quan, marker, popup địa điểm trên bản đồ và plan trải nghiệm khám phá của Tuần 3 **đã được loại bỏ hoàn toàn** khỏi phạm vi. Tuần 3 chỉ ghi nhận các phần đã có: tìm kiếm địa điểm, POI, thời tiết và lịch sử tìm kiếm.

## 1. Mục tiêu tuần

- Ghi nhận luồng tìm kiếm địa điểm đã có trên trang chủ.
- Ghi nhận POI du lịch nổi bật và thời tiết theo địa điểm đã chọn.
- Ghi nhận cache dữ liệu địa điểm qua Redis và MongoDB upsert.
- Ghi nhận UI quản lý lịch sử tìm kiếm trong Profile.
- Chuyển các phần mở rộng như favorite từ search và add-to-trip từ search sang các tuần sau nếu còn thời gian.

## 2. Phạm vi nghiệp vụ

Người dùng tìm kiếm địa điểm du lịch, chọn điểm đến, xem thông tin thời tiết và các địa danh du lịch nổi bật (POI) xung quanh khu vực đó, sau đó có thể xem lại lịch sử các từ khóa đã tìm kiếm trong Profile.

## 3. Actor

- Guest
- User
- Admin nếu cần xem thống kê/log liên quan

## 4. Chức năng và trạng thái thực hiện

| Mã | Chức năng | Mô tả | API liên quan | UI liên quan | Trạng thái |
| -- | --------- | ----- | ------------- | ------------ | ---------- |
| W3-01 | Search địa điểm | Tìm địa danh/điểm du lịch với auto-suggest | `GET /api/places/search` | Home search section | Hoàn thành |
| W3-05 | POI xung quanh | Lấy danh sách địa danh du lịch nổi bật xung quanh tọa độ đã chọn | `GET /api/places/poi` | POI list/card | Hoàn thành |
| W3-06 | Weather địa điểm | Xem thời tiết hiện tại tại điểm đến đã chọn | `GET /api/weather` | Weather panel | Hoàn thành |
| W3-07 | Favorite place | Lưu/xóa địa điểm yêu thích | `GET/POST /api/favorites`, `DELETE /api/favorites/[id]` | Profile/Favorites; action từ search chưa bắt buộc | Ngoài scope Tuần 3 |
| W3-08 | Add to trip | Thêm địa điểm vào trip/itinerary | `POST /api/trips/[id]/itinerary` | Add to trip action | Ngoài scope Tuần 3 |
| W3-09 | Search history | Lưu/xem/xóa lịch sử tìm kiếm | `GET/POST/DELETE /api/search-history` | Search history panel (trong Profile) | Hoàn thành |

## 5. API liên quan

- `GET /api/places/search?q=`
- `GET /api/places/poi?lat=&lng=&radius=&type=`
- `GET /api/weather?lat=&lng=`
- `GET /api/search-history`
- `POST /api/search-history`
- `DELETE /api/search-history`
- `DELETE /api/search-history/[id]`

## 6. UI đã hoàn thiện

- Home search section (Tìm kiếm điểm đến).
- Result list & Place details (Tên địa điểm, địa chỉ).
- POI list (Danh sách địa danh du lịch nổi bật xung quanh).
- Weather panel (Thời tiết hiện tại của địa điểm).
- Search history panel (Quản lý lịch sử tìm kiếm trong profile).

## 7. Database/Redis liên quan

- `places`
- `search_histories`
- Redis `poi:*`
- Redis `weather:*`
- Redis `rl:search:*`

## 8. Checklist nghiệm thu Tuần 3 (Cập nhật - không còn bản đồ)

- [x] Tìm kiếm địa danh hoạt động chính xác với auto-suggest và chọn điểm đến.
- [x] Thông tin POI (địa danh du lịch nổi bật) và Weather được tải + hiển thị rõ ràng theo địa điểm đã chọn.
- [x] Người dùng có thể xem, tìm lại và xóa lịch sử tìm kiếm trên UI (SearchHistorySection).
- [x] Không còn yêu cầu bản đồ, marker, popup map hoặc plan trải nghiệm khám phá trong Tuần 3.

## 9. Kết quả bàn giao

- Luồng tìm kiếm địa điểm cơ bản (chọn điểm đến → xem weather + POI nổi bật xung quanh).
- UI quản lý lịch sử tìm kiếm đầy đủ (xem lại, tìm lại, xóa).
- API search/POI/weather đã ổn định + cache Redis.
- Tài liệu kế hoạch Tuần 3 được cập nhật đồng bộ: bản đồ và trải nghiệm khám phá đã loại bỏ.
