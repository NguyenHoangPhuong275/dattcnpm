# Post-Latest-Fixes Refactor / Fix Plan

> Kế hoạch xử lý các điểm còn lại sau đợt review mới nhất. Phạm vi hẹp: test isolation.

## 1. Mục tiêu

- Loại bỏ nguy cơ **flaky test** do integration test dùng chung ID/email/label cố định.
- Chỉ xử lý các vấn đề **còn lại sau review**, không mở rộng.
- **Không** thay đổi business logic.
- **Không** thay đổi API contract / response format.
- **Không** thay đổi schema database (trừ khi phát hiện lỗi thật — hiện không có).
- **Không** thêm feature mới.

## 2. Nguồn phát hiện

Dựa trên báo cáo review sau đợt fix mới:

- Project đang ở trạng thái **SAFE TO COMMIT**.
- `lint` / `typecheck` / `test` / `build` đã xanh theo báo cáo (test cần MongoDB + Redis).
- Vấn đề đáng chú ý nhất: nguy cơ **flaky test** do dữ liệu integration test dùng chung `OWNER` ID cố định (hard-coded ObjectId), nổi bật ở `itinerary-reorder.integration.test.ts`.
- Cần rà các integration test khác xem có pattern tương tự (ID/email/label cố định, `deleteMany` điều kiện rộng) hay không.

Ghi chú môi trường: `vitest.config.ts` đặt `fileParallelism: false` → các file test chạy **tuần tự**, dùng chung một DB `*_test`. Vì vậy rủi ro đụng dữ liệu **giữa các file** hiện thấp, nhưng ID cố định vẫn là class lỗi cần loại bỏ để bền vững khi (a) bật parallel trong tương lai, (b) chạy lại khi DB còn sót state, (c) hai file vô tình trùng literal ObjectId.

## 3. Danh sách việc cần làm

- [x] Rà soát integration tests dùng ID/EMAIL/LABEL cố định.
- [x] Thay ID cố định dễ đụng dữ liệu bằng ID sinh riêng cho từng test (`new Types.ObjectId()`).
- [x] Email test dùng suffix unique cho từng test.
- [x] Mỗi test ghi DB có dữ liệu cô lập (owner/trip/email riêng).
- [x] Cleanup scoped đúng theo dữ liệu test đó (theo `userId`/`email`/`_id`), không xóa rộng.
- [x] Kiểm tra `itinerary-reorder.integration.test.ts`.
- [x] Kiểm tra `checklist-bulk.integration.test.ts`.
- [x] Kiểm tra `user-email-partial-index.integration.test.ts`.
- [x] Kiểm tra các integration test khác (rà soát, ghi nhận).
- [ ] Chạy lại `npm run lint`.
- [ ] Chạy lại `npm run typecheck`.
- [ ] Chạy lại `npm test` (cần Docker/Mongo/Redis).
- [ ] Chạy lại E2E nếu môi trường cho phép.
- [ ] Chạy `npm run build` nếu cần xác nhận production.

## 4. Nguyên tắc refactor/fix

- Chỉ sửa phạm vi **test isolation** và lỗi liên quan trực tiếp.
- Không sửa UI/UX.
- Không sửa API response.
- Không sửa business logic.
- Không sửa migration script nếu không có lỗi thật.
- Không đổi tên file nếu không cần.
- Không refactor lớn, không gom thay đổi không liên quan.
- Lỗi mới ngoài scope: chỉ ghi vào báo cáo, không tự sửa lớn.

## 5. Rủi ro cần tránh

- Test pass riêng lẻ nhưng fail khi chạy cả suite.
- `deleteMany` điều kiện quá rộng (xóa nhầm dữ liệu test khác / dữ liệu dev).
- Dữ liệu test dùng chung email / ownerId / tripId.
- Test race-condition flaky.
- Test phụ thuộc thứ tự chạy.
- Test phụ thuộc state còn sót từ test trước.
- Cleanup xóa dữ liệu của test chạy song song.
- Mock quá sâu khiến test không bắt được lỗi thật.

## 6. Tiêu chí hoàn thành

- Integration test không còn dùng chung ID nguy hiểm.
- Mỗi test ghi DB có dữ liệu riêng.
- Cleanup scoped đúng theo dữ liệu test đó.
- `npm run lint` pass.
- `npm run typecheck` pass.
- `npm test` pass (môi trường có DB).
- `npm run test:e2e` pass nếu môi trường cho phép.
- `npm run build` pass nếu chạy.
- Báo cáo cuối ghi rõ file đã sửa và lý do.

## 7. Cách triển khai (tóm tắt)

- Dùng `vi.hoisted()` giữ một `Set<string>` registry các user id test; mock `getUserById` trả user tổng hợp cho id nằm trong registry → cho phép sinh owner id mới mỗi test mà mock vẫn nhận diện.
- Helper `newUserId()` = `new Types.ObjectId().toString()` + thêm vào registry.
- Helper `newEmail()` = email có hậu tố `randomUUID()` cho test email-uniqueness.
- `afterEach` cleanup theo đúng owner/email do test tạo, rồi `clear()` registry.
- Giữ nguyên assertion của test rollback phase-2 (đếm số lần gọi, khôi phục orderIndex, status 500).
