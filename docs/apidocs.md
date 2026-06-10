# Tài liệu API bên ngoài

Ngày cập nhật: 2026-06-09

Tài liệu này chỉ ghi các API bên ngoài đang được code sử dụng hoặc được giữ làm nguồn tham khảo.

## API đang dùng trong code

| Dịch vụ | Mục đích | File sử dụng |
| --- | --- | --- |
| Nominatim | Tìm địa danh, geocoding | `src/app/api/places/search/route.ts` |
| Overpass API | Tìm POI du lịch, địa điểm xung quanh | `src/app/api/places/search/route.ts`, `src/app/api/places/poi/route.ts` |
| Open-Meteo | Lấy thời tiết hiện tại theo tọa độ | `src/app/api/weather/route.ts` |
| Vietnam Administrative Divisions JSON | Seed dữ liệu hành chính Việt Nam qua webhook | `src/app/api/webhook/route.ts` |
| Resend | Gửi email OTP | `src/lib/resend.ts`, `src/app/api/auth/send-otp/route.ts` |

## Nominatim

Base URL:

```text
https://nominatim.openstreetmap.org/search
```

Route nội bộ:

```text
GET /api/places/search?q=<query>
```

Query chính:

| Tham số | Giá trị |
| --- | --- |
| `q` | Từ khóa địa danh |
| `format` | `json` |
| `limit` | `10` |
| `countrycodes` | `vn` |
| `addressdetails` | `1` |
| `accept-language` | `vi` |

Ghi chú: request có header `User-Agent`.

## Overpass API

Base URL:

```text
https://overpass-api.de/api/interpreter
```

Route nội bộ:

```text
GET /api/places/search?q=<query>
GET /api/places/poi?lat=<lat>&lng=<lng>&radius=<radius>&type=<type>
```

Code đang dùng Overpass QL để lấy `tourism`, `historic`, `place_of_worship` và nhóm food khi `type=food`.

## Open-Meteo

Base URL:

```text
https://api.open-meteo.com/v1/forecast
```

Route nội bộ:

```text
GET /api/weather?lat=<lat>&lng=<lng>
```

Query thật:

| Tham số | Giá trị |
| --- | --- |
| `latitude` | Vĩ độ |
| `longitude` | Kinh độ |
| `current_weather` | `true` |

Open-Meteo hiện không cần API key.

## Vietnam Administrative Divisions JSON

URL:

```text
https://raw.githubusercontent.com/kenzouno1/Vietnam-Administrative-Divisions-json/master/sizes/depth3.json
```

Route nội bộ gọi nguồn này:

```text
POST /api/webhook
event: locations.seed-vn
```

## Resend

Resend dùng để gửi OTP đăng ký qua email.

Biến môi trường:

```text
API_KEY_RESEND
```

File liên quan:

```text
src/lib/resend.ts
src/app/api/auth/send-otp/route.ts
```

## API được giữ làm tham khảo nhưng chưa dùng trực tiếp

| Dịch vụ | Trạng thái |
| --- | --- |
| OSRM | Có trong kế hoạch định tuyến, chưa có route nội bộ |
| VNAppMob | Không dùng trong code hiện tại |
| provinces.open-api.vn | Không dùng trực tiếp trong code hiện tại |
