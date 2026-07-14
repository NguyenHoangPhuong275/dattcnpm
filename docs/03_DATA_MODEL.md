# Thiết kế dữ liệu MongoDB và Redis - Smart Travel Guide

Đề tài: **Smart Travel Guide - Web hướng dẫn hỗ trợ du lịch**

Ngày cập nhật: 2026-07-14

## 1. Định hướng thiết kế dữ liệu

Hệ thống sử dụng MongoDB theo mô hình Document Store, truy cập qua Mongoose thông qua một entrypoint duy nhất `getDb()` (không import model Mongoose trực tiếp trong route). Dữ liệu có khả năng tăng nhanh hoặc mang tính quan hệ nhiều-nhiều được tách collection riêng, liên kết bằng ObjectId để tránh document `trips` quá lớn và để truy vấn linh hoạt hơn. Hệ thống hiện có **21 collection**.

## 2. Bảng tổng quát cơ sở dữ liệu

Mỗi collection tương đương một bảng dữ liệu, liên kết với nhau bằng ObjectId.

| STT | Bảng (collection) | Khóa chính | Khóa tham chiếu | Mô tả |
| --- | --- | --- | --- | --- |
| 1 | users | _id | — | Tài khoản người dùng và phân quyền |
| 2 | trips | _id | userId → users | Chuyến đi, kèm danh sách cộng tác viên |
| 3 | places | _id | — | Địa điểm / POI du lịch |
| 4 | hotels | _id | — | Khách sạn (import từ OpenStreetMap) |
| 5 | hotel_reviews | _id | hotelId → hotels; userId → users | Đánh giá khách sạn |
| 6 | itinerary_items | _id | tripId → trips; placeId → places | Mục lịch trình theo ngày |
| 7 | favorite_places | _id | userId → users; placeId → places | Địa điểm yêu thích |
| 8 | search_histories | _id | userId → users | Lịch sử tìm kiếm |
| 9 | reviews | _id | userId → users; placeId → places; parentId → reviews | Đánh giá địa điểm, hỗ trợ phản hồi |
| 10 | review_reports | _id | reviewId → reviews; reportedBy → users | Báo cáo đánh giá vi phạm |
| 11 | audit_logs | _id | userId → users | Nhật ký thao tác quan trọng |
| 12 | trip_shares | _id | tripId → trips; sharedByUserId → users | Chia sẻ chuyến đi qua mã |
| 13 | notifications | _id | userId → users | Thông báo trong ứng dụng |
| 14 | tags | _id | — | Nhãn phân loại và gợi ý |
| 15 | user_preferences | _id | userId → users; tagId → tags | Điểm ưu tiên cá nhân hóa |
| 16 | trip_budgets | _id | tripId → trips; userId → users | Khoản chi của chuyến đi |
| 17 | trip_accommodations | _id | tripId → trips; hotelId → hotels | Nơi lưu trú của chuyến đi |
| 18 | trip_checklists | _id | tripId → trips | Việc cần chuẩn bị cho chuyến đi |
| 19 | user_follows | _id | followerId, followingId → users | Quan hệ theo dõi giữa người dùng |
| 20 | hotel_bookings | _id | hotelId → hotels; userId → users | Đặt phòng khách sạn và trạng thái thanh toán nội bộ |
| 21 | flight_bookings | _id | userId → users | Đặt vé máy bay; chiều đi/chiều về được lưu dạng subdocument |

## 3. Trường dữ liệu chính của từng collection

| Collection | Trường chính | Ghi chú |
| --- | --- | --- |
| users | _id, email, passwordHash, fullName, role, isLocked, emailVerified, avatarUrl, phone, dateOfBirth, gender, travelStyles, interests, weatherAlerts, createdAt | email unique (partial, chỉ khi deletedAt=null) |
| trips | _id, userId, title, description, destination, startDate, endDate, isPublic, coverImage, collaborators[], deletedAt | Hỗ trợ cộng tác viên và xóa mềm |
| places | _id, osmId, name, type, lat, lng, address, images, tags, ratingAvg, ratingCount | Từ API ngoài hoặc nhập bởi admin |
| hotels | _id, osmId, name, province, provinceKey, district, address, lat, lng, rating, priceLevel, amenities, location(2dsphere) | Import từ OpenStreetMap Overpass |
| hotel_reviews | _id, hotelId, userId, rating, comment, deletedAt | 1 user / 1 khách sạn (partial unique) |
| itinerary_items | _id, tripId, placeId, day, orderIndex, note, startTime, endTime, cost, currency | unique {tripId, day, orderIndex} |
| favorite_places | _id, userId, placeId, createdAt | unique {userId, placeId} |
| search_histories | _id, userId, query, lat, lng, resultCount, createdAt | userId có thể null với Guest |
| reviews | _id, userId, placeId, parentId, rating, comment, images, deletedAt | Hỗ trợ phản hồi (parentId) |
| review_reports | _id, reviewId, reportedBy, reason, note, status | unique {reviewId, reportedBy} |
| audit_logs | _id, userId, action, targetType, targetId, metadata, createdAt | Nhật ký thao tác quan trọng |
| trip_shares | _id, tripId, sharedByUserId, sharedWithUserId, permission, shareCode, isActive, expiresAt | shareCode unique (partial) |
| notifications | _id, userId, title, content, type, isRead, actionUrl, createdAt | TRIP_SHARE, SYSTEM, WEATHER_ALERT, RECOMMENDATION |
| tags | _id, name, category | Nhãn cho gợi ý và phân loại |
| user_preferences | _id, userId, tagId, preferenceScore, updatedAt | Điểm ưu tiên cá nhân hóa theo tag |
| trip_budgets | _id, tripId, userId, category, amount, currency, type, date, note | Khoản chi dự kiến/thực tế |
| trip_accommodations | _id, tripId, hotelId, placeId, name, address, checkIn, checkOut, bookingRef, cost, currency | Có thể liên kết khách sạn qua hotelId |
| trip_checklists | _id, tripId, label, isDone, dueDate | unique {tripId, label} (collation vi) |
| user_follows | _id, followerId, followingId, createdAt | Dự phòng mở rộng xã hội |
| hotel_bookings | _id, hotelId, userId, roomCode, roomName, checkIn, checkOut, nights, guests, guestTitle, guestName, phone, contactEmail, note, pricePerNight, totalPrice, currency, status, paymentStatus, paidAt, confirmedAt, createdAt, updatedAt | Giá và tổng tiền được lưu tại thời điểm đặt; trạng thái booking tách khỏi trạng thái thanh toán |
| flight_bookings | _id, userId, outbound, returnFlight, passengers, passengerNames, contactName, phone, contactEmail, note, totalPrice, currency, status, paymentStatus, paidAt, confirmedAt, createdAt, updatedAt | `outbound`/`returnFlight` lưu snapshot lịch bay gồm scheduleId, số hiệu, hãng, chặng, ngày/giờ, thời lượng và giá mỗi hành khách |

