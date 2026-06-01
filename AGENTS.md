<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# UI/UX PRO MAX & OPEN DESIGN STANDARDS

Tài liệu này định nghĩa các tiêu chuẩn thiết kế UI/UX cao cấp, triết lý Open Design (Local-first, Anti-AI-slop) và ma trận chỉ dẫn thiết kế getdesign.md để áp dụng trực tiếp cho dự án Smart Travel Guide. Mọi tác nhân AI khi làm việc trên kho lưu trữ này phải tuân thủ nghiêm ngặt các quy tắc dưới đây.

## 1. Triết lý Open Design & getdesign.md (Anti-AI-Slop)
* **Local-First & Clean Code:** Ưu tiên tối đa việc đóng gói ứng dụng độc lập, bảo mật khóa bí mật, sử dụng các kết nối tối ưu (Singleton).
* **Anti-AI-Slop:** Loại bỏ hoàn toàn các thiết kế "AI rác" (như phối màu ngẫu nhiên, bố cục lộn xộn, thiếu tương tác thực tế). Mọi thành phần giao diện đều phải có lý do kỹ thuật rõ ràng và tính thẩm mỹ cao.
* **Không dùng Emojis làm Icons:** Tuyệt đối không dùng emojis (🎨, 🚀, ⚙️) để thay thế icon trong UI chính. Phải sử dụng bộ icon SVG đồng nhất như **Lucide Icons** hoặc **Heroicons**.
* **Đúng logo thương hiệu:** Khi vẽ logo các bên thứ ba (Google, GitHub, Facebook, v.v.), phải truy vấn hoặc sử dụng đúng mã SVG chính thức (từ Simple Icons), không tự vẽ bừa.
* **Stable Hover & Transitions:** Tránh các hiệu ứng hover làm thay đổi kích thước hộp chứa gây dịch chuyển bố cục (layout shift). Phải sử dụng transitions mượt mà (`transition-all duration-200` hoặc từ `150ms-300ms`).

## 2. Tiêu chuẩn UI/UX Pro Max (Chi tiết kỹ thuật)

### 2.1. Tiếp cận & Khả dụng (Accessibility - CRITICAL)
* **Độ tương phản màu (Color Contrast):** Đảm bảo tỷ lệ tương phản tối thiểu là **4.5:1** đối với văn bản thông thường và **3:1** đối với văn bản lớn/icon.
* **Trạng thái Focus (Focus States):** Mọi phần tử có thể tương tác (nút, input, link) phải có vòng focus trực quan rõ ràng (`focus-visible:ring-2 focus-visible:ring-primary`) phục vụ điều hướng bàn phím.
* **Aria Labels & Alt Text:** Nút chỉ có icon bắt buộc phải có thuộc tính `aria-label`. Mọi hình ảnh phi trang trí phải có `alt` mô tả cụ thể.

### 2.2. Tương tác & Phản hồi (Touch & Interaction - CRITICAL)
* **Kích thước vùng chạm (Touch Target Size):** Mọi phần tử click được trên mobile phải đạt kích thước tối thiểu **44x44px** (hoặc `min-h-[44px] min-w-[44px]`).
* **Trạng thái tải (Loading States):** Vô hiệu hóa (disable) và hiển thị spinner/skeleton trên các nút gửi form hoặc gọi API bất đồng bộ để tránh click đúp hoặc gửi trùng lặp dữ liệu.
* **Con trỏ chuột (Cursor Pointer):** Phải thêm lớp `cursor-pointer` vào toàn bộ phần tử có thể tương tác được (bao gồm cả các thẻ Hover Cards, Tabs, Buttons).

