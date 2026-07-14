# Ghi chú refactor — 2026-07-14

## 1. Mục tiêu

Đợt refactor tập trung giảm kích thước component, gom kiểu dữ liệu và hành vi lặp lại, tạo ranh giới module rõ hơn và giữ ổn định các hợp đồng nghiệp vụ đang dùng. Không đổi URL công khai, cơ chế xác thực, quyền truy cập hoặc cách server tính giá booking. Ngoại lệ có chủ đích là tách thanh toán vé máy bay khỏi bước xác nhận của quản trị viên để thống nhất với điều kiện cấp mã check-in.

## 2. Thay đổi cấu trúc

### Tìm kiếm và đặt vé máy bay

- `src/lib/flight-search.ts` chứa kiểu dữ liệu và logic thuần cho tiêu chí tìm kiếm, kiểm tra ngày/chặng, sắp xếp lịch bay, nhãn ngày, trạng thái chọn chuyến và URL chuyển sang bước đặt vé.
- `src/components/flights/FlightSearchForm.tsx` chịu trách nhiệm nhập tiêu chí và xác thực phía giao diện.
- `src/components/flights/FlightSearchResults.tsx` hiển thị, chọn chuyến đi/chuyến về và điều hướng tới booking.
- `src/components/flights/AirlineDirectory.tsx` tách danh mục hãng khỏi page chính.
- `src/app/flights/page.tsx` chỉ còn điều phối tiêu chí tìm kiếm và lựa chọn chuyến bay.

### Thanh toán QR và DTO booking dùng chung

- `src/types/booking.ts` là nguồn kiểu dùng chung cho trạng thái booking, thông tin thanh toán, DTO đặt phòng và DTO đặt vé.
- `src/components/ui/QrBookingPayment.tsx` gom luồng gửi yêu cầu xác nhận, chống gửi lặp khi request đang chạy, hiển thị QR, thông tin chuyển khoản, trạng thái thành công và lỗi.
- `src/components/hotels/BookingPayment.tsx` và `src/components/flights/FlightBookingPayment.tsx` giữ vai trò adapter theo domain, nên public props và endpoint của các màn hình hiện có không đổi.
- `PAYMENT_MODE` tách QR nội bộ dùng cho quá trình phát triển khỏi VietQR cấu hình thật; production mặc định dùng chế độ `live` và không tạo QR khi thiếu thông tin ngân hàng.
- `src/lib/check-in.ts` và `src/components/profile/BookingCheckInCard.tsx` gom điều kiện cấp mã check-in. Mã và QR chỉ được đưa vào giao diện chi tiết hồ sơ khi booking đồng thời đã thanh toán và được xác nhận.

### Chi tiết chuyến đi

- `src/components/profile/TripDetailModal.tsx` tiếp tục giữ state và điều phối request.
- `src/components/profile/trip-detail/types.ts` và `helpers.ts` chứa hợp đồng dữ liệu, khởi tạo draft, phân quyền hiển thị, gom lịch trình theo ngày và xác định mốc khách sạn.
- Các phần giao diện được tách thành `TripDetailHeader.tsx`, `TripOverviewSection.tsx`, `ItinerarySection.tsx`, `ItineraryEditor.tsx`, `ItineraryList.tsx` và `TripPrivateSections.tsx`.

### Tìm kiếm địa điểm

- `src/app/api/places/search/route.ts` giảm từ 688 xuống 278 dòng và chỉ giữ orchestration, gọi dịch vụ ngoài, cache, persistence và search history.
- `src/lib/place-search/query.ts` chứa chuẩn hóa truy vấn, locality ưu tiên, fallback nội bộ, cache key và phân loại cache hợp lệ/rỗng/hỏng.
- `src/lib/place-search/transformers.ts` chứa ánh xạ Nominatim/Overpass, lọc POI, khử trùng lặp, xác định tâm tìm kiếm, xếp hạng và tạo response payload.
- `src/lib/place-search/types.ts` gom hợp đồng dữ liệu giữa route và hai source adapter.

