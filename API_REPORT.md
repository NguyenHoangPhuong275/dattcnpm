# API Report - Smart Travel Guide

Ngày cập nhật: 2026-06-09

Tài liệu này phản ánh các route thật đang tồn tại trong `src/app/api`. Auth hiện set HttpOnly JWT cookie khi login, logout xóa cookie, API user hỗ trợ JWT cookie hoặc `x-user-id` để tương thích UI hiện có.

## 1. Tổng quan route hiện có

| Method | Path | Trạng thái | Ghi chú |
| --- | --- | --- | --- |
| GET | `/api/health` | Đã có | Health check |
| GET | `/api/debug/db` | Đã có | Kiểm tra MongoDB |
| GET | `/api/debug/redis` | Đã có | Kiểm tra Redis PING |
| POST | `/api/auth/login` | Đã có | Login, JWT cookie, rate limit IP + email |
| POST | `/api/auth/logout` | Đã có | Xóa cookie auth |
| POST | `/api/auth/send-otp` | Đã có | Gửi OTP qua Resend, rate limit OTP |
| POST | `/api/auth/verify-otp` | Đã có | Xác minh OTP, tạo user |
| GET | `/api/profile` | Đã có | Cần user auth |
| PATCH | `/api/profile` | Đã có | Cập nhật profile |
| POST | `/api/profile/password` | Đã có | Đổi mật khẩu |
| GET | `/api/places/search` | Đã có | Nominatim + Overpass + Redis cache + MongoDB upsert + rate limit + ghi search history nếu có user |
| GET | `/api/places/poi` | Đã có | Overpass + Redis cache |
| GET | `/api/weather` | Đã có | Open-Meteo + Redis cache |
| GET | `/api/trips` | Đã có | List trip theo user |
| POST | `/api/trips` | Đã có | Tạo trip và audit log |
| GET | `/api/trips/[id]` | Đã có | Chi tiết trip thuộc user |
| PATCH | `/api/trips/[id]` | Đã có | Cập nhật trip |
| DELETE | `/api/trips/[id]` | Đã có | Xóa trip |
| GET | `/api/trips/[id]/itinerary` | Đã có | List itinerary item |
| POST | `/api/trips/[id]/itinerary` | Đã có | Thêm itinerary item |
| PATCH | `/api/trips/[id]/itinerary/[itemId]` | Đã có | Cập nhật itinerary item |
| DELETE | `/api/trips/[id]/itinerary/[itemId]` | Đã có | Xóa itinerary item |
| GET | `/api/favorites` | Đã có | List favorite |
| POST | `/api/favorites` | Đã có | Thêm favorite |
| DELETE | `/api/favorites/[id]` | Đã có | Xóa favorite thuộc user |
| GET | `/api/search-history` | Đã có | List lịch sử tìm kiếm của user |
| POST | `/api/search-history` | Đã có | Thêm lịch sử tìm kiếm |
| DELETE | `/api/search-history` | Đã có | Xóa toàn bộ lịch sử tìm kiếm của user |
| DELETE | `/api/search-history/[id]` | Đã có | Xóa một bản ghi lịch sử thuộc user |
| GET | `/api/reviews/my` | Đã có | List review của user |
| POST | `/api/webhook` | Đã có | Admin/maintenance events |

## 2. Auth APIs

### POST `/api/auth/login`

Body:

```json
{ "email": "string", "password": "string" }
```

Route validate bằng Zod, kiểm tra bcrypt, kiểm tra user bị khóa, ghi audit log `LOGIN`, set HttpOnly JWT cookie `auth_token`. Rate limit dùng key `rl:login:{ip}:{email}`, giới hạn 8 lần trong 15 phút, có fallback bộ nhớ nếu Redis lỗi.

### POST `/api/auth/send-otp`

Body:

```json
{ "email": "string", "fullName": "string" }
```

