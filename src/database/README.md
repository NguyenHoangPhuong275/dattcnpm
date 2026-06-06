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

// Get data
const user = await mockDb.users.findOne({ email: 'user1@example.com' });
const trip = mockDb.trips.findById('t_trip_001');

// Redis cache example
await mockRedis.set('geo:search:da-lat', JSON.stringify({ lat: 21.0285, lng: 105.852 }), 86400);
const cached = await mockRedis.get('geo:search:da-lat');

// Rate limit simulation
const attempts = await mockRedis.incr('rl:login:127.0.0.1');
await mockRedis.expire('rl:login:127.0.0.1', 900);

// Reset everything to clean seed state (great for tests)
resetAllMocks();
```

## Swapping to real DB later

When you're ready for real MongoDB + Redis:

1. Replace `src/lib/mongodb.ts` with real Mongoose connection
2. Replace `src/lib/redis.ts` with real ioredis
3. Keep using the same interfaces from `schema.ts`
4. The mock files can stay for tests (`vitest` with `beforeEach(resetAllMocks)`)

## Seeded Data

The mock comes pre-loaded with:
- 1 Admin + 2 Users
- 3 Places (Hồ Hoàn Kiếm, Bún Chả, Hotel)
- 1 Trip with itinerary items
- Reviews, budgets, accommodations, checklists, shares, notifications, etc.

You can extend `mock-data.ts` with more realistic data as needed.
