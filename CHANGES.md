# Tóm tắt các thay đổi (CHANGES.md)

Tất cả các lỗi và vấn đề được chỉ ra trong file report đã được sửa chữa triệt để, không làm thay đổi luồng và layout của dự án.
Quá trình build `npx tsc --noEmit` đã thành công, không còn lỗi TypeScript.

## Cụ thể các thay đổi:

### Mức độ Ưu tiên 1 - CRITICAL
- **C1 — TripDetailModal:** Sửa lỗi parseFloat cho các trường chi phí và form nhập liệu của itinerary item; Thêm validation bằng `createItineraryItemSchema` từ thư viện Zod; Gỡ bỏ trường description không hợp lệ khi lưu.
- **C2 — RegisterForm:** Loại bỏ validation thủ công và regex rác, tích hợp Zod schema `registerSchema` cho các trường họ tên, email, và mật khẩu, đảm bảo thông báo lỗi nhất quán với backend.
- **C3 — API Favorites (/api/favorites/route.ts):** Thêm tính năng phân trang (pagination) cho lịch sử địa điểm yêu thích; Cập nhật hooks (`useFavorites.ts`), state của trang Profile và giao diện `FavoritesSection.tsx` để xử lý việc tải danh sách có phân trang và quản lý số lượng phần tử.

### Mức độ Ưu tiên 2 - MEDIUM
- **M1 — SearchHistorySection:** Thay thế phương thức `window.confirm` mặc định của trình duyệt bằng một custom Modal xác nhận giao diện Tailwind chuẩn.
- **M2 — ReviewsSection:** Định dạng trường ngày tháng `createdAt` về chuẩn `vi-VN` (dd/MM/yyyy).
- **M3 — SearchHistorySection:** Xử lý ép kiểu `Number(lat)` và `Number(lng)` trước khi gọi hàm `toFixed(2)`, bổ sung điều kiện loại bỏ `NaN` để chống crash.
- **M4 — useFavorites / FavoritesSection:** Thêm `removingIds` Set vào hook để khoá nút "Xóa" khi đang thực hiện tác vụ, chống hiện tượng spam click gửi request liên tục tới server.
- **M5 — useProfile:** Hàm `toggle2FA` nay trả về một Object kết quả (thành công hoặc lỗi) thay vì ném exception trực tiếp ra ngoài. Profile page được cập nhật để bắt lỗi này và hiển thị Toast tương ứng.
- **M6 — PasswordChangeModal:** Nâng cấp form thay đổi mật khẩu: bổ sung `label` tương ứng cho các input, xử lý hiển thị validation error trực tiếp trên modal, thêm state `saving` để khoá nút và hiển thị spinner trong khi thực hiện request.
- **M7 — SecuritySection:** Sửa lại các class không tồn tại trong thiết lập mặc định của Tailwind (`h-6.5`, `w-5.5`, `w-12`, `translate-x-5.5`) thành các class có sẵn (`h-6`, `w-11`, `h-5`, `w-5`, `translate-x-5`).

### Mức độ Ưu tiên 3 - LOW (Accessibility & Refactor)
- **L1 — TripPlannerForm:** Thêm các thẻ `aria-hidden="true"` vào các component icon trang trí, bổ sung `aria-label` cho các field tìm kiếm và chọn số người.
- **L2 — SecuritySection:** Bổ sung `aria-label` vào toggle switch bật/tắt 2FA để tương thích chuẩn A11y.
- **L3 — SearchHistorySection:** Thêm các thuộc tính `aria-haspopup="listbox"`, `aria-expanded` và `aria-label` vào nút dropdown chọn danh sách các chuyến đi.
- **L4 — useHomepageTripActions:** Đổi kiểu dữ liệu trả về của hành động `addSelectedPlaceToTrip` từ `void` sang `Promise<boolean>`, hỗ trợ xử lý luồng tạo chuyến đi ở các component sau này dễ dàng hơn.
- **L6 — Khai báo TypeScript chung:** Tạo file `src/types/common.ts` và export kiểu `RequestStatus` để tái sử dụng trên toàn bộ các hooks (thay vì khai báo inline rải rác ở từng file như trước đó).
