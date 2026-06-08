# 4. TÀI LIỆU API BÊN NGOÀI (EXTERNAL APIS)

Tài liệu này tổng hợp chi tiết các API bên ngoài được tích hợp trong dự án Smart Travel Guide phục vụ dữ liệu bản đồ, địa danh hành chính Việt Nam, định vị, tìm kiếm địa điểm và thời tiết.

---

## 1. Dữ liệu địa danh hành chính Việt Nam (Tỉnh, Huyện, Xã)

### 1.1. Vietnam Provinces Open API
*   **Mô tả**: API cung cấp danh sách tỉnh/thành phố, quận/huyện, phường/xã của Việt Nam kèm mã GSO.
*   **Base URL**: `https://provinces.open-api.vn/api/`
*   **Phương thức**: `GET`
*   **Authentication**: Không yêu cầu
*   **Endpoints**:
    *   **Danh sách Tỉnh/Thành phố**: `/p/`
        *   URL mẫu: `https://provinces.open-api.vn/api/p/`
    *   **Danh sách Quận/Huyện**: `/d/`
        *   URL mẫu: `https://provinces.open-api.vn/api/d/`
    *   **Danh sách Phường/Xã**: `/w/`
        *   URL mẫu: `https://provinces.open-api.vn/api/w/`
    *   **Chi tiết Tỉnh kèm Quận/Huyện**: `/p/{province_code}?depth=2`
        *   URL mẫu: `https://provinces.open-api.vn/api/p/01?depth=2` (Hà Nội)
    *   **Chi tiết Quận/Huyện kèm Phường/Xã**: `/d/{district_code}?depth=2`
        *   URL mẫu: `https://provinces.open-api.vn/api/d/001?depth=2` (Ba Đình)
    *   **Lấy toàn bộ cây hành chính 3 cấp**: `/?depth=3`
        *   URL mẫu: `https://provinces.open-api.vn/api/?depth=3`

### 1.2. VNAppMob API
*   **Base URL**: `https://api.vnappmob.com/api/v2/`
*   **Phương thức**: `GET`
*   **Authentication**: Không yêu cầu
*   **Endpoints**:
    *   **Danh sách Tỉnh/Thành phố**: `/province/`
        *   URL mẫu: `https://api.vnappmob.com/api/v2/province/`
    *   **Danh sách Quận/Huyện theo Tỉnh**: `/province/district/{province_id}`
        *   URL mẫu: `https://api.vnappmob.com/api/v2/province/district/01`
    *   **Danh sách Phường/Xã theo Quận/Huyện**: `/province/ward/{district_id}`
        *   URL mẫu: `https://api.vnappmob.com/api/v2/province/ward/001`

### 1.3. Nguồn JSON hành chính tĩnh (Khuyến nghị cho Local-first)
*   **Mô tả**: File dữ liệu JSON tĩnh chứa đầy đủ cấu trúc 3 cấp của Việt Nam, lưu trữ trên GitHub giúp tối ưu hóa tốc độ tải và tránh phụ thuộc mạng.
*   **URL Raw**: `https://raw.githubusercontent.com/kenzouno1/Vietnam-Administrative-Divisions-json/master/sizes/depth3.json`

---

## 2. Dịch vụ Bản đồ và Địa lý

### 2.1. Bản đồ nền (Map Tiles)
*   **Dịch vụ**: OpenStreetMap (OSM) Tile Server
*   **URL**: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
*   **Phương thức**: `GET`
*   **Authentication**: Không yêu cầu
*   **Mục đích**: Tải các ô ảnh bản đồ (tiles) để hiển thị giao diện bản đồ trong React-Leaflet.

### 2.2. Tìm kiếm địa danh sang tọa độ (Geocoding)
*   **Dịch vụ**: Nominatim (OpenStreetMap)
*   **Base URL**: `https://nominatim.openstreetmap.org`
*   **Authentication**: Không yêu cầu (Cần đính kèm Header `User-Agent` hợp lệ để tránh bị chặn)
*   **Endpoints**:
    *   **Tìm địa danh -> Tọa độ (Forward Geocoding)**:
        *   URL: `/search?q={query}&format=json&limit=5&countrycodes=vn`
        *   URL mẫu: `https://nominatim.openstreetmap.org/search?q=Hoan+Kiem&format=json&limit=5&countrycodes=vn`
    *   **Giải ngược tọa độ -> Địa chỉ (Reverse Geocoding)**:
        *   URL: `/reverse?lat={lat}&lon={lng}&format=json`
        *   URL mẫu: `https://nominatim.openstreetmap.org/reverse?lat=21.0285&lon=105.852&format=json`

### 2.3. Tìm địa điểm dịch vụ xung quanh (POI)
*   **Dịch vụ**: Overpass API (OpenStreetMap)
*   **Base URL**: `https://overpass-api.de/api/interpreter`
*   **Phương thức**: `POST` hoặc `GET`
*   **Authentication**: Không yêu cầu
*   **Ví dụ truy vấn (Overpass QL)**:
    ```query
    [out:json][timeout:25];
    (
      node["amenity"="restaurant"](around:2000, 21.0285, 105.852);
      node["tourism"="hotel"](around:2000, 21.0285, 105.852);
      node["tourism"="attraction"](around:2000, 21.0285, 105.852);
    );
    out body;
    ```

### 2.4. Tính tuyến đường di chuyển (Routing)
*   **Dịch vụ**: Open Source Routing Machine (OSRM)
*   **URL**: `https://router.project-osrm.org/route/v1/driving/{lng1},{lat1};{lng2},{lat2}?overview=full&geometries=geojson`
*   **Phương thức**: `GET`
*   **Authentication**: Không yêu cầu
*   **Mục đích**: Trả về khoảng cách (km), thời gian di chuyển (giây) và mảng tọa độ địa lý (Geometry GeoJSON) để vẽ đường đi trên bản đồ giữa các điểm lịch trình.

---

## 3. Dự báo thời tiết

### 3.1. OpenWeatherMap
*   **Base URL**: `https://api.openweathermap.org/data/2.5/`
*   **Authentication**: Yêu cầu API Key qua query parameter `appid`
*   **Endpoints**:
    *   **Thời tiết hiện tại**:
        *   URL: `/weather?lat={lat}&lon={lng}&units=metric&appid={apiKey}`
        *   URL mẫu: `https://api.openweathermap.org/data/2.5/weather?lat=21.0285&lon=105.852&units=metric&appid=YOUR_API_KEY`
    *   **Dự báo thời tiết 5 ngày (mỗi 3 giờ)**:
        *   URL: `/forecast?lat={lat}&lon={lng}&units=metric&appid={apiKey}`
        *   URL mẫu: `https://api.openweathermap.org/data/2.5/forecast?lat=21.0285&lon=105.852&units=metric&appid=YOUR_API_KEY`