## 4. Chỉ mục MongoDB

| Collection | Index | Mục đích |
| --- | --- | --- |
| users | { email: 1 } unique (partial deletedAt=null) | Đăng nhập nhanh, cho đăng ký lại sau soft-delete |
| trips | { userId: 1, updatedAt: -1 }, { isPublic: 1, updatedAt: -1 } | Lấy chuyến đi của user và danh sách trip công khai |
| places | { osmId: 1 } unique sparse | Tránh trùng địa điểm từ OSM |
| hotels | { provinceKey: 1 }, { location: 2dsphere }, { osmId: 1 } unique partial | Truy vấn theo tỉnh/tọa độ, tránh trùng khách sạn |
| hotel_reviews | { userId: 1, hotelId: 1 } unique partial | Mỗi user 1 đánh giá / khách sạn |
| itinerary_items | { tripId: 1, day: 1, orderIndex: 1 } unique | Đảm bảo thứ tự lịch trình không trùng |
| favorite_places | { userId: 1, placeId: 1 } unique | Không lưu trùng địa điểm yêu thích |
| search_histories | { userId: 1, createdAt: -1 } | Lấy lịch sử tìm kiếm mới nhất |
| reviews | { placeId: 1, deletedAt: 1 }, { userId: 1, placeId: 1 } unique partial | Truy vấn theo địa điểm, mỗi user 1 đánh giá gốc |
| review_reports | { reviewId: 1, reportedBy: 1 } unique | Không cho báo cáo trùng cùng một đánh giá |
| trip_shares | { shareCode: 1 } unique partial | Tra cứu nhanh theo mã chia sẻ |
| trip_budgets | { tripId: 1 } | Tổng hợp ngân sách theo chuyến đi |
| trip_accommodations | { tripId: 1, checkIn: 1 } | Sắp xếp chỗ ở theo thời gian nhận phòng |
| trip_checklists | { tripId: 1, label: 1 } unique, collation vi | Chống trùng nhãn khác hoa/thường hoặc NFC/NFD |
| audit_logs | { createdAt: -1 } | Xem log mới nhất |
| hotel_bookings | { userId: 1, createdAt: -1 }, { hotelId: 1, createdAt: -1 } | Lấy lịch sử đặt phòng của người dùng hoặc theo khách sạn |
| flight_bookings | { userId: 1, createdAt: -1 }, { outbound.flightDate: 1, status: 1 } | Lấy lịch sử đặt vé và lọc chuyến đi theo ngày/trạng thái |

## 5. Kiến trúc Redis

| Mục đích | Key mẫu | TTL đề xuất |
| --- | --- | --- |
| Cache Geocoding | `geo:search:{query}` | 24 giờ |
| Cache POI | `poi:{lat}:{lng}:{radius}:{type}` | 12 giờ |
| Cache thời tiết | `weather:{lat}:{lng}` | 15-30 phút |
| Cache khách sạn | `hotels:search:{params}` | 6-12 giờ |
| OTP đăng ký / đặt lại mật khẩu | `otp:{email}` | 5-10 phút |
| Rate limit đăng nhập | `rl:login:{ip}` | 5-15 phút |
| Rate limit tìm kiếm / mutation | `rl:{action}:{ip hoặc userId}` | 1-5 phút |
| Blacklist token | `blacklist:{jti}` | Bằng thời hạn JWT còn lại |
| Cache hồ sơ người dùng | `user:{userId}` | 30 giây |
| Avatar blob | `avatar:{userId}` | Không hết hạn (thay khi cập nhật) |
| Dedup cảnh báo thời tiết | `weatheralert:{tripId}:{date}` | 24 giờ |

Redis được dùng theo nguyên tắc **best-effort** trong request path: nếu Redis lỗi, các chức năng không bắt buộc (cache, rate limit) tự động chuyển sang cơ chế dự phòng in-memory thay vì làm sập request.
