# 4. SƠ ĐỒ TUẦN TỰ CÁC LUỒNG XỬ LÝ CHÍNH KÈM XỬ LÝ LỖI

## 4.1. Luồng tìm kiếm địa danh có cache (kèm xử lý lỗi & lưu lịch sử)
Sơ đồ mô tả quy trình tìm kiếm địa danh được tối ưu bằng Redis cache. Quy trình được thiết kế chống chịu lỗi khi API bên thứ ba (Nominatim, Overpass) hoặc Redis gặp sự cố, đồng thời tự động lưu trữ lịch sử nếu người dùng đã đăng nhập.

```mermaid
sequenceDiagram
    actor User as Người dùng
    participant UI as Search UI
    participant API as /api/places/search
    participant Redis as Redis Cache
    participant Nominatim as Nominatim API
    participant Overpass as Overpass API
    participant Mongo as MongoDB

    User->>UI: Nhập từ khóa địa danh
    UI->>API: GET /api/places/search?q=Da%20Lat
    
    alt Từ khóa không hợp lệ (Trống hoặc chứa ký tự đặc biệt nguy hiểm)
        API-->>UI: 400 Bad Request (Thông báo lỗi validate đầu vào)
    else Từ khóa hợp lệ
        API->>Redis: GET geo:search:da-lat
        
        alt Cache Hit (Có sẵn trong bộ nhớ đệm)
            Redis-->>API: Trả kết quả JSON đã cache
            API-->>UI: Trả JSON kết quả tìm kiếm (200 OK)
        else Cache Miss (Không có trong cache hoặc Redis ngoại tuyến)
            API->>Nominatim: Request geocoding (Lấy lat/lng từ từ khóa)
            
            alt Nominatim API Lỗi / Timeout
                Nominatim-->>API: Trả về lỗi 5xx hoặc Timeout
                API-->>UI: 502 Bad Gateway (Lỗi dịch vụ định vị địa lý bên ngoài)
            else Nominatim Thành công
                Nominatim-->>API: Trả về tọa độ lat/lng
                
                API->>Overpass: Request danh sách POI (nhà hàng, khách sạn...) quanh tọa độ
                
                alt Overpass API Lỗi / Timeout (Thành công một phần)
                    Overpass-->>API: Trả về lỗi 5xx hoặc Timeout
                    API->>Mongo: Upsert địa điểm geocoding chính vào collection 'places'
                    
                    opt Người dùng đã đăng nhập (Có JWT hợp lệ)
                        API->>Mongo: Insert thông tin tìm kiếm vào 'searchHistories'
                    end
                    
                    opt Ghi Cache Redis
                        API->>Redis: SET geo:search:da-lat (Chỉ có thông tin tọa độ)
                        Note over API,Redis: Nếu Redis lỗi -> chỉ ghi log cảnh báo hệ thống, không làm sập luồng
                    end
                    
                    API-->>UI: Trả JSON kết quả một phần (200 OK kèm warning không có POI)
                else Overpass Thành công
                    Overpass-->>API: Trả về danh sách POI xung quanh
                    API->>Mongo: Upsert địa điểm chính & danh sách POI vào collection 'places'
                    
                    opt Người dùng đã đăng nhập (Có JWT hợp lệ)
                        API->>Mongo: Insert thông tin tìm kiếm vào 'searchHistories'
                    end
                    
                    opt Ghi Cache Redis
                        API->>Redis: SET geo:search:da-lat TTL 24h
                        alt Redis SET thành công
                            Redis-->>API: OK
                        else Redis SET thất bại (Redis Down)
                            API->>API: Ghi log cảnh báo (Warning) hệ thống
                        end
                    end
                    
                    API-->>UI: Trả JSON kết quả đầy đủ (200 OK)
                end
            end
        end
    end
    UI-->>User: Hiển thị giao diện bản đồ trực quan hoặc thông báo lỗi tương ứng
```

---

## 4.2. Luồng đăng nhập có rate limit & chống tấn công dò quét
Sơ đồ mô tả quy trình đăng nhập được bảo vệ bằng cơ chế Rate Limit sử dụng Redis IP Tracking để chống lại các cuộc tấn công Brute-force mật khẩu. Luồng được thiết kế bảo mật cao để chống Timing Attack và chống dò quét tài khoản (Username Enumeration).

