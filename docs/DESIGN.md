# Smart Travel Guide - Design System

Ngày cập nhật: 2026-06-09

Tài liệu này phản ánh hướng giao diện hiện tại trong `src/app/globals.css` và các component React. Khi cần quyết định UI chi tiết, ưu tiên tham khảo thêm các DESIGN.md thực tế từ getdesign.md.

## 1. Bối cảnh

Smart Travel Guide là web app du lịch, tập trung vào tìm kiếm điểm đến, thời tiết, POI, profile, trip và admin. Giao diện hiện tại dùng phong cách sạch, sáng, nhiều surface trắng, màu chủ đạo xanh lavender theo logo LOTUS TRAVEL.

## 2. Pattern chính

| Khu vực | Pattern hiện tại |
| --- | --- |
| Trang chủ | Hero ảnh du lịch, search box nổi, kết quả POI/weather bên dưới |
| Auth | Form login/register riêng và modal auth trên home |
| Profile | Sidebar menu, content panel theo tab |
| Admin | Dashboard tối, dùng webhook secret và stats/logs/actions |

## 3. Token màu đang dùng

```css
--color-primary: #acc0eb;
--color-primary-light: #cfe3f8;
--color-primary-lightest: #e9f2fb;
--color-primary-dark: #8aa3d4;
--color-primary-darker: #6b87bd;
--color-bg: #f4f7fc;
--color-surface: rgba(255, 255, 255, 0.95);
--color-text: #0f172a;
--color-text-secondary: #475569;
--color-text-muted: #64748b;
--color-accent: #7c8cf5;
--color-accent-warm: #e07a5f;
```

Palette teal/terracotta trong bản thiết kế cũ không còn là palette chính của code hiện tại.

## 4. Typography

Code hiện dùng **Be Vietnam Pro** cho toàn bộ UI. Font được khai báo bằng `next/font/google` trong `src/app/layout.tsx`, sau đó map qua CSS variables trong `src/app/globals.css`.

| Token | Mục đích |
| --- | --- |
| `--font-be-vietnam-pro` | Font source từ `next/font` |
| `--font-sans` | UI/body/form controls |
| `--font-display` | Heading/brand, cùng family để tránh lệch dấu tiếng Việt |

`html`, `body`, `button`, `input`, `textarea` và `select` đều dùng cùng font-family. Không import font trong component hoặc CSS khác.

## 5. Radius và surface

| Token | Giá trị |
| --- | --- |
| `--radius-sm` | `8px` |
| `--radius-md` | `12px` |
| `--radius-lg` | `16px` |
| `--radius-xl` | `24px` |
| `--radius-full` | `9999px` |

## 6. Hướng cập nhật UI

- Không redesign lớn khi đang đồng bộ tài liệu và API.
- Giữ style hiện tại để tránh lệch giao diện.
- Khi thêm UI mới cho itinerary, nên bám layout profile hiện có.
- Khi nâng cấp auth cho môi trường triển khai thật, không đổi trải nghiệm login/register nếu không cần.