### Primitive dùng cho API handler

- `src/lib/api-handler.ts` cung cấp `requireAuthUser`, `parseJsonBody`, `resolveObjectIdParam` và `enforceRateLimit`.
- Các primitive chuẩn hóa bốn bước lặp lại: xác thực user, đọc JSON có fallback, kiểm tra ObjectId từ async route params và chuyển kết quả rate limit thành `AppError`.
- Việc áp dụng hiện giới hạn ở các route booking khách sạn/vé máy bay; response envelope, error code và URL route không thay đổi.

### Tương thích ảnh đại diện

- `src/lib/avatar.ts` thống nhất cách trả ảnh đại diện cho các API hồ sơ.
- Ảnh lưu trực tiếp tiếp tục được trả nguyên vẹn; marker avatar Redis từ dữ liệu cũ vẫn được phân giải và trả về `null` an toàn khi cache không khả dụng.

### Vệ sinh code và ảnh

- Source TypeScript/TSX không còn comment diễn giải; tên module, type và hàm thể hiện trực tiếp trách nhiệm.
- Các thẻ ảnh thô trong booking, ảnh khách sạn và ảnh điểm đến được chuyển sang `next/image`; nguồn ảnh ngoài dùng `unoptimized` để giữ nguyên fallback và không phụ thuộc image optimizer.
- Các literal tiếng Việt trong module tìm kiếm địa điểm được kiểm tra và lưu dưới UTF-8 chuẩn.

## 3. Bất biến được giữ

- JWT vẫn nằm trong HttpOnly cookie; route nghiệp vụ vẫn xác thực user ở server.
- Quyền OWNER, EDIT và READ của chi tiết chuyến đi không thay đổi; API vẫn là biên bảo mật cuối cùng.
- URL và HTTP method của các endpoint hiện có không đổi.
- Giá phòng, số đêm, giá chuyến bay và tổng tiền vẫn được tính hoặc kiểm tra lại ở server; client không quyết định giá.
- Chỉ chủ booking được ghi nhận thanh toán; yêu cầu thanh toán lặp bị từ chối và không ghi nhận lần hai.
- Thanh toán đặt phòng và vé máy bay chỉ cập nhật trạng thái thanh toán; quyền xác nhận booking vẫn thuộc luồng quản trị.
- Mã action của audit log và cấu trúc response API được giữ nguyên.
- Thứ tự nguồn tìm kiếm địa điểm vẫn là curated → locality ưu tiên → cache hợp lệ → Nominatim → Overpass → fallback nội bộ; persistence, cache và search history vẫn chạy theo thứ tự cũ.
- Font toàn hệ thống vẫn là Be Vietnam Pro với tập ký tự tiếng Việt; text hiển thị tiếp tục dùng tiếng Việt UTF-8.

## 4. Cách kiểm chứng

Chạy từ thư mục gốc dự án:

```bash
npm run typecheck
npm run lint
npm test -- tests/lib/flight-search.test.ts tests/lib/api-handler.test.ts tests/lib/flight-bookings.test.ts
npm test -- tests/lib/place-search/query.test.ts tests/lib/place-search/transformers.test.ts
npm test -- tests/components/BookingPayment.test.tsx tests/components/TripDetailModal.permissions.test.tsx
npm test -- tests/integration/hotel-bookings.integration.test.ts tests/integration/flight-bookings.integration.test.ts
git diff --check
```

Kiểm tra thủ công các luồng có tương tác:

1. Tìm chuyến một chiều và khứ hồi tại `/flights`, chọn đủ chặng rồi mở `/flights/booking`.
2. Mở trang chi tiết từng hãng từ danh mục hãng nội địa.
3. Tạo booking khách sạn/vé máy bay, mở danh sách booking trong hồ sơ và xác nhận thanh toán một lần.
4. Mở chi tiết chuyến đi bằng quyền OWNER, EDIT và READ; kiểm tra chỉnh sửa, sắp xếp lịch trình và phần dữ liệu riêng tư.
5. Kiểm tra text tiếng Việt và font trên desktop/mobile, đặc biệt ở form, modal, bảng admin và trạng thái thanh toán.