```mermaid
sequenceDiagram
    actor User as Người dùng
    participant UI as Login UI
    participant API as /api/auth/login
    participant Redis as Redis Cache
    participant Mongo as MongoDB

    User->>UI: Nhập email và mật khẩu
    UI->>API: POST /api/auth/login
    
    API->>Redis: GET rl:login:{ip}
    
    alt Vượt giới hạn rate limit (Count >= 5 lần thử sai)
        Redis-->>API: Trả về số lần thử >= 5
        API-->>UI: 429 Too Many Requests (Tài khoản bị tạm khóa IP, vui lòng thử lại sau 15 phút)
    else Trong giới hạn rate limit
        API->>Mongo: Tìm user theo email
        
        alt User không tồn tại
            Mongo-->>API: Trả về null
            API->>API: Thực hiện so khớp mật khẩu giả lập (Fake bcrypt compare) để chống Timing Attack
            API->>Redis: INCR rl:login:{ip} & EXPIRE 15m
            API-->>UI: 401 Unauthorized (Thông báo chung: Email hoặc mật khẩu không chính xác)
        else User tồn tại
            Mongo-->>API: Trả về tài khoản (email, passwordHash, isLocked)
            
            alt Tài khoản đang bị khóa (isLocked == true)
                API-->>UI: 403 Forbidden (Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên)
            else Tài khoản hoạt động (isLocked == false)
                API->>API: So khớp bcrypt mật khẩu nhập vào với passwordHash thực tế
                
                alt Sai mật khẩu
                    API->>Redis: INCR rl:login:{ip} & EXPIRE 15m
                    API-->>UI: 401 Unauthorized (Thông báo chung: Email hoặc mật khẩu không chính xác)
                else Đúng mật khẩu
                    API->>Redis: DEL rl:login:{ip} (Reset hoàn toàn bộ đếm rate limit của IP này)
                    Redis-->>API: OK
                    API->>API: Tạo JWT token an toàn chứa thông tin định danh & phân quyền (role)
                    API-->>UI: Thiết lập JWT vào HttpOnly cookie & Trả về thông tin user (200 OK)
                end
            end
        end
    end
    UI-->>User: Đăng nhập thành công (chuyển hướng) hoặc hiển thị thông báo lỗi bảo mật
```

---

## 4.3. Luồng tạo chuyến đi có audit log (kèm xác thực & rollback)
Sơ đồ mô tả luồng tạo chuyến đi mới của một thành viên đã đăng nhập. Việc tạo chuyến đi đòi hỏi xác thực token JWT, xác thực cấu trúc dữ liệu đầu vào bằng Zod, xử lý lỗi ghi cơ sở dữ liệu MongoDB và ghi nhận hành vi thao tác vào collection `auditLogs`.

```mermaid
sequenceDiagram
    actor User as Người dùng
    participant UI as Trip UI
    participant API as /api/trips
    participant Mongo as MongoDB

    User->>UI: Nhập thông tin chuyến đi (title, destination, startDate, endDate)
    UI->>API: POST /api/trips (Đính kèm JWT trong Cookie)
    
    API->>API: Giải mã & kiểm tra chữ ký mã hóa của Token JWT
    
    alt Token không hợp lệ hoặc hết hạn
        API-->>UI: 401 Unauthorized (Yêu cầu đăng nhập lại)
    else Token hợp lệ
        API->>API: Validate cấu trúc dữ liệu đầu vào bằng thư viện Zod
        
        alt Dữ liệu không hợp lệ (Thiếu trường hoặc ngày kết thúc trước ngày bắt đầu)
            API-->>UI: 400 Bad Request (Trả về chi tiết các trường bị lỗi validate của Zod)
        else Dữ liệu hợp lệ
            API->>Mongo: Insert document chuyến đi mới vào collection 'trips'
            
            alt MongoDB Insert thất bại (Lỗi kết nối CSDL hoặc đầy bộ nhớ)
                Mongo-->>API: Trả về Database Error
                API-->>UI: 500 Internal Server Error (Không thể hoàn tất tạo chuyến đi)
            else MongoDB Insert thành công
                Mongo-->>API: Trả về _id chuyến đi mới tạo
                
                Note over API,Mongo: Thao tác ghi Audit Log là bất đồng bộ (Fire-and-forget), lỗi ghi log không làm ảnh hưởng/rollback việc tạo chuyến đi
                API-)+Mongo: Insert document vào collection 'auditLogs' (action: CREATE_TRIP)
                Mongo-->>-API: Ghi nhận trạng thái hoàn thành log
                
                API-->>UI: Trả thông tin chuyến đi đã tạo thành công (201 Created)
                UI-->>User: Hiển thị thông báo thành công & cập nhật chuyến đi mới lên giao diện
            end
        end
    end
```
