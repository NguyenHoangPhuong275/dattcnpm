# Sequence Diagram - Smart Travel Guide

Ngày cập nhật: 2026-06-09

## 1. Tìm kiếm địa danh có rate limit, cache và search history

```mermaid
sequenceDiagram
    actor User
    participant UI as Home Search UI
    participant API as /api/places/search
    participant Redis as Redis
    participant Nominatim as Nominatim
    participant Overpass as Overpass
    participant Mongo as MongoDB

    User->>UI: Nhập từ khóa
    UI->>API: GET /api/places/search?q=
    API->>API: Validate q bằng Zod
    API->>Redis: INCR rl:search:{userIdOrIp}
    alt Vượt giới hạn
        API-->>UI: 429
    else Hợp lệ
        API->>Redis: GET geo:search:{query}
        alt Cache hit
            Redis-->>API: JSON places
            API->>Mongo: Insert search_histories nếu có user
            API-->>UI: results, cached=true
        else Cache miss
            API->>Nominatim: Geocoding
            API->>Overpass: POI quanh tọa độ
            API->>Mongo: Upsert places
            API->>Redis: SET geo:search:{query}
            API->>Mongo: Insert search_histories nếu có user
            API-->>UI: results, cached=false
        end
    end
```

## 2. Đăng ký bằng OTP

```mermaid
sequenceDiagram
    actor User
    participant UI as RegisterForm
    participant SendOTP as /api/auth/send-otp
    participant VerifyOTP as /api/auth/verify-otp
    participant Redis as Redis
    participant Resend as Resend
    participant Mongo as MongoDB

    User->>UI: Nhập thông tin đăng ký
    UI->>SendOTP: POST email, fullName
    SendOTP->>Redis: INCR otp:limit:{email}
    SendOTP->>Redis: SET otp:{email}
    SendOTP->>Resend: Send email
    SendOTP-->>UI: maskedEmail
    User->>UI: Nhập OTP
    UI->>VerifyOTP: POST email, otp, fullName, password
    VerifyOTP->>Redis: GET otp:{email}
    VerifyOTP->>Mongo: Insert user
    VerifyOTP->>Mongo: Insert REGISTER audit log
    VerifyOTP->>Redis: DEL otp:{email}
    VerifyOTP-->>UI: success
```

## 3. Đăng nhập hiện tại

```mermaid
sequenceDiagram
    actor User
    participant UI as LoginForm
    participant API as /api/auth/login
    participant Redis as Redis
    participant Mongo as MongoDB
    participant Storage as localStorage

    User->>UI: Nhập email/password
    UI->>API: POST /api/auth/login
    API->>API: Validate body bằng Zod
    API->>Redis: INCR rl:login:{ip}:{email}
    alt Vượt giới hạn
        API-->>UI: 429
    else Hợp lệ
        API->>Mongo: Find user by email
        API->>API: bcrypt compare
        API->>Mongo: Insert LOGIN audit log
        API-->>UI: user JSON + HttpOnly JWT cookie
        UI->>Storage: Save user
        UI->>UI: Redirect /profile
    end
```

Ghi chú: flow này đã có JWT cookie, nhưng vẫn giữ `localStorage` để tương thích UI hiện tại. Redis session là mục tiêu thiết kế cần hoàn thiện sau.

## 4. Tạo chuyến đi

```mermaid
sequenceDiagram
    actor User
    participant UI as Profile Trips UI
    participant API as /api/trips
    participant Mongo as MongoDB

    User->>UI: Nhập title và destination
    UI->>API: POST /api/trips
    API->>API: Đọc user từ JWT cookie hoặc x-user-id
    API->>API: Validate dữ liệu cơ bản
    API->>Mongo: Insert trip
    API->>Mongo: Insert CREATE_TRIP audit log
    API-->>UI: trip data
    UI->>UI: Cập nhật danh sách trip
```

## 5. Sửa/xóa itinerary item

```mermaid
sequenceDiagram
    actor User
    participant UI as TripDetailModal
    participant API as /api/trips/[id]/itinerary/[itemId]
    participant Mongo as MongoDB

    User->>UI: Sửa hoặc xóa điểm dừng
    UI->>API: PATCH/DELETE itinerary item
    API->>API: Đọc user từ JWT cookie hoặc x-user-id
    API->>Mongo: Kiểm tra trip thuộc user
    API->>Mongo: Kiểm tra item thuộc trip
    API->>Mongo: Update/Delete item
    API->>Mongo: Insert audit log
    API-->>UI: success
    UI->>UI: Tải lại itinerary
```

## 6. Xóa favorite

```mermaid
sequenceDiagram
    actor User
    participant UI as FavoritesSection
    participant API as /api/favorites/[id]
    participant Mongo as MongoDB

    User->>UI: Chọn xóa favorite
    UI->>API: DELETE /api/favorites/[id]
    API->>API: Đọc user từ JWT cookie hoặc x-user-id
    API->>Mongo: Find favorite
    API->>API: Kiểm tra userId khớp user hiện tại
    API->>Mongo: Delete favorite
    API-->>UI: success
```