## 5. Trạng thái kiểm chứng và giới hạn baseline

Quality gate cuối ngày 2026-07-14:

- `npm run typecheck`: đạt, không có lỗi TypeScript.
- `npm run lint`: đạt, không có lỗi hoặc cảnh báo ESLint.
- `npm run build`: đạt với Next.js 16.2.6; compile, TypeScript, page data và 133 static page đều hoàn tất.
- Nhóm `tests/api`, `tests/app`, `tests/components`, `tests/hooks`, `tests/lib`: 58 file, 278/278 test đạt.
- Nhóm `tests/integration`: 28 file, 160/160 test đạt với MongoDB/Redis của môi trường test.
- Tổng cộng: 86 file, 438/438 test đạt khi chạy theo hai nhóm tuần tự.
- Kiểm tra trình duyệt `/flights` ở desktop và mobile xác nhận tìm một chiều, khứ hồi, đổi chặng, validation, URL booking và trang hãng hoạt động; không có page error hoặc tràn ngang, `body` và form control cùng dùng Be Vietnam Pro.

Lần chạy full suite baseline bằng một lệnh `npm test -- --reporter=dot` từng vượt quá 363 giây và bị dừng trước khi Vitest trả tổng kết. Vì Vitest được cấu hình chạy tuần tự và integration dùng MongoDB/Redis thật, lần kiểm chứng cuối được tách thành hai nhóm ở trên để giữ đầy đủ phạm vi 86 file và có kết quả hoàn tất cho từng nhóm.

Playwright E2E suite đầy đủ chưa được chạy; kiểm tra trình duyệt trong đợt này là smoke test tập trung vào luồng vé máy bay đã refactor.

## 6. Chuẩn hóa nội dung giao diện production

Nội dung hiển thị được rà soát lại theo giọng điệu ngắn gọn, trung tính và nhất quán bằng tiếng Việt:

- Xóa các CTA không có luồng xử lý thật như đăng nhập Google, liên kết số điện thoại, quên mật khẩu dạng thông báo tạm, liên kết `#` và nút cập nhật sở thích trỏ tới tab không tồn tại.
- Loại bỏ nội dung mang dấu vết môi trường phát triển như “đồ án”, “dữ liệu mẫu”, “máy chủ”, tên collection, mã action, ObjectId và các thông báo trộn Anh–Việt.
- Admin chỉ hiển thị nhãn nghiệp vụ đã ánh xạ; bỏ trạng thái hardcode, mô tả lặp, ID kỹ thuật và các khối giới thiệu không hỗ trợ thao tác.
- Xóa dữ liệu trình bày tự sinh không có nguồn thật gồm rating địa điểm, rating hãng bay, giờ mở cửa, khoảng cách, trạng thái mở cửa, email và hotline giả.
- `src/lib/place-labels.ts` chuẩn hóa taxonomy địa điểm sang tiếng Việt và dùng nhãn an toàn cho giá trị nguồn ngoài chưa nhận diện.
- Cộng tác viên được hiển thị bằng tên và email thay vì một phần ObjectId; `userId` vẫn được giữ nguyên trong hợp đồng mutation.
- Copy đặt phòng, vé máy bay và thanh toán phản ánh đúng trạng thái nghiệp vụ; dùng “yêu cầu đặt vé” thay cho khẳng định giữ chỗ, không còn gọi màn hình chi tiết là hóa đơn hoặc khẳng định thuế, phí khi dữ liệu không chứng minh được.
- Màn hình thanh toán không hiển thị mã đặt chỗ. Mã và QR check-in chỉ xuất hiện trong chi tiết hồ sơ sau khi thanh toán và xác nhận đều hoàn tất.
- Luồng thanh toán không dùng số tài khoản mặc định giả. Ngoài production, chế độ QR nội bộ cho phép chạy trọn luồng mà không cần tài khoản ngân hàng; production mặc định dùng `live`, yêu cầu đủ `PAYMENT_BANK_CODE`, `PAYMENT_ACCOUNT_NO` và `PAYMENT_ACCOUNT_NAME`, nếu thiếu thì giao diện báo thanh toán trực tuyến chưa khả dụng.
- Nội dung giao diện không hiển thị thuật ngữ môi trường như “demo”, “local” hoặc mô tả kỹ thuật; cơ chế QR nội bộ chỉ được thể hiện trong cấu hình và tài liệu.
- Footer và email giao dịch dùng copyright production; attribution OpenStreetMap và Open-Meteo vẫn được giữ bằng liên kết nguồn chính thức.
- Be Vietnam Pro tiếp tục là font duy nhất cho nội dung và tiêu đề; toàn bộ source, test và tài liệu liên quan đều giải mã hợp lệ bằng UTF-8 nghiêm ngặt.

