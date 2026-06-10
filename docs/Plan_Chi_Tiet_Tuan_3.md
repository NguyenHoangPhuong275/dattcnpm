# Plan Chi Tiết Tuần 3 - Bản đồ, địa điểm và trải nghiệm khám phá

## 1. Mục tiêu tuần

- Hoàn thiện trải nghiệm khám phá địa điểm.
- Bổ sung bản đồ trực quan.
- Hiển thị marker địa điểm.
- Hiển thị popup thông tin địa điểm.
- Hoàn thiện search + filter cơ bản.
- Tối ưu cache dữ liệu địa điểm.
- Đồng bộ với Places/POI/Weather API đã có.

## 2. Phạm vi nghiệp vụ

Người dùng tìm kiếm địa điểm, xem danh sách kết quả, xem vị trí trên bản đồ, mở popup địa điểm, xem POI xung quanh, xem thời tiết địa điểm, lưu địa điểm yêu thích và thêm địa điểm vào trip nếu đã đăng nhập.

## 3. Actor

- Guest
- User
- Admin nếu cần xem thống kê/log liên quan

## 4. Chức năng cần có

| Mã | Chức năng | Mô tả | API liên quan | UI liên quan | Trạng thái |
| -- | --------- | ----- | ------------- | ------------ | ---------- |
| W3-01 | Search địa điểm | Tìm địa danh/điểm du lịch | `GET /api/places/search` | Home search section | Đã có cơ bản |
| W3-02 | Xem bản đồ | Hiển thị kết quả trên bản đồ | Chưa có route riêng | Map section | Chưa triển khai |
| W3-03 | Marker địa điểm | Marker theo tọa độ place | `GET /api/places/search` | Map marker | Chưa triển khai |
| W3-04 | Popup địa điểm | Xem tên, địa chỉ, loại, hành động | `GET /api/places/search` | Place popup/modal | Chưa triển khai |
| W3-05 | POI xung quanh | Lấy điểm xung quanh tọa độ | `GET /api/places/poi` | POI list/card | Đã có cơ bản |
| W3-06 | Weather địa điểm | Xem thời tiết hiện tại | `GET /api/weather` | Weather panel | Đã có cơ bản |
| W3-07 | Favorite place | Lưu/xóa địa điểm yêu thích | `GET/POST /api/favorites`, `DELETE /api/favorites/[id]` | Favorite button | Đã có ở profile/API |
| W3-08 | Add to trip | Thêm địa điểm vào trip/itinerary | `POST /api/trips/[id]/itinerary` | Add to trip action | Chưa có UI từ search |
| W3-09 | Search history | Lưu/xem lịch sử tìm kiếm | `GET/POST/DELETE /api/search-history` | Search history panel | API đã có, UI chưa có |

## 5. API liên quan

- `GET /api/places/search?q=`
- `GET /api/places/poi?lat=&lng=&radius=&type=`
- `GET /api/weather?lat=&lng=`
- `GET /api/favorites`
- `POST /api/favorites`
- `DELETE /api/favorites/[id]`
- `GET /api/search-history`
- `POST /api/search-history`
- `DELETE /api/search-history`
- `DELETE /api/search-history/[id]`
- `POST /api/trips/[id]/itinerary`

## 6. UI cần hoàn thiện

- Home search section.
- Map section.
- Result list.
- Place card.
- Place popup/modal.
- Favorite button.
- Add to trip action.
- Empty/loading/error state.

## 7. Database/Redis liên quan

- `places`
- `favorite_places`
- `search_histories`
- Redis `geo:search:*`
- Redis `poi:*`, `poi:live:*`
- Redis `weather:*`
- Redis `rl:search:*`

## 8. Checklist nghiệm thu Tuần 3

- [ ] Có bản đồ hiển thị trong luồng khám phá.
- [ ] Kết quả search có marker trên bản đồ.
- [ ] Popup địa điểm hiển thị thông tin chính.
- [ ] POI và weather đồng bộ theo địa điểm đang chọn.
- [ ] Có favorite action từ UI khám phá.
- [ ] Có add-to-trip action từ UI khám phá.
- [ ] Có search history UI hoặc ghi rõ chưa triển khai.
- [ ] Empty/loading/error state rõ ràng.

## 9. Rủi ro

- API ngoài bị rate limit.
- Dữ liệu OSM thiếu hoặc không đồng nhất.
- Map UI nặng trên thiết bị yếu.
- Cache sai dữ liệu làm kết quả cũ.
- Không có GPS/location permission.

## 10. Kết quả bàn giao

- UI tìm kiếm + bản đồ.
- API search/POI/weather ổn định.
- Docs cập nhật theo code.
- Demo flow tìm kiếm địa điểm.
