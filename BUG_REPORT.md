# BUG REPORT — SMART TRAVEL GUIDE

Tài liệu ghi nhận chi tiết các lỗi logic, hiệu năng và bảo mật mới phát hiện trong đợt quét mã nguồn chuyên sâu ngày 24/06/2026.

---

## 0. TRẠNG THÁI XỬ LÝ — 2026-06-24

> Đã **check + confirm** trực tiếp trên mã nguồn và **fix + refactor** toàn bộ 5 mục. Kiểm chứng: ESLint sạch, `tsc --noEmit` sạch, **toàn bộ test suite 262/262 pass (53 file)**.

| # | Mức | Xác nhận | File:dòng đã sửa | Cách xử lý |
|---|---|---|---|---|
| 1 | High | ✅ Đúng | [trips/route.ts:24](src/app/api/trips/route.ts) | Lọc `$or: [{ userId }, { 'collaborators.userId': userId }]` — cộng tác viên thấy chuyến đi (Mongoose tự cast string→ObjectId) |
| 2 | High | ✅ Đúng | [collections.ts:47,86](src/lib/db/collections.ts) + [webhook/route.ts:259](src/app/api/webhook/route.ts) | Thêm `projection` vào `FindOptions` & `find`; broadcast dùng `find({}, { projection: { _id: 1 } })` |
| 3 | High | ✅ Đúng | [places/search/route.ts:238](src/app/api/places/search/route.ts) | Thay in-memory sort + vòng `deleteOne` bằng helper chung `pruneSearchHistory` (deleteMany 1 lần) |
| 4 | Medium | ✅ Đúng | [trips/route.ts:64](src/app/api/trips/route.ts) | Default date lấy ngày local (`toLocaleDateString('sv-SE')`) rồi parse midnight UTC — áp dụng cho cả start & end |
| 5 | Low | ✅ Đúng* | [import-hotel-reviews.ts:251](scripts/import-hotel-reviews.ts) | `let` → `const` (ESLint `prefer-const` xác nhận; *nội dung dòng trong báo cáo khác thực tế nhưng đúng biến/lỗi) |

**Refactor kèm theo (DRY):** logic cắt lịch sử tìm kiếm được tách thành **`src/lib/search-history.ts` → `pruneSearchHistory(db, userId, keep)`**, dùng chung bởi cả `places/search` (mục 3) lẫn route `search-history` POST (đã sửa ở đợt trước) → bỏ trùng lặp.

---

## Danh sách Bug & Lỗ hổng phát hiện

