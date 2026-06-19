1. Collation tiếng Việt thiếu normalization (điểm tinh vi nhất)
Collation { locale: 'vi', strength: 2 } mặc định có normalization: false. Nghĩa là MongoDB giả định chuỗi đã được chuẩn hóa Unicode sẵn. Tiếng Việt thường tồn tại ở 2 dạng: precomposed (NFC: "ẽ" = 1 codepoint) và decomposed (NFD: "e" + dấu tổ hợp). Hai dạng này trông giống hệt nhau nhưng với normalization: false, index sẽ coi chúng khác nhau → có thể lách qua dedup case-insensitive bằng chuỗi NFD. Test hiện tại chỉ thử khác hoa/thường, không thử khác dạng Unicode nên không bắt được.
Bối cảnh: unique index checklist { tripId: 1, label: 1 } dùng collation { locale: 'vi', strength: 2 },
mặc định normalization: false → chuỗi NFC và NFD (ví dụ "Vẽ" precomposed vs decomposed) bị coi là KHÁC nhau,
cho phép tạo nhãn trùng nếu gửi ở dạng Unicode khác.

Yêu cầu:
1. Chuẩn hóa label về NFC (string.normalize('NFC')) ở tầng app TRƯỚC khi lưu và trước khi so khớp dedup,
   để app-layer và DB-layer dùng cùng một dạng.
2. (Tùy chọn phòng thủ thêm) cân nhắc đặt normalization: true trong collation; đánh giá tác động hiệu năng.
3. Đảm bảo hàm dedup tầng app dùng đúng chuẩn hóa này, không chỉ .toLowerCase().

Test: thêm case gửi 2 nhãn canonically-equivalent nhưng khác dạng NFC/NFD (tuần tự + Promise.all),
phải bị chặn ở cả app-layer lẫn DB index.
KHÔNG đổi unique index itinerary { tripId, day, orderIndex }.
2. Email normalization: chưa xác nhận parity giữa write-path và webhook
Webhook chuẩn hóa bằng .toLowerCase().trim(). Báo cáo khẳng định nhất quán nhưng không cho thấy đường ghi (register/reset) dùng đúng cùng logic, và không nói rõ unique index email (partial) có enforce case-insensitive ở tầng DB không. Nếu uniqueness chỉ dựa vào app lowercase mà một đường ghi nào đó quên → có thể tồn tại 2 tài khoản active khác nhau ở chữ hoa, phá vỡ giả định "1 active user / email" mà webhook dựa vào.
Bối cảnh: webhook tìm user bằng { email: email.toLowerCase().trim(), deletedAt: null }.
Cần đảm bảo bất biến "tối đa 1 active user cho mỗi email (không phân biệt hoa/thường)".

Yêu cầu:
1. Rà soát TẤT CẢ đường ghi email (register, login lookup, reset password, update profile) dùng đúng
   cùng một helper normalizeEmail() = .toLowerCase().trim() (tách thành 1 hàm dùng chung nếu chưa có).
2. Xác nhận partial unique index email enforce case-insensitive: hoặc index có collation case-insensitive,
   hoặc đảm bảo MỌI write đều đi qua normalizeEmail() (nêu rõ cách nào đang được dùng).
3. KHÔNG nới partial index điều kiện deletedAt.

Test: (a) register "User@X.com" rồi webhook với "user@x.com" phải trỏ đúng tài khoản active;
      (b) không thể tạo 2 tài khoản active chỉ khác hoa/thường email.
3. Rủi ro flaky trên CI do test integration dùng chung 1 DB thật
Báo cáo nói "chạy local 100% ổn định, không cần serial". Nhưng test integration đụng Mongo/Redis thật, dùng chung, có cả Promise.all chèn đồng thời để test index. "Pass ở local" là bằng chứng yếu cho CI (timing/tải khác). vi.restoreAllMocks() + testUserIds.clear() chỉ dọn mock và user IDs, không nói dọn collection trip/checklist/webhook.
Bối cảnh: test integration chạy trên Mongo/Redis thật dùng chung; có test concurrent (Promise.all).
Lo ngại flaky trên CI khi nhiều file test chạy song song trên cùng 1 DB.

Yêu cầu (chọn 1, ưu tiên A):
A. Cô lập DB theo worker: mỗi vitest worker dùng tên database riêng (vd suffix theo VITEST_WORKER_ID),
   teardown drop DB sau suite.
B. Hoặc đánh dấu suite integration chạy serial (pool/singleThread) để loại race giữa các file.
Ngoài ra: bổ sung afterEach dọn SẠCH các collection liên quan (trip, checklist, webhook-target user),
không chỉ testUserIds.clear().

Test: chạy lại toàn bộ integration nhiều lần liên tiếp (vd 10 vòng) phải xanh ổn định, không phụ thuộc thứ tự file.
4. Migration đổi collation trên production: có khoảng trống enforce uniqueness
Đổi collation cho một index đã tồn tại = phải drop index cũ rồi tạo lại → trong khoảng đó uniqueness không được enforce. Báo cáo có khuyến nghị backup nhưng để ở mức "đề xuất". Với lệnh --apply trên prod đây nên là bắt buộc + chạy trong cửa sổ bảo trì.
Bối cảnh: migrate-checklist-unique-index.ts đổi sang index có collation = drop + recreate,
tạo khoảng thời gian không enforce uniqueness.

Yêu cầu:
1. Chế độ --apply: bắt buộc xác nhận đã backup (cờ --i-have-backup hoặc prompt), từ chối chạy nếu thiếu.
2. Vẫn giữ bước aggregation phát hiện trùng và DỪNG nếu có trùng (đã có) trước khi drop.
3. Ghi rõ trong README: chạy --apply trong maintenance window, log thời điểm drop→recreate,
   và lệnh rollback nếu tạo lại index thất bại.
4. (Nếu khả thi) tạo index mới tên khác trước, rồi mới drop index cũ để thu hẹp khoảng trống.

Không tự ý chạy migration; chỉ cập nhật script + tài liệu.