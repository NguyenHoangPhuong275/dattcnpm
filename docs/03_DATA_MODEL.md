# Thiết kế dữ liệu MongoDB và Redis

Ngày cập nhật: 2026-06-09

Nguồn schema thực tế nằm ở `src/lib/mongodb.ts` và type tham chiếu nằm ở `src/database/schema.ts`. Code hiện dùng Mongoose với tên collection snake_case rõ ràng.

## Collection thật trong code

| Key trong code | Collection MongoDB | Model/Schema |
| --- | --- | --- |
| `users` | `users` | `UserSchema` |
| `trips` | `trips` | `TripSchema` |
| `places` | `places` | `PlaceSchema` |
| `itineraryItems` | `itinerary_items` | `ItineraryItemSchema` |
| `favorites` | `favorite_places` | `FavoritePlaceSchema` |
| `reviews` | `reviews` | `ReviewSchema` |
| `auditLogs` | `audit_logs` | `AuditLogSchema` |
| `searchHistories` | `search_histories` | `SearchHistorySchema` |
| `tripShares` | `trip_shares` | `TripShareSchema` |
| `notifications` | `notifications` | `NotificationSchema` |
| `tags` | `tags` | `TagSchema` |
| `userPreferences` | `user_preferences` | `UserPreferenceSchema` |
| `tripBudgets` | `trip_budgets` | `TripBudgetSchema` |
| `tripAccommodations` | `trip_accommodations` | `TripAccommodationSchema` |
| `tripChecklists` | `trip_checklists` | `TripChecklistSchema` |
| `userFollows` | `user_follows` | `UserFollowSchema` |

## Nhóm dữ liệu chính

| Nhóm | Collection | Nội dung |
| --- | --- | --- |
| User | `users` | Tài khoản, password hash, role, trạng thái khóa, email verified, profile, sở thích, 2FA flag |
| Trip | `trips` | Chuyến đi của user, destination, ngày đi, mô tả, ảnh bìa, trạng thái public |
| Place | `places` | Địa điểm từ Nominatim/Overpass hoặc địa điểm custom |
| ItineraryItem | `itinerary_items` | Lịch trình theo trip/place/day/orderIndex/note/time/cost |
| FavoritePlace | `favorite_places` | Địa điểm yêu thích của user |
| SearchHistory | `search_histories` | Lịch sử tìm kiếm của user, query, tọa độ, số kết quả |
| AuditLog | `audit_logs` | Hành động hệ thống như `LOGIN`, `REGISTER`, `CREATE_TRIP`, `UPDATE_TRIP`, `DELETE_TRIP` |

## Indexes hiện có trong schema

| Collection | Index/schema constraint hiện có |
| --- | --- |
| `users` | `email` unique |
| `tags` | `name` unique |

Các index khác vẫn là mục tiêu tối ưu, chưa được khai báo đầy đủ trong Mongoose schema hiện tại.

## Redis đang dùng

| Mục đích | Key | File |
| --- | --- | --- |
| Cache geocoding/search | `geo:search:*` | `src/app/api/places/search/route.ts` |
| Cache POI | `poi:*`, `poi:live:*` | `src/app/api/places/search/route.ts`, `src/app/api/places/poi/route.ts` |
| Cache thời tiết | `weather:*` | `src/app/api/weather/route.ts` |
| OTP đăng ký | `otp:{email}` | `src/app/api/auth/send-otp/route.ts`, `src/app/api/auth/verify-otp/route.ts` |
| Rate limit gửi OTP | `otp:limit:{email}` | `src/app/api/auth/send-otp/route.ts` |
| Rate limit login | `rl:login:{ip}:{email}` | `src/app/api/auth/login/route.ts`, `src/lib/rate-limit.ts` |
| Rate limit search | `rl:search:{userIdOrIp}` | `src/app/api/places/search/route.ts`, `src/lib/rate-limit.ts` |
| Avatar profile | `avatar:{userId}` | `src/lib/redis.ts`, `src/app/api/profile/route.ts` |

## Redis trong thiết kế nhưng chưa nối vào flow chính

| Mục đích | Trạng thái |
| --- | --- |
| Session | Có type/helper định hướng, chưa dùng trong auth chính |
| JWT blacklist | Có helper, chưa dùng trong flow logout chính |

## Ghi chú đồng bộ

Tài liệu cũ dùng tên collection camelCase như `itineraryItems`, `favoritePlaces`, `auditLogs`. Code thật dùng snake_case: `itinerary_items`, `favorite_places`, `audit_logs`, `search_histories`.
