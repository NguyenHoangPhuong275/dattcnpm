# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Smart Travel Guide — a Next.js web app for travel planning: place/POI search, weather, user profiles, favorites, trips and itineraries. Academic project (Đồ án Thực tế CNPM). **UI text, error messages, and many code comments are in Vietnamese** — match this when adding user-facing strings.

Scope note: interactive map / markers / popups were **deliberately removed** from scope. Don't reintroduce map visualization features.

## Commands

`npm` scripts (the declared package manager is `pnpm@10`, but the README and scripts use `npm`):

```bash
npm run dev          # dev server (Next.js, Turbopack) at http://localhost:3000
npm run build        # production build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm test             # vitest run
npm run test:ui      # vitest --ui
npm run test:coverage
```

Run a single test file / by name:

```bash
npx vitest run tests/integration/trips.integration.test.ts
npx vitest run -t "creates a trip"
```

Before considering a change done, run: `npm run lint && npm run typecheck && npm test`.

## Local services & env

Tests and the app need **MongoDB + Redis**. Start them with `docker compose up -d`. Copy `.env.example` to `.env`. Required: `MONGODB_URI`, `REDIS_URL`, `JWT_SECRET`; also used: `DEBUG_SECRET`, `API_KEY_RESEND` (Resend email/OTP), `WEBHOOK_SECRET` (admin maintenance), `NEXT_PUBLIC_APP_URL`.

**Tests hit real DBs.** `tests/setupEnv.ts` loads `.env` and rewrites `MONGODB_URI` to append `_test` to the database name so tests never touch dev data. Vitest runs with `fileParallelism: false` (suites share a DB). A running Mongo + Redis is mandatory for the integration suites.

## Architecture

Next.js 16 App Router + React 19 + TypeScript + Tailwind 4. Path alias `@/*` → `src/*`.

### Data layer (`src/lib/db/`)
All persistence goes through one entrypoint: **`getDb()`** (`connection.ts`) returns an `AppDatabase` of typed collection wrappers. Never import Mongoose models directly in routes — use `getDb()` then `db.<collection>`.

- `collections.ts` — `createCollection<T>(model)` wraps a Mongoose model with a small Mongo-like API (`findOne/find/findPaginated/findById/insertOne/updateOne/deleteOne/count/...`). `toPlain()` converts docs to plain objects and sets both `_id` and `id` as strings. `COLLECTIONS` maps logical names to actual Mongo collection names (e.g. `itineraryItems` → `itinerary_items`); `MANAGED_COLLECTIONS` is the canonical set.
- `models/`, `audit.ts` — Mongoose schemas. `schema.ts` holds the plain TypeScript types (`User`, `Trip`, ...) used everywhere.
- `index.ts` — barrel that re-exports models, types, connection, collections, redis, maintenance, users, trips. Most code imports from `@/lib/db`.
- `getDb()`/`connectMongo()` are idempotent singletons and auto-run `createAllCollections()` once per process. `maintenance.ts` provides drop/reset/consistency helpers driven by the admin webhook.

### Redis (`src/lib/db/redis.ts`)
Single lazy `ioredis` client. Centralizes OTP storage, rate-limit counters, avatar blobs, the short-lived user cache, and JWT blacklist. Treat Redis as best-effort in request paths — `getAuthUserFull` and rate limiting both degrade gracefully if Redis is down (`rate-limit.ts` falls back to an in-memory map).

### Auth (`src/lib/auth.ts` + `middleware.ts`)
- Login sets an **HttpOnly `auth_token` cookie** (JWT via `jose`, 7d). `getAuthUserId(request)` reads the cookie (or `Authorization: Bearer`); `getAuthUserFull(request)` resolves the full user with a 30s Redis cache and returns `null` for locked users.
- `x-user-id` header is honored **only when `NODE_ENV === 'test'`** (test convenience). `middleware.ts` strips `x-user-id`/`x-forwarded-user` from incoming requests outside tests.
- `middleware.ts` redirects unauthenticated users away from `/profile`, `/trips`, `/schedule-reference`, and 404s `/api/debug/*` in production.
- Client-side auth state lives in `src/lib/user.ts` — an in-memory store + subscriber pattern (not React context), with a `sessionStorage` logout timestamp. UI also keeps `localStorage` for back-compat.

### API routes (`src/app/api/.../route.ts`)
Consistent structure — follow it for new endpoints:
1. `try { ... } catch (error) { return handleApiError(error); }`
2. `const user = await getAuthUserFull(request)` → throw `new AppError('UNAUTHORIZED', ..., 401)` if missing (protected routes).
3. `checkRateLimit({ key, limit, windowSeconds })` for mutations; throw `AppError('RATE_LIMITED', ..., 429)` when `limited`.
4. Validate input with the Zod schemas in `src/lib/validations/`.
5. `const db = await getDb()` and operate on collections.
6. Best-effort `createAuditLog(...)` for writes (wrapped in its own try/catch).
7. Return `sendSuccess(data, message?, status?)`.

### API responses (`src/lib/api-response.ts`)
Use `sendSuccess` / `sendError` / `handleApiError` and throw `AppError(code, message, status, details?)`. `handleApiError` maps `ZodError` → 400 `VALIDATION_ERROR`, Mongo dup-key (11000) → 409 `CONFLICT`, and hides messages in production. Error `code`s come from `ERROR_CODES` in `src/lib/constants.ts` (route paths also live there as `ROUTES`).

### Admin maintenance (`src/app/api/webhook/route.ts`)
Dispatches DB maintenance events (`db.check`, `db.dropUnknown`, `db.reset`, ...) gated by the `x-webhook-secret` header. The `/admin` page is the intended UI for these.

## External data sources
Place search/POI use OpenStreetMap Nominatim/Overpass; weather uses Open-Meteo — all cached in Redis with rate limiting. No paid map/geocoding keys.