### 2.3. Bố cục & Responsive (Layout & Responsive - HIGH)
* **Kích thước chữ dễ đọc:** Cỡ chữ body text trên mobile tối thiểu là **16px** (hoặc `text-base`) để tránh trình duyệt iOS tự động zoom khi focus vào input.
* **Tránh cuộn ngang (No Horizontal Scroll):** Đảm bảo bố cục không bị vỡ hoặc sinh ra thanh cuộn ngang ở các kích thước màn hình phổ biến: 375px (Mobile), 768px (Tablet), 1024px (Laptop), 1440px+ (Desktop).
* **Quản lý z-index khoa học:** Định nghĩa thang đo z-index tường minh:
  * `z-10` (Phần tử nổi nhẹ)
  * `z-20` (Dropdowns, Tooltips)
  * `z-30` (Navbar cố định)
  * `z-50` (Modals, Popups hệ thống)

### 2.4. Phối màu Light/Dark Mode chuyên nghiệp (MEDIUM)
* **Text Contrast ở Light Mode:** Dùng màu tối hẳn như `#0F172A` (slate-900) hoặc `#1E293B` (slate-800) cho chữ chính. Tuyệt đối không dùng màu xám quá nhạt cho chữ phụ (phải tối thiểu slate-600 `#475569`).
* **Glassmorphism an toàn:** Ở Light Mode, các thẻ kính trong suốt (Glass cards) phải tăng độ mờ đục lên tối thiểu `bg-white/80` kèm `backdrop-blur-md` và viền rõ ràng `border-gray-200/50`. Không dùng `bg-white/10` của Dark Mode vì sẽ làm chữ bị chìm, không thể đọc được.
* **Borders rõ ràng:** Viền phân cách ở chế độ sáng phải dùng `border-gray-200` hoặc `border-slate-200`, chế độ tối dùng `border-white/10` hoặc `border-slate-800`.

### 2.5. Spacing & Navbar thông minh
* **Floating Navbar:** Khuyến khích sử dụng Floating Navbar hiện đại dạng kính mờ (`fixed top-4 left-4 right-4 rounded-full border bg-background/80 backdrop-blur-md z-30`) thay vì navbar dính sát cạnh `top-0 left-0 right-0` truyền thống.
* **Navbar Padding:** Khi dùng thanh điều hướng cố định (fixed navbar), phần nội dung chính của trang (Main Content) phải có khoảng đệm phía trên tương ứng (ví dụ: `pt-24` hoặc `pt-28`) để tránh nội dung bị Navbar che khuất.

---

## 3. Checklist trước khi bàn giao mã nguồn UI
Trước khi hoàn tất bất kỳ tác vụ frontend nào, tác nhân AI phải tự động đối chiếu và tích vào checklist sau:

### 3.1. Thẩm mỹ & Đồ họa
- [ ] Không có biểu tượng emoji nào được sử dụng làm icon giao diện (100% dùng SVG/Lucide).
- [ ] Hover states mượt mà, thời gian chuyển đổi 150-300ms, không gây nhảy giật layout (no layout shift).
- [ ] Logo thương hiệu của bên thứ ba chính xác 100% theo Simple Icons.
- [ ] Đã sử dụng bảng màu HSL/Tailwind đồng nhất thay vì mã màu ad-hoc tự chế.

### 3.2. Khả năng tương tác & Responsive
- [ ] Tất cả các phần tử click được đều có thuộc tính `cursor-pointer`.
- [ ] Các nút gửi dữ liệu (Submit) có đầy đủ trạng thái Loading (Spinner + Disabled) khi đang xử lý bất đồng bộ.
- [ ] Không phát sinh lỗi cuộn ngang ở bất kỳ độ phân giải nào từ 375px đến 1920px.
- [ ] Khoảng cách an toàn (Padding/Margin) từ nội dung đến viền thiết bị tối thiểu là `px-4` trên Mobile.

### 3.3. Chất lượng Light & Dark Mode
- [ ] Đã kiểm tra trực quan giao diện trên cả hai chế độ sáng và tối.
- [ ] Độ tương phản văn bản trong Light Mode đạt chuẩn tối thiểu 4.5:1 (Không dùng chữ xám nhạt trên nền trắng).
- [ ] Các thành phần Glassmorphism hiển thị đẹp mắt, rõ chữ trên cả nền sáng và nền tối.
