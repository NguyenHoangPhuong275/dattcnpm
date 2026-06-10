# Plan Chi Tiết Tuần 5 - Admin, kiểm thử, bảo mật và hoàn thiện UI

## 1. Mục tiêu tuần

- Hoàn thiện admin dashboard.
- Quản lý user/trip/log cơ bản.
- Kiểm thử các API lõi.
- Chuẩn hóa validation/error handling.
- Hoàn thiện responsive UI.
- Bảo mật route nhạy cảm.

## 2. Phạm vi nghiệp vụ

Admin xem thống kê, xem user, lock/unlock user nếu có quyền, xem audit logs, kiểm tra dữ liệu hệ thống. User dùng app ổn định trên desktop/mobile.

## 3. Chức năng cần có

| Mã | Chức năng | Mô tả | API/UI | Trạng thái |
| --- | --- | --- | --- | --- |
| W5-01 | Admin stats | Xem số lượng document | `/api/webhook`, `/admin` | Đã có cơ bản |
| W5-02 | User list | Xem danh sách user | `/api/webhook` event `system.users` | Đã có qua webhook |
| W5-03 | Lock/unlock user | Khóa/mở user | `/api/webhook` event `user.lock`, `user.unlock` | Đã có qua webhook |
| W5-04 | Audit logs | Xem log hệ thống | `/api/webhook` event `system.logs` | Đã có qua webhook |
| W5-05 | API testing | Test API lõi | Vitest | Có test tối thiểu |
| W5-06 | Auth security | JWT cookie, logout, middleware | Auth routes, `middleware.ts` | Đã có cơ bản |
| W5-07 | Rate limit | OTP/login/search | Redis/helper | Đã có cơ bản |
| W5-08 | Responsive polish | Kiểm tra UI mobile | App UI | Chưa rà soát đầy đủ |
| W5-09 | Error/empty/loading state | Chuẩn hóa trải nghiệm lỗi | API/UI | Đang làm |

## 4. API liên quan

- `POST /api/webhook`
- `GET /api/health`
- `GET /api/debug/db`
- `GET /api/debug/redis`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/send-otp`
- `POST /api/auth/verify-otp`
- Các API core của profile/trips/itinerary/favorites/search/weather.

## 5. Security checklist

- [x] Không trả password/token/OTP ra response.
- [x] Login set HttpOnly JWT cookie.
- [x] Logout xóa cookie auth.
- [x] Middleware bảo vệ `/profile`.
- [x] `x-user-id` còn được hỗ trợ để tương thích UI, cần ghi rõ rủi ro khi báo cáo production.
- [x] Rate limit OTP/login/search.
- [~] Validate input đã có ở API chính, chưa Zod toàn bộ.
- [x] Ownership check ở trips/favorites/itinerary/search-history.
- [x] Admin secret dùng biến môi trường, không hardcode secret thật.
- [x] Error response không trả stack trace cho client.

## 6. Test checklist

- [x] Auth token helper.
- [x] Logout route.
- [x] Rate limit helper.
- [x] Weather utility.
- [ ] Auth login integration.
- [ ] Places/search integration.
- [ ] Trips/itinerary integration.
- [ ] Favorites integration.
- [ ] Profile integration.
- [ ] Admin webhook integration.

## 7. UI checklist

- [ ] Mobile responsive rà soát toàn bộ.
- [x] Loading state ở các khu vực chính.
- [x] Empty state ở itinerary.
- [x] Error state ở itinerary.
- [~] Form validation message đã có ở auth/profile/trip mức cơ bản.
- [~] Modal UX đã có, cần polish thêm.

## 8. Checklist nghiệm thu Tuần 5

- [ ] Admin dashboard hiển thị đủ stats/log/user actions cần demo.
- [ ] Test coverage đủ cho API lõi hoặc ghi rõ giới hạn.
- [ ] Lint/build/test pass trước khi nộp.
- [ ] Responsive desktop/mobile được rà soát.
- [ ] Security checklist được cập nhật trong báo cáo.

## 9. Rủi ro

- Admin webhook phụ thuộc `WEBHOOK_SECRET`.
- Test integration cần MongoDB/Redis test.
- `x-user-id` không phù hợp production nếu chưa thay hoàn toàn bằng session/JWT guard.
- UI polish có thể tốn thời gian nếu mở rộng scope.

## 10. Kết quả bàn giao

- Admin đủ demo.
- Test tối thiểu và báo cáo coverage.
- Security checklist rõ ràng.
- UI responsive được rà soát.
