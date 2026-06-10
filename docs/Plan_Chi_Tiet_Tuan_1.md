# Kế hoạch Chi tiết Tuần 1 - Smart Travel Guide

Ngày cập nhật: 2026-06-09

## 1. Mục tiêu Tuần 1

Tuần 1 tập trung vào phân tích, thiết kế, chốt stack kỹ thuật và dựng khung dự án Next.js có MongoDB, Redis, tài liệu nền, file môi trường mẫu và route kiểm tra hệ thống.

## 2. Sản phẩm bàn giao

| Hạng mục | Trạng thái hiện tại | Bằng chứng |
| --- | --- | --- |
| SRS | Hoàn thành | `docs/01_SRS.md` |
| Use Case | Hoàn thành | `docs/02_USE_CASE.md` |
| Data Model MongoDB/Redis | Hoàn thành, đã đồng bộ theo schema thật | `docs/03_DATA_MODEL.md`, `src/lib/mongodb.ts`, `src/database/schema.ts` |
| Sequence Diagram | Hoàn thành | `docs/04_SEQUENCE.md` |
| Design document | Hoàn thành mức định hướng hiện tại | `docs/DESIGN.md` |
| Khung Next.js App Router | Hoàn thành | `src/app`, `package.json` |
| MongoDB connection | Hoàn thành | `src/lib/mongodb.ts` |
| Redis connection | Hoàn thành | `src/lib/redis.ts` |
| File môi trường mẫu | Hoàn thành | `.env.example` |
| Docker local MongoDB/Redis | Hoàn thành | `docker-compose.yml` |
| Health route | Hoàn thành | `src/app/api/health/route.ts` |
| Debug MongoDB route | Hoàn thành | `src/app/api/debug/db/route.ts` |
| Debug Redis route | Hoàn thành | `src/app/api/debug/redis/route.ts` |
| Test infrastructure | Hoàn thành mức tối thiểu | `package.json`, `vitest.config.ts`, `src/lib/*.test.ts`, `src/__tests__/weather-utils.test.ts` |

## 3. Checklist nghiệm thu Tuần 1

- [x] Có `docs/01_SRS.md` mô tả actor, chức năng, yêu cầu phi chức năng và ràng buộc kỹ thuật.
- [x] Có `docs/02_USE_CASE.md` gồm sơ đồ use case và đặc tả use case chính.
- [x] Có `docs/03_DATA_MODEL.md` mô tả MongoDB collection, field, index và Redis key.
- [x] Có `docs/04_SEQUENCE.md` chứa sequence diagram lõi.
- [x] Có `docs/DESIGN.md` mô tả hướng UI hiện tại.
- [x] Khung Next.js + TypeScript + Tailwind + ESLint đã có trong project.
- [x] Có `docker-compose.yml` định nghĩa MongoDB và Redis local.
- [x] Có `.env.example` không chứa secret thật.
- [x] Có `src/lib/mongodb.ts` và `src/lib/redis.ts`.
- [x] Có `/api/health`, `/api/debug/db`, `/api/debug/redis`.
- [x] Có test runner Vitest và test tối thiểu.
- [ ] Commit/push GitHub: Không đủ dữ liệu để xác minh.

## 4. Kết luận Tuần 1

Tuần 1 đã hoàn thành theo phạm vi code và tài liệu trong repo hiện tại. Điểm duy nhất chưa thể đánh dấu hoàn thành là commit/push GitHub vì không đủ dữ liệu để xác minh.