Các URL, endpoint, HTTP method, event nội bộ, DOM `id`, quyền truy cập và phép tính booking không thay đổi. Ngoại lệ có chủ đích chỉ là ẩn CTA chưa hoạt động và không hiển thị dữ liệu giả.

Quality gate sau khi chuẩn hóa nội dung:

- `npm run typecheck`: đạt.
- `npm run lint`: đạt, không có lỗi hoặc cảnh báo.
- `npm run build`: đạt; Next.js tạo đủ 133 trang tĩnh.
- Nhóm `tests/api`, `tests/app`, `tests/components`, `tests/hooks`, `tests/lib`: 58 file, 278/278 test đạt.
- Nhóm `tests/integration`: 28 file, 160/160 test đạt với MongoDB/Redis của môi trường test.
- `git diff --check`: đạt; kiểm tra UTF-8 nghiêm ngặt trên `src`, `tests` và `docs` không phát hiện file lỗi mã hóa.

## 7. Khôi phục QR thanh toán và mã check-in

- Trang thanh toán khách sạn và vé máy bay chỉ hiển thị thông tin dịch vụ, số tiền và QR; mã đặt chỗ không còn xuất hiện tại bước này.
- QR nội bộ dùng cho môi trường không phải production không chứa thông tin cá nhân hoặc tài khoản ngân hàng giả. Chế độ `live` tiếp tục tạo VietQR từ cấu hình ngân hàng thật và đóng an toàn khi cấu hình chưa đầy đủ.
- Danh sách đặt chỗ trong hồ sơ không hiển thị mã. Cửa sổ chi tiết chỉ hiển thị mã và QR check-in khi `paymentStatus` là `paid`, `status` là `confirmed` và API đã cấp mã.
- Thanh toán vé máy bay không còn tự xác nhận đơn. Sau khi người dùng xác nhận thanh toán, đơn vẫn chờ quản trị viên xử lý; mã check-in chỉ được cấp sau bước xác nhận đó.
- Nội dung QR check-in chỉ gồm loại dịch vụ và mã đặt chỗ, không chứa tên, email, số điện thoại hoặc ObjectId.
- Nội dung giao diện giữ giọng điệu production, không hiển thị tên môi trường hoặc mô tả kỹ thuật. Font kế thừa Be Vietnam Pro trên nội dung, nút và trường nhập liệu.

Quality gate sau thay đổi QR và check-in:

- `npm run typecheck`: đạt.
- `npm run lint`: đạt, không có lỗi hoặc cảnh báo.
- `npm run build`: đạt; Next.js tạo đủ 133 trang tĩnh.
- Nhóm `tests/api`, `tests/app`, `tests/components`, `tests/hooks`, `tests/lib`: 61 file, 288/288 test đạt.
- Nhóm `tests/integration`: 28 file, 160/160 test đạt với MongoDB/Redis của môi trường test.
- Tổng cộng: 89 file, 448/448 test đạt.
- Playwright xác nhận Be Vietnam Pro đã tải cho nội dung và form control, không có tràn ngang, page error hoặc text môi trường trên các trang smoke test.
- Kiểm tra UTF-8 nghiêm ngặt trên `src`, `tests`, `docs` và `git diff --check`: đạt.