### 1. [Lỗi Logic / Quyền hạn] Cộng tác viên (Collaborator) không thấy chuyến đi trong danh sách hành trình
* **Mức độ:** **High** (Nghiêm trọng)
* **Tệp tin:** [src/app/api/trips/route.ts](file:///d:/LapTrinhAI/DATTCNPM/src/app/api/trips/route.ts#L23-L26)
* **Đoạn code hiện tại:**
```typescript
    const paginated = await db.trips.findPaginated(
      { userId },
      { page, limit, sortBy: 'updatedAt', sortOrder: -1 }
    );
```
* **Chi tiết lỗi:** Câu lệnh truy vấn danh sách chuyến đi chỉ lọc theo `{ userId }` (tức là chủ chuyến đi). Nếu một người dùng được mời làm cộng tác viên (collaborator) của chuyến đi khác, họ sẽ không thấy chuyến đi đó xuất hiện trong danh sách hành trình của mình trên giao diện (họ buộc phải nhớ hoặc lưu lại URL trực tiếp).
* **Đề xuất sửa đổi:** Cập nhật bộ lọc truy vấn để tìm kiếm chuyến đi do người dùng sở hữu HOẶC người dùng nằm trong danh sách cộng tác viên:
```diff
     const paginated = await db.trips.findPaginated(
-      { userId },
+      {
+        $or: [
+          { userId },
+          { 'collaborators.userId': userId }
+        ]
+      },
       { page, limit, sortBy: 'updatedAt', sortOrder: -1 }
     );
```

---

### 2. [Lỗi Hiệu năng] Tải toàn bộ trường của tất cả User lên RAM khi phát thông báo
* **Mức độ:** **High** (Nghiêm trọng)
* **Tệp tin:** [src/app/api/webhook/route.ts](file:///d:/LapTrinhAI/DATTCNPM/src/app/api/webhook/route.ts#L259)
* **Đoạn code hiện tại:**
```typescript
        const users = await db.users.find();
        const notificationCount = users.length;
```
* **Chi tiết lỗi:** Khi admin gọi webhook phát thông báo hệ thống (`notification.broadcast`), câu lệnh `db.users.find()` không sử dụng projection để giới hạn các trường trả về. Đồng thời, helper `find` của database luôn tải toàn bộ các trường (bao gồm cả trường nhạy cảm/nặng như `passwordHash`, `email`, `fullName`, `interests`...) của toàn bộ người dùng trong DB lên RAM. Với quy mô người dùng lớn, việc này sẽ gây nghẽn CPU và tràn bộ nhớ RAM (Out of Memory).
* **Đề xuất sửa đổi:**
1. Cần bổ sung tham số projection cho phương thức `find` trong helper [collections.ts](file:///d:/LapTrinhAI/DATTCNPM/src/lib/db/collections.ts#L86-L92) để chỉ định các trường cần lấy.
2. Cập nhật webhook chỉ select duy nhất trường `_id`:
```typescript
        const users = await db.users.find({}, { projection: { _id: 1 } });
```

---

### 3. [Lỗi Hiệu năng / N+1 Write] Ghi lịch sử tìm kiếm địa điểm vẫn sử dụng logic in-memory sort và vòng lặp deleteOne
* **Mức độ:** **High** (Nghiêm trọng)
* **Tệp tin:** [src/app/api/places/search/route.ts](file:///d:/LapTrinhAI/DATTCNPM/src/app/api/places/search/route.ts#L238-L247)
* **Đoạn code hiện tại:**
```typescript
    const histories = await db.searchHistories.find({ userId });
    histories
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(50)
      .forEach((item) => {
        db.searchHistories.deleteOne(item._id).catch((err) => {
          console.error('Lỗi khi xóa lịch sử tìm kiếm thừa:', err);
          return null;
        });
      });
```
* **Chi tiết lỗi:** Khác với route API lịch sử tìm kiếm chính thức đã được tối ưu hóa (đẩy sort xuống DB và dùng `deleteMany` một lần), helper `recordSearchHistory` được gọi mỗi khi người dùng tìm kiếm địa điểm vẫn sử dụng logic cũ: tải toàn bộ bản ghi lên RAM, sort in-memory, sau đó chạy vòng lặp gọi `deleteOne` độc lập cho từng phần tử thừa. Điều này tạo ra N+1 truy vấn write dư thừa đè nặng lên cơ sở dữ liệu.
* **Đề xuất sửa đổi:** Đồng bộ hóa logic tối ưu từ route lịch sử tìm kiếm:
```typescript
    const recent = await db.searchHistories.find(
      { userId },
      { sortBy: 'createdAt', sortOrder: -1, limit: 50 }
    );
    if (recent.length === 50) {
      const cutoff = recent[recent.length - 1].createdAt;
      await db.searchHistories.deleteMany({ userId, createdAt: { $lt: cutoff } });
    }
```

---

### 4. [Lỗi Logic / Lệch Timezone] Lệch lùi 1 ngày khi dùng default `new Date()` lúc tạo chuyến đi
* **Mức độ:** **Medium** (Trung bình)
* **Tệp tin:** [src/app/api/trips/route.ts](file:///d:/LapTrinhAI/DATTCNPM/src/app/api/trips/route.ts#L64-L65)
* **Đoạn code hiện tại:**
```typescript
    const startDate: Date = parsed.startDate ? new Date(parsed.startDate) : new Date();
    const endDate: Date = parsed.endDate ? new Date(parsed.endDate) : new Date(Date.now() + 86_400_000 * 3);
```
* **Chi tiết lỗi:** Khi người dùng không truyền `startDate` (optional), hệ thống sử dụng `new Date()` (chứa ngày giờ cục bộ hiện tại của máy chủ). Khi đối tượng này được lưu vào DB (dưới dạng UTC) và sau đó được format bằng `date.toISOString().split('T')[0]`, ngày bắt đầu hiển thị trên giao diện của người dùng có thể bị lệch lùi lại 1 ngày so với ngày hiện tại (ví dụ: ngày hiện tại của người dùng là 24, nhưng giờ UTC vẫn đang là tối ngày 23).
* **Đề xuất sửa đổi:** Đưa ngày hiện tại về định dạng chuỗi YYYY-MM-DD theo múi giờ local của người dùng/hệ thống rồi mới parse thành Date để luôn đảm bảo lưu trữ giờ midnight UTC:
```typescript
    const defaultStartStr = new Date().toLocaleDateString('sv-SE'); // sv-SE trả về định dạng YYYY-MM-DD
    const startDate: Date = parsed.startDate ? new Date(parsed.startDate) : new Date(defaultStartStr);
```

---

### 5. [Lỗi Code Quality] Cảnh báo linter prefer-const
* **Mức độ:** **Low** (Thấp)
* **Tệp tin:** [scripts/import-hotel-reviews.ts](file:///d:/LapTrinhAI/DATTCNPM/scripts/import-hotel-reviews.ts#L251)
* **Đoạn code hiện tại:**
```typescript
          let hotelReviews = await db.hotelReviews.find({ hotelId: String(hotel._id) });
```
* **Chi tiết lỗi:** Biến `hotelReviews` không bao giờ bị gán lại giá trị mới nhưng được khai báo bằng từ khóa `let`, gây lỗi linter `prefer-const`.
* **Đề xuất sửa đổi:** Đổi khai báo thành `const hotelReviews`.