Dùng Redis key `otp:limit:{email}` để giới hạn gửi OTP, lưu OTP tại `otp:{email}`, gửi email qua Resend.

### POST `/api/auth/verify-otp`

Body:

```json
{
  "email": "string",
  "otp": "string",
  "fullName": "string",
  "password": "string"
}
```

Hash password bằng bcrypt, tạo user trong MongoDB, ghi audit log `REGISTER`.

## 3. Places, Weather và Search History

| Method | Path | External API/Storage | Ghi chú |
| --- | --- | --- | --- |
| GET | `/api/places/search?q=` | Nominatim, Overpass, Redis, MongoDB | Có rate limit `rl:search:*`; tự ghi search history nếu có user |
| GET | `/api/places/poi?lat=&lng=&radius=&type=` | Overpass, Redis | Validate bằng Zod |
| GET | `/api/weather?lat=&lng=` | Open-Meteo, Redis | Không cần API key |
| GET | `/api/search-history` | MongoDB `search_histories` | Cần user auth |
| POST | `/api/search-history` | MongoDB `search_histories` | Giới hạn tối đa 50 bản ghi/user |
| DELETE | `/api/search-history` | MongoDB `search_histories` | Xóa toàn bộ của user |
| DELETE | `/api/search-history/[id]` | MongoDB `search_histories` | Kiểm tra ownership |

## 4. Trips và Itinerary

Các route trips/itinerary yêu cầu user auth qua JWT cookie hoặc `x-user-id`.

| Method | Path | Mục đích |
| --- | --- | --- |
| GET | `/api/trips` | Lấy danh sách trip |
| POST | `/api/trips` | Tạo trip |
| GET | `/api/trips/[id]` | Lấy chi tiết trip |
| PATCH | `/api/trips/[id]` | Cập nhật trip |
| DELETE | `/api/trips/[id]` | Xóa trip |
| GET | `/api/trips/[id]/itinerary` | Lấy itinerary |
| POST | `/api/trips/[id]/itinerary` | Thêm itinerary item |
| PATCH | `/api/trips/[id]/itinerary/[itemId]` | Cập nhật itinerary item |
| DELETE | `/api/trips/[id]/itinerary/[itemId]` | Xóa itinerary item |

`POST /api/trips` ghi audit log `CREATE_TRIP`. Trip dynamic route ghi log update/delete. Itinerary item route ghi log create/update/delete ở mức cơ bản.

## 5. Admin Webhook

`POST /api/webhook` yêu cầu `x-webhook-secret` hoặc query `secret`.

| Event | Mục đích |
| --- | --- |
| `db.reset`, `db.clear` | Drop managed collections |
| `db.dropUnknown` | Drop collection lạ |
| `db.hardReset`, `db.nuke` | Reset mạnh database |
| `db.check`, `db.consistency`, `db.inspect` | Kiểm tra consistency |
| `user.lock`, `user.unlock` | Khóa/mở user |
| `user.delete` | Xóa mềm hoặc cứng user |
| `notification.broadcast` | Gửi thông báo hệ thống |
| `system.stats` | Thống kê document |
| `system.logs` | Lấy audit log gần nhất |
| `system.users` | Lấy danh sách user |
| `locations.seed-vn` | Seed dữ liệu hành chính Việt Nam |
| `places.clear-cache` | Xóa places/cache tìm kiếm |

## 6. Route chưa có

| Path | Trạng thái |
| --- | --- |
| `/api/recommendations` | Chưa triển khai |
| `/api/routes/osrm` | Chưa triển khai |

## 7. Ghi chú triển khai

- User-facing API hiện hỗ trợ cả `x-user-id` và HttpOnly JWT cookie.
- Redis đang dùng cho cache, OTP, avatar, rate limit OTP/login/search.
- Search history API đã có, UI riêng chưa có.
- Test script đã có và có test tối thiểu, nhưng chưa có integration test với MongoDB/Redis thật.