## 8. Sửa lỗi theo bất biến nghiệp vụ và kiểm chứng hồi quy

Đợt rà soát ngày 2026-07-14 tập trung vào lỗi có thể làm sai trạng thái, rò rỉ dữ liệu hoặc khiến giao diện treo mà không thay đổi hợp đồng nghiệp vụ đã công bố:

- Chuyển trạng thái thanh toán, xác nhận và hủy booking dùng cập nhật có điều kiện tại cơ sở dữ liệu. Hai yêu cầu đồng thời không còn có thể cùng thành công; quản trị viên chỉ xác nhận đơn đã thanh toán và không thể hủy đơn đã thanh toán.
- Mã tham chiếu thanh toán được tách khỏi mã check-in. Email tiếp nhận hoặc hủy không chứa mã check-in; mã và QR check-in chỉ xuất hiện khi đơn vừa `paid` vừa `confirmed`.
- Ngày dạng `YYYY-MM-DD` được kiểm tra theo lịch thay vì để JavaScript tự sửa ngày không hợp lệ. Ngày nghiệp vụ dùng múi giờ Việt Nam; số đêm, ngày khởi hành, chặng khứ hồi và ngày của lịch trình không còn lệch tại ranh giới UTC.
- Trang booking chặn dữ liệu truy vấn thiếu hoặc không hợp lệ, tránh hiển thị `NaN`. Chuyến bay đã khởi hành và chặng về trước thời điểm đến của chặng đi bị từ chối ở server.
- Đổi mật khẩu xoay vòng JWT hiện tại, thu hồi phiên cũ và giữ người dùng ở phiên mới hợp lệ. Modal chuyến đi hủy yêu cầu cũ khi đổi bản ghi, tránh dữ liệu của chuyến trước ghi đè chuyến hiện tại.
- Sắp xếp lịch trình được cô lập theo từng ngày. Cập nhật cộng tác viên dùng thao tác nguyên tử; chuyến đã xóa mềm không còn xuất hiện trong danh sách hoặc trang công khai.
- Trang chia sẻ đọc trực tiếp qua service server dùng chung thay vì tự gọi HTTP về chính ứng dụng. Phân trang booking hồ sơ tải được toàn bộ dữ liệu thay vì dừng ở 20 bản ghi đầu.
- Menu mobile có quản lý focus, đóng bằng Escape hoặc click bên ngoài và không gây tràn ngang. Chặng bay được giữ nguyên khi đi từ trang hãng tới form tìm kiếm; lỗi tải chi tiết địa điểm được hiển thị bằng thông báo tiếng Việt thay vì treo im lặng.
- Thông báo API và nội dung giao diện liên quan được chuẩn hóa sang tiếng Việt production. Be Vietnam Pro tiếp tục áp dụng cho nội dung và form control; nguồn liên quan giải mã hợp lệ bằng UTF-8.

Các bất biến được giữ sau khi sửa:

- Client không quyết định giá, trạng thái xác nhận hoặc quyền truy cập; server vẫn tính và kiểm tra lại dữ liệu.
- Thanh toán của người dùng và xác nhận của quản trị viên vẫn là hai bước độc lập.
- Mã check-in chỉ được cấp sau khi hoàn thành cả hai bước, không xuất hiện trên màn hình thanh toán.
- Quyền OWNER, EDIT và READ, URL endpoint, HTTP method và cấu trúc response hiện có không bị thay đổi ngoài các payload danh sách đã được bổ sung metadata phân trang có kiểu rõ ràng.
- JWT vẫn dùng HttpOnly cookie; dữ liệu phiên không chuyển sang `localStorage`.

Quality gate cuối sau toàn bộ thay đổi:

