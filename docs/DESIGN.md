# Smart Travel Guide — Design System

**Dự án:** Smart Travel Guide (Web app hỗ trợ lập kế hoạch du lịch)  
**Công nghệ:** Next.js 15+ (App Router) + TypeScript + Tailwind CSS + Leaflet  
**Mục tiêu:** Xây dựng giao diện hiện đại, sạch sẽ, dễ sử dụng, đáng tin cậy và truyền cảm hứng du lịch.

---

### 1. Project Context & Target Audience

- **Sản phẩm:** Web application giúp người dùng tìm kiếm địa điểm, xem bản đồ, quản lý chuyến đi và lập lịch trình chi tiết.
- **Đối tượng chính:** Người 20–45 tuổi, thích du lịch tự túc, cần công cụ lập kế hoạch nhanh và trực quan.
- **Tone & cảm xúc:** Hiện đại, sạch sẽ, ấm áp, đáng tin cậy, không quá "du lịch sến".
- **Thiết bị chính:** Desktop + Mobile (responsive mạnh).

---

### 2. Design Pattern (Cấu trúc trang)

**Pattern chính:** **Hero-Centric + Map-First + Progressive Disclosure**

- Trang chủ / Tìm kiếm: Hero mạnh + bản đồ ngay bên dưới.
- Trang chi tiết chuyến đi: Map làm trung tâm + sidebar quản lý lịch trình.
- Luồng chính: Tìm kiếm → Xem chi tiết → Thêm vào lịch trình → Xem tổng quan chuyến đi.

**Nguyên tắc:** Người dùng luôn có cảm giác "đang ở trên bản đồ" thay vì bị đẩy vào form phức tạp.

---

### 3. Recommended Style

**Style:** **Soft UI Evolution** kết hợp **Nature Distilled**

- Dùng soft shadows, rounded corners vừa phải (12–16px).
- Màu sắc tự nhiên, dịu mắt, phù hợp với chủ đề du lịch.
- Tránh cảm giác lạnh lùng (enterprise) hoặc quá trẻ trung (Gen-Z neon).

**Lý do:** Phù hợp với đối tượng 20–45 tuổi, dễ nhìn khi dùng lâu, đặc biệt khi xem bản đồ.

---

### 4. Color Palette

```css
/* Primary */
--color-primary:        #2D5A5A;   /* Teal đậm, chủ đạo */
--color-primary-light:  #4A7C7C;

/* Accent */
--color-accent:         #E07A5F;   /* Terracotta / Cam đất ấm */
--color-accent-light:   #F4A261;

/* Neutral */
--color-bg:             #F8F5F0;   /* Kem nhạt, dễ chịu */
--color-surface:        #FFFFFF;
--color-text:           #2C2C2C;
--color-text-muted:     #6B6B6B;

/* Map & Functional */
--color-map-overlay:    rgba(248, 245, 240, 0.92);
--color-success:        #4A7C59;
--color-warning:        #D97706;
--color-danger:         #B45309;
```

**Nguyên tắc sử dụng:**
- Nền chính luôn dùng `--color-bg`.
- Card và vùng nội dung dùng `--color-surface`.
- Nút chính dùng `--color-primary` hoặc `--color-accent`.
- Tránh dùng màu quá bão hòa trên bản đồ.

---

### 5. Typography

- **Heading:** `Playfair Display` (serif) hoặc `Cormorant Garamond`
  - Dùng cho tiêu đề lớn, tạo cảm giác du lịch cao cấp.
- **Body & UI:** `Inter` hoặc `Satoshi` (sans-serif)
  - Rất rõ ràng trên bản đồ và dữ liệu.

**Scale đề xuất:**
- `text-5xl` → Tiêu đề Hero
- `text-3xl` → Tiêu đề section
- `text-xl` → Card title
- `text-base` → Nội dung chính
- `text-sm` → Metadata, phụ đề

---

### 6. Spacing & Layout

- **Base unit:** 4px
- **Common spacing:** 8px, 12px, 16px, 24px, 32px, 48px
- **Container max-width:** `1280px` (desktop), `100%` (mobile)
- **Map area:** Nên chiếm ít nhất 55–60% màn hình trên desktop.

---

### 7. Component Guidelines (Tóm tắt quan trọng)

| Component       | Quy tắc chính                                      |
|-----------------|----------------------------------------------------|
| **Button**      | Primary: teal đậm, Secondary: trắng viền teal, Danger: terracotta |
| **Card**        | Soft shadow + border nhẹ, radius 12–16px           |
| **Map**         | Luôn có overlay nhẹ khi cần hiển thị thông tin     |
| **Form**        | Label trên, error rõ ràng, không dùng màu đỏ chói  |
| **Itinerary**   | Dùng drag & drop + màu accent để phân biệt ngày    |

---

### 8. Anti-Patterns (Cần tránh)

- Dùng emoji làm icon (thay bằng SVG từ Lucide / Heroicons).
- Animation quá mạnh hoặc lòe loẹt.
- Dark mode (trừ khi user yêu cầu).
- Màu tím/hồng AI gradient trên hero.
- Text quá nhỏ trên bản đồ.
- Card quá nhiều viền hoặc shadow nặng.

---

### 9. Pre-Delivery Checklist (UI/UX)

Trước khi coi một màn hình là xong, phải kiểm tra:

- [ ] Tất cả interactive elements có `cursor-pointer`
- [ ] Hover states rõ ràng và mượt (150–300ms)
- [ ] Text contrast đạt chuẩn (WCAG AA)
- [ ] Mobile responsive tốt (đặc biệt bản đồ)
- [ ] Loading & empty state đã xử lý
- [ ] Không dùng emoji làm icon
- [ ] Focus visible khi dùng bàn phím
- [ ] Không có text overflow

---

**Phiên bản:** 1.0  
**Ngày tạo:** Tháng 4/2026  
**Người chịu trách nhiệm:** Nguyễn Hoàng Phương

---

**Ghi chú:** File này nên được AI (Claude, Cursor...) đọc trước khi viết bất kỳ component UI nào.
