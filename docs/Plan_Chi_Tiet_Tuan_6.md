# Plan Chi Tiết Tuần 6 - Báo cáo, demo và bàn giao

## 1. Mục tiêu tuần

- Hoàn thiện tài liệu báo cáo.
- Chuẩn bị slide/demo script.
- Rà soát docs-code.
- Chạy kiểm thử cuối.
- Chuẩn bị bản nộp.

## 2. Phạm vi bàn giao

- Source code.
- Docs thiết kế.
- Docs kế hoạch.
- API report.
- Báo cáo tiến độ.
- Slide nếu có.
- Demo script.
- Hướng dẫn chạy local.

## 3. Checklist tài liệu

- [x] `README.md`
- [x] `KE_HOACH_DU_AN.md`
- [x] `API_REPORT.md`
- [x] SRS
- [x] Use Case
- [x] Data Model
- [x] Sequence
- [x] API docs ngoài
- [x] Design docs
- [x] Plan Tuần 1-6
- [ ] Báo cáo tổng kết riêng nếu giảng viên yêu cầu
- [ ] Slide nếu giảng viên yêu cầu

## 4. Checklist code

- [ ] Build pass ở lần kiểm tra cuối.
- [ ] Lint pass ở lần kiểm tra cuối.
- [ ] Test pass ở lần kiểm tra cuối.
- [ ] Không có route frontend gọi API thiếu.
- [ ] Không có README nhắc file không tồn tại.
- [ ] Không có docs ghi sai công nghệ.
- [ ] Không có secret thật trong docs hoặc `.env.example`.
- [ ] API core hoạt động trong môi trường local.

## 5. Demo script

1. Mở trang chủ.
2. Tìm kiếm địa điểm.
3. Xem POI/weather.
4. Đăng ký hoặc đăng nhập.
5. Cập nhật profile.
6. Lưu favorite.
7. Tạo trip.
8. Thêm itinerary.
9. Sửa/xóa itinerary item.
10. Xem chi tiết trip.
11. Admin xem thống kê/log nếu có `WEBHOOK_SECRET`.

## 6. Rủi ro cuối kỳ

- API ngoài lỗi hoặc bị rate limit.
- Build fail do thay đổi cuối.
- Auth chưa đạt mức production hoàn chỉnh vì còn hỗ trợ `x-user-id`.
- Test coverage integration thấp.
- Dữ liệu demo thiếu.
- Tài liệu lệch code nếu sửa gấp.

## 7. Checklist nghiệm thu Tuần 6

- [ ] Chạy `npm run lint`.
- [ ] Chạy `npm run build`.
- [ ] Chạy `npm test`.
- [ ] Rà README theo route thật.
- [ ] Rà API report theo route thật.
- [ ] Rà plan Tuần 1-6.
- [ ] Chuẩn bị demo data.
- [ ] Chuẩn bị slide/báo cáo nếu cần.

## 8. Kết quả bàn giao cuối cùng

- Project chạy local với MongoDB/Redis.
- Tài liệu code và kế hoạch đồng bộ.
- Demo flow đủ cho báo cáo.
- Danh sách giới hạn còn lại được ghi rõ.