- `npm run typecheck`: đạt, không có lỗi TypeScript.
- `npm run lint`: đạt, không có lỗi hoặc cảnh báo ESLint.
- `npm run build`: đạt với Next.js 16.2.6; compile, kiểm tra kiểu, page data và 133 static page hoàn tất.
- Unit, component và API test không tích hợp: 68 file, 320/320 test đạt.
- Integration test với MongoDB/Redis: 28 file, 175/175 test đạt.
- Tổng Vitest: 96 file, 495/495 test đạt khi chạy tuần tự theo hai nhóm.
- Playwright trên production build: 4/4 test đạt, gồm điều hướng nội dung, menu mobile và font, giữ chặng bay, cùng happy path đăng ký → OTP → đăng nhập → tạo chuyến đi → thêm điểm dừng → checklist.
- `git diff --check` và quét UTF-8/mojibake: đạt.

## 9. Khôi phục thao tác xem chi tiết điểm đến từ cẩm nang

- Nội dung chính của thẻ trong phần “Điểm đến nổi bật” mở trang `/destinations/[id]`; CTA “Lên lịch trình với điểm đến này” tiếp tục dùng nguyên URL và luồng planner trước đó.
- Trang chi tiết đọc dữ liệu curated theo slug tĩnh, không gửi slug vào API `/places/[id]`, không âm thầm tạo bản ghi MongoDB và không phụ thuộc vào Redis hoặc dịch vụ tìm kiếm.
- Slug không tồn tại đi qua `notFound()`. Ảnh tiếp tục dùng cùng component fallback, nội dung giữ Be Vietnam Pro và các biến màu thương hiệu.
- Trang hiển thị mô tả, hướng dẫn chuẩn bị, bản đồ, CTA lập lịch và các điểm đến liên quan cùng khu vực.
- Regression test xác nhận lookup hợp lệ/không hợp lệ, hai URL xem chi tiết/lập lịch độc lập, click trình duyệt thật, font và không tràn ngang ở viewport 390 px.

Quality gate cho thay đổi:

- TypeScript, ESLint và production build: đạt.
- Unit, component và API test không tích hợp: 69 file, 323/323 test đạt; nhóm test trực tiếp liên quan đạt 9/9.
- Playwright production build: 5/5 đạt.

## 10. Thiết kế lại trang chi tiết điểm đến

- Hero toàn màn hình được thay bằng bố cục editorial hai cột: nội dung và CTA ở một phía, ảnh được giới hạn trong khung riêng để không kéo thumbnail mờ trên toàn chiều rộng. Mobile tự chuyển về một cột.
- Ảnh trùng lặp trong thân bài, rating không có nguồn, tiêu đề “Đặc trưng của điểm đến”, câu dẫn liên quan và toàn bộ chip keyword đã bị loại khỏi UI.
- `keywords` vẫn được giữ trong dữ liệu và tiếp tục phục vụ search/phân loại nội bộ; không thay đổi schema hoặc logic tìm kiếm hiện tại.
- `src/lib/destination-content.ts` tạo nội dung editorial an toàn theo nhóm điểm đến đã whitelist. Nội dung mới gồm tổng quan, ba nhịp trải nghiệm, chuẩn bị trước chuyến đi và cách kết nối các điểm liên quan; không thêm giờ mở cửa, giá vé, khoảng cách hoặc dữ kiện địa phương chưa được nguồn dữ liệu xác nhận.
- CTA planner giữ nguyên ID và URL; liên kết Google Maps vẫn dùng tên cùng tỉnh/thành, mở tab mới với `noopener noreferrer`. Lookup, metadata, `notFound()`, fallback ảnh và danh sách ba điểm liên quan không thay đổi.
- Kiểm tra trực quan production ở 1440 × 1000 và 390 × 844 xác nhận Be Vietnam Pro, một ảnh chính, không tràn ngang và không còn nội dung bị yêu cầu loại bỏ.

Quality gate sau thiết kế lại:

- TypeScript, ESLint và production build: đạt.
- Unit, component và API test không tích hợp: 70 file, 325/325 test đạt.
- Playwright production build: 5/5 đạt.
- UTF-8, kiểm tra comment mới và `git diff --check`: đạt.
