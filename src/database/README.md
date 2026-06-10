# Database Mock Implementation

This folder contains a **complete in-memory mock** of the MongoDB + Redis layer.

## Current Status

- `schema.ts` → Type definitions (source of truth)
- `mock-data.ts` → Rich seed data for development & testing
- `mock-db.ts` → Full mock MongoDB with collections + basic CRUD
- `mock-redis.ts` → Mock Redis (get/set/incr/expire + helpers for rate limit & blacklist)
- `index.ts` → Clean exports + `resetAllMocks()`

## How to use

```ts
import { mockDb, mockRedis, resetAllMocks, findMockUserByEmail } from '@/database';

const user = await mockDb.users.findOne({ email: 'user1@example.com' });
const trip = mockDb.trips.findById('t_trip_001');

await mockRedis.set('geo:search:da-lat', JSON.stringify({ lat: 21.0285, lng: 105.852 }), 86400);
const cached = await mockRedis.get('geo:search:da-lat');

const attempts = await mockRedis.incr('rl:login:127.0.0.1');
await mockRedis.expire('rl:login:127.0.0.1', 900);

resetAllMocks();
```

## Current architecture (updated)

- **Real DB**: `src/lib/mongodb.ts` (Mongoose + explicit collection names + `getDb()` unified interface)
- **Mock DB**: `src/database/mock-*` (in-memory + file persistence for users only, for tests/dev without Mongo)

All API routes use the **real** path via `@/lib/mongodb`.

## Collection naming (important for avoiding duplicates)

We now use **explicit snake_case collection names** in Mongoose schemas (see `COLLECTIONS` const):

`users`, `trips`, `places`, `itinerary_items`, `favorite_places`, `reviews`, `audit_logs`, `search_histories`, `trip_shares`, `notifications`, `tags`, `user_preferences`, `trip_budgets`, `trip_accommodations`, `trip_checklists`, `user_follows`.

This prevents "bảng trùng" when model names change during development.

Use the webhook events:
- `db.clear` / `db.reset` → drop all managed collections (strong reset)
- `db.dropUnknown` → xóa các collection lạ còn sót lại
- `db.hardReset` / `db.nuke` → xóa sạch mọi thứ
- `db.listCollections` → xem managed vs current vs unknown

## Swapping / testing

- Mock files stay for unit tests (reset with `resetAllMocks()` from `@/database`)
- Real DB cleanup is now much stronger (dropCollection instead of just deleteMany)

## Seeded Data

The mock comes pre-loaded with:
- 1 Admin + 2 Users
- 3 Places (Hồ Hoàn Kiếm, Bún Chả, Hotel)
- 1 Trip with itinerary items
- Reviews, budgets, accommodations, checklists, shares, notifications, etc.

You can extend `mock-data.ts` with more realistic data as needed.
