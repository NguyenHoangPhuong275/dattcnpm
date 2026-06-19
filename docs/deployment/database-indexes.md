# Index database & soft delete

> Ghi chú vận hành cho **Task 1.5 — Index cho trường soft delete**.

## Index đã thêm

| Collection | Index | Mục đích |
|-----------|-------|----------|
| `trips` | `{ userId: 1, deletedAt: 1 }` | List chuyến đi của user, lọc `deletedAt: null`. |
| `trips` | `{ deletedAt: 1, startDate: 1 }` | Cron weather-alerts quét theo khoảng `startDate` + `deletedAt: null`. |
| `users` | `{ email: 1, deletedAt: 1 }` | Tra cứu user theo email kèm soft delete (email đã unique sẵn). |
| `reviews` | `{ userId: 1, deletedAt: 1 }` | Danh sách review của một user (`/api/reviews/my`). |

`reviews` đã có sẵn `{ placeId: 1, deletedAt: 1 }` từ trước.

## Build index trên production

- Trong dev, Mongoose tự tạo index (`autoIndex` mặc định bật). Trên production nên
  build có kiểm soát để tránh ảnh hưởng hiệu năng khi collection lớn.
- MongoDB **4.2+** build index theo cơ chế tối ưu, **không khóa** collection trong
  hầu hết thời gian (tùy chọn `background` cũ đã bị bỏ qua). Vẫn nên build vào
  giờ thấp điểm với collection lớn.
- Có thể đồng bộ index theo schema bằng `Model.syncIndexes()` (hoặc
  `createIndexes()`), hoặc tạo thủ công qua `mongosh`:

  ```js
  db.trips.createIndex({ userId: 1, deletedAt: 1 })
  db.trips.createIndex({ deletedAt: 1, startDate: 1 })
  db.users.createIndex({ email: 1, deletedAt: 1 })
  db.reviews.createIndex({ userId: 1, deletedAt: 1 })
  ```

## Kiểm tra

Dùng `explain()` xác nhận truy vấn list trip/user dùng `IXSCAN` thay vì `COLLSCAN`:

```js
db.trips.find({ userId: ObjectId("..."), deletedAt: null }).explain("executionStats")
```
