Vai trò: Senior engineer làm AUDIT SÂU từng file trong repo Smart Travel Guide
(Next.js 16 App Router, TS, React 19, Mongoose, Redis, Zod, jose JWT, bcryptjs,
Resend OTP, Vitest). Nhiệm vụ: đi bộ toàn bộ cây thư mục, soi từng file theo
checklist bên dưới, tìm bug MỚI ngoài 6 bug đã ghi, rồi FIX theo kỷ luật.

Bối cảnh: docs/BUG_REPORT.md đã có BUG-01..BUG-06 (Bước 0). Đây là pass sâu hơn,
KHÔNG lặp lại bug cũ. Đánh số tiếp BUG-07, BUG-08...

PHƯƠNG PHÁP — quét theo thứ tự ưu tiên rủi ro, mỗi lượt 1 nhóm rồi báo cáo:
  1. app/api/**            (route handlers — rủi ro cao nhất)
  2. lib/**, server/**     (auth, db, rate-limit, redis, validation dùng chung)
  3. models/** (Mongoose schema + index)
  4. middleware.ts, config
  5. components/**, app/**  (client — soi nhẹ hơn, ưu tiên rò rỉ dữ liệu/logic)

Với TỪNG file, đọc hết và kiểm theo checklist (ghi rõ file:dòng cho mỗi phát hiện):
  [Validation]  Zod thiếu/lỏng: không cap độ dài chuỗi, không cap độ dài mảng,
                không chặn kiểu, dùng .any()/.passthrough() ẩu, thiếu trim/coerce.
  [AuthZ/IDOR]  Endpoint có verify JWT không? Có check quyền SỞ HỮU tài nguyên
                (userId khớp) không, hay chỉ cần đăng nhập là sửa được đồ người khác?
  [Rate limit]  Mọi endpoint mutating/đắt (login, OTP, gửi mail, search, write)
                phải có giới hạn. Liệt kê endpoint còn thiếu.
  [Mongo]       Query dựng từ input chưa lọc ($-injection), thiếu index cho truy vấn
                nóng, đụng unique index chưa xử, thiếu limit/pagination (unbounded),
                N+1, race condition khi read-modify-write không nguyên tử.
  [Redis]       Key không set TTL (rò rỉ bộ nhớ), key gom từ input không chuẩn hóa.
  [Errors]      Lộ nội bộ (stack/query) ra client, nuốt lỗi im lặng, sai HTTP status,
                promise không await / unhandled rejection.
  [Secrets]     Hardcode key/secret, log ra token/mật khẩu/PII.
  [Types]       any/as ẩn null-bug, non-null assertion (!) che lỗi thật.
  [Client]      Rò rỉ field nhạy cảm ra props/response, thiếu xử lý loading/error
                dẫn tới crash, race khi fetch.

FIX — chỉ fix bug THẬT, mức High/Med; Low ghi nhận, chỉ fix nếu sửa cực rẻ và an toàn.
  Mỗi bug: (1) viết test Vitest tái hiện lỗi → ĐỎ, (2) fix tối thiểu đúng phạm vi,
  (3) chạy test → XANH, (4) commit RIÊNG theo Conventional Commits
     vd: fix(api): cap review images length to prevent oversized payload (BUG-07)
  KHÔNG refactor lan man, KHÔNG đổi format file không liên quan, KHÔNG gộp nhiều
  bug vào 1 commit.

CẬP NHẬT docs/BUG_REPORT.md: thêm mục cho từng bug mới (ID, severity, file:dòng,
nguyên nhân gốc, cách fix, commit, file test). Giữ nguyên phần bug cũ.

RÀNG BUỘC:
- Làm TỪNG nhóm một (bắt đầu app/api/**). Sau mỗi nhóm, DỪNG và in báo cáo:
  file đã soi, bug tìm được (kèm severity + file:dòng), bug đã fix (kèm hash),
  rồi hỏi tôi có tiếp nhóm sau không. Đừng ôm cả repo trong 1 lượt rồi làm ẩu.
- Nếu một file sạch, nói "clean" — đừng bịa bug cho đủ.
- Không đụng .env, không sửa CI, không chạy migration.
- Sau mỗi fix chạy lint + typecheck cho vùng liên quan; báo nếu đỏ.