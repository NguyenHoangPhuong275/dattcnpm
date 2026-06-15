# Smart Travel Guide — Project Rules

## 1. Stack & Versions

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js App Router | 16.x |
| Language | TypeScript (strict) | 5.x |
| Runtime | React | 19.x |
| Database | MongoDB via Mongoose | 9.x |
| Cache / Rate-limit / OTP | Redis via ioredis | 5.x |
| Validation | Zod | 4.x |
| Auth | JWT (jose, HS256) | HttpOnly cookie `auth_token` |
| Email | Resend | 6.x |
| CSS | Tailwind CSS | 4.x |
| Test | Vitest | 4.x |
| Linter | ESLint (eslint-config-next) | 9.x |

---

## 2. Architecture & Folder Structure

```
├── middleware.ts              # Edge Middleware — auth guard, debug block
├── src/
│   ├── app/                   # Next.js App Router pages & API routes
│   │   ├── api/               # API route handlers (server-only)
│   │   ├── profile/           # Protected pages
│   │   ├── trips/             # Protected pages
│   │   └── ...
│   ├── components/            # React components
│   │   ├── ui/                # Generic reusable (Button, Modal, Input...)
│   │   ├── home/              # Page-specific: homepage
│   │   ├── profile/           # Page-specific: profile
│   │   ├── trips/             # Page-specific: trips
│   │   ├── auth/              # Page-specific: auth forms
│   │   ├── admin/             # Page-specific: admin panel
│   │   ├── local/             # Page-specific: local pages
│   │   ├── icons.tsx           # All SVG icon components
│   │   ├── AppHeader.tsx       # Shared layout header
│   │   ├── BrandLogo.tsx       # Brand logo component
│   │   └── UserDropdown.tsx    # User menu dropdown
│   ├── hooks/                 # Custom React hooks (client-only)
│   ├── lib/                   # Shared utilities & server logic
│   │   ├── db/                # Database layer (MongoDB + Redis)
│   │   ├── validations/       # Zod schemas by domain
│   │   ├── api-response.ts    # Server: sendSuccess, sendError, handleApiError
│   │   ├── api-client.ts      # Client: apiRequest, getApiErrorMessage
│   │   ├── auth.ts            # JWT sign/verify, user extraction
│   │   ├── constants.ts       # ROUTES, ERROR_CODES, defaults
│   │   ├── rate-limit.ts      # Redis-based rate limiting
│   │   ├── string.ts          # Vietnamese text normalization
│   │   ├── date.ts            # Date parsing/formatting utilities
│   │   ├── trip-utils.ts      # Trip domain utilities
│   │   ├── trip-formatters.ts # Trip list extraction/formatting
│   │   └── index.ts           # Public barrel (client-safe exports only)
│   ├── data/                  # Static data files (JSON, TS constants)
│   └── types/                 # TypeScript type definitions
│       ├── profile.ts
│       ├── trip.ts
│       ├── place.ts
│       ├── common.ts
│       └── index.ts           # Barrel re-export
├── tests/                     # All test files (mirrors src/ structure)
│   ├── lib/
│   ├── api/
│   ├── integration/
│   └── setupEnv.ts
├── scripts/                   # Maintenance scripts (DB cleanup, etc.)
├── docs/                      # Project documentation (SRS, use cases, plans)
└── public/                    # Static assets
```

### Rules

- **No source code outside `src/`** except `middleware.ts` (required by Next.js at root).
- **No test files inside `src/`**. All tests go under `tests/` mirroring the source path.
- **No static data in `src/lib/`**. Static data (localities, destinations, home config) goes in `src/data/`.
- **No server-only imports in `src/lib/index.ts` barrel**. The barrel only re-exports client-safe code (`auth` types, `api-client`, `user`, `trip-utils`). Database, Redis, Resend, and rate-limit modules are imported directly.
- **No mock imports in production entrypoints**. Mock DB/Redis (`src/lib/db/mocks.ts`) must never be imported from `src/lib/db/index.ts`.

---

## 3. Naming Conventions

### Files

| Type | Pattern | Example |
|---|---|---|
| React component | `PascalCase.tsx` | `TripCard.tsx`, `AppHeader.tsx` |
| Hook | `camelCase.ts`, prefix `use` | `useMyTrips.ts`, `useToast.ts` |
| Utility module | `kebab-case.ts` | `api-response.ts`, `trip-utils.ts` |
| Validation schema | `kebab-case.ts` in `lib/validations/` | `trip.ts`, `auth.ts`, `common.ts` |
| Type definition | `kebab-case.ts` in `types/` | `profile.ts`, `trip.ts` |
| API route | `route.ts` inside App Router path | `src/app/api/trips/route.ts` |
| Page | `page.tsx` inside App Router path | `src/app/profile/page.tsx` |
| Test file | `*.test.ts` under `tests/` | `tests/lib/auth.test.ts` |
| Static data | `kebab-case.ts` or `.json` in `data/` | `localities.ts`, `vietnam-tourism-destinations.json` |

### Variables & Functions

| Type | Pattern | Example |
|---|---|---|
| Function | `camelCase` | `sendSuccess`, `handleApiError`, `getAuthUserFull` |
| React component | `PascalCase` | `TripCard`, `CityChips` |
| Hook | `usePascalCase` | `useMyTrips`, `useToast` |
| Constant | `UPPER_SNAKE_CASE` | `ERROR_CODES`, `ROUTES`, `COLLECTIONS`, `DEFAULT_TRIP_IMAGE` |
| Type / Interface | `PascalCase` | `TripSummary`, `AuthUser`, `ApiSuccess` |
| Zod schema | `camelCase` + `Schema` suffix | `objectIdSchema`, `createTripSchema`, `loginSchema` |
| Collection name (MongoDB) | `snake_case` | `itinerary_items`, `favorite_places`, `audit_logs` |
| Redis key prefix | `snake_case` with `:` separator | `rl:login:{ip}:{email}`, `otp:{email}` |

### Components Directory

- Shared components used across multiple pages → root of `src/components/` or `src/components/ui/`.
- Page-specific components → `src/components/{page-name}/` matching the route name.
- All SVG icons → single file `src/components/icons.tsx`.
- Component folder names are **plural** for domain groupings: `trips/`, `auth/`, not `trip/`, `auth-form/`.

---

## 4. API Route Patterns

### Handler Signature

```typescript
export async function GET(request: NextRequest): Promise<Response> {
  try {
    // 1. Auth check
    const user = await getAuthUserFull(request);
    if (!user) throw new AppError('UNAUTHORIZED', '...', 401);

    // 2. Validate input (Zod)
    const parsed = someSchema.parse(data);

    // 3. Business logic (DB calls)
    const db = await getDb();
    const result = await db.collection.method(filter);

    // 4. Return success
    return sendSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Rules

- Every handler is wrapped in `try { ... } catch (error) { return handleApiError(error); }`.
- Use `sendSuccess(data)` for success responses, `sendError(code, message, status)` for explicit errors.
- Throw `AppError` for business-logic errors; `handleApiError` serializes them automatically.
- `ZodError` is caught automatically by `handleApiError` → returns 400 with field details.
- Auth: use `getAuthUserFull(request)` to get full user object or `getAuthUserId(request)` for just the ID.
- Dynamic route params use `RouteCtx = { params: Promise<{ id: string }> }` (Next.js 16 async params).
- Rate limiting via `checkRateLimit(key, limit, windowSeconds)` from `@/lib/rate-limit`.
- Audit logging via `createAuditLog(db, { userId, action, details })` from `@/lib/db`.

### Response Shape

```typescript
// Success
{ success: true, status: 200, error: null, data: T, message?: string }

// Error
{ success: false, status: 4xx|5xx, data: null, error: { code: string, message: string, details?: unknown }, message: string }
```

### Error Codes

Use only values from `ERROR_CODES` in `src/lib/constants.ts`:
`VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL_ERROR`, `SERVICE_UNAVAILABLE`, `BAD_REQUEST`, `GONE`.

---

## 5. Database Layer

### Access Pattern

- All DB access goes through `getDb()` from `@/lib/db`.
- `getDb()` returns a typed `AppDatabase` object with collection accessors (`.users`, `.trips`, etc.).
- Collection operations: `.findById()`, `.findOne()`, `.findPaginated()`, `.insertOne()`, `.updateById()`, `.deleteById()`.
- Use `toPlain<T>(doc)` to convert Mongoose documents to plain objects.
- MongoDB collection names are defined in `COLLECTIONS` constant (`src/lib/db/collections.ts`).

### Schema

- All Mongoose schemas defined in `src/lib/db/schema.ts`.
- Mongoose models in `src/lib/db/models/`.
- Types are exported from `src/lib/db/index.ts` barrel for external use.
- Type aliases follow pattern: `type User = UserType` (schema type) + `const User = UserModel` (model).

### Redis

- Redis client from `src/lib/db/redis.ts`.
- Key patterns defined in `RedisKey` enum from schema.
- Used for: cache (places, POI, weather), OTP storage, rate limiting, avatar cache.

### Rules

- Never import Mongoose/Redis directly in API routes — always go through `@/lib/db`.
- Never import mock modules (`mock-db.ts`, `mock-redis.ts`, `mocks.ts`) in production code paths.
- Edge Middleware cannot use Node.js APIs — keep `middleware.ts` free of DB/Redis imports.

---

## 6. Validation

### Structure

Schemas are split by domain under `src/lib/validations/`:

| File | Domain |
|---|---|
| `common.ts` | Shared: `objectIdSchema`, `paginationSchema`, `latLngSchema`, `dateStringSchema`, `trimString` |
| `auth.ts` | Login, register, OTP |
| `trip.ts` | Trip CRUD, itinerary |
| `profile.ts` | Profile update, password change |
| `search.ts` | Place search |
| `favorite.ts` | Favorites |
| `place.ts` | POI queries |
| `validation.ts` | Barrel / central file |

### Rules

- All request input is validated with Zod before any business logic.
- Compose schemas using shared primitives from `common.ts` (`objectIdSchema`, `trimString`, `dateStringSchema`).
- Error messages in Vietnamese: `"Tối thiểu X ký tự"`, `"ID không hợp lệ"`, etc.
- Schema naming: `{action}{Domain}Schema` → `createTripSchema`, `loginSchema`, `updateProfileSchema`.

---

## 7. Client-Side Patterns

### Hooks

- All hooks in `src/hooks/`, one hook per file, named `use{Feature}.ts`.
- Every hook must start with `'use client';` directive.
- Return shape convention: `{ data, status, error, actions }` where applicable.
- API calls use `apiRequest<T>(url, options)` from `@/lib/api-client`.
- Error extraction uses `getApiErrorMessage(payload, fallbackMessage)`.

### Components

- Client components must have `'use client';` directive at top.
- Server components (default) must not use hooks, browser APIs, or event handlers.
- All interactive elements must have unique `id` attributes for testing.
- Use CSS variables for theming: `var(--color-primary)`, `var(--color-text)`, `var(--color-surface)`, etc.
- Accessibility: all buttons have `type="button"` or `type="submit"`, images have `alt`, icons in buttons have `aria-label`.

### Client API Calls

```typescript
const { response, data } = await apiRequest<ResponseType>('/api/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
if (!response.ok) {
  const msg = getApiErrorMessage(data, 'Fallback error message');
  // handle error
}
```

---

## 8. Auth & Middleware

### Auth Flow

1. Login → JWT signed with `signAuthToken()` → set as HttpOnly cookie `auth_token` (7-day expiry).
2. Logout → clear cookie.
3. Protected routes: Middleware checks JWT via `getAuthUserId(request)` → redirects to `/?auth=login` if missing.
4. API routes: `getAuthUserFull(request)` extracts user from JWT cookie. Falls back to `x-user-id` header in test env only.

### Protected Routes

Defined in `middleware.ts` via `PROTECTED_PREFIXES`:
- `/profile`
- `/trips`
- `/schedule-reference`

### Rules

- `x-user-id` and `x-forwarded-user` headers are stripped in non-test environments by middleware.
- Debug routes (`/api/debug/*`) return 404 in production.
- Never store user data in `localStorage` — use in-memory only (`src/lib/user.ts`).

---

## 9. Testing

### Configuration

- Vitest config: `vitest.config.ts` at project root.
- Setup file: `tests/setupEnv.ts` (loads test environment variables).
- Path alias: `@` → `src/`.
- Tests run sequentially (`fileParallelism: false`).

### Structure

```
tests/
├── lib/                # Unit tests for src/lib/*
│   ├── auth.test.ts
│   ├── rate-limit.test.ts
│   └── validations/
├── api/                # API route handler tests
│   └── auth/
├── integration/        # Integration tests (DB, Redis)
└── setupEnv.ts
```

### Rules

- Test files mirror source path: `src/lib/auth.ts` → `tests/lib/auth.test.ts`.
- Never place test files inside `src/`.
- Use `describe` / `it` / `expect` from Vitest.
- Mock DB/Redis via `src/lib/db/mocks.ts` for unit tests.
- Integration tests use real MongoDB/Redis (separate `.env.test`).

### Commands

```bash
npm run test           # vitest run (all tests)
npm run test:ui        # vitest --ui (interactive)
npm run test:coverage  # vitest run --coverage
npm run typecheck      # tsc --noEmit
npm run lint           # eslint .
```

---

## 10. Styling

### CSS Variables

All theming uses CSS custom properties defined in `src/app/globals.css`:

```
--color-primary, --color-primary-dark, --color-primary-lightest
--color-text, --color-text-secondary
--color-surface, --color-bg, --color-border
--color-success, --color-danger, --color-warning
```

### Rules

- Use CSS variables (`var(--color-*)`) instead of hardcoded Tailwind color classes.
- Tailwind utility classes are acceptable for layout, spacing, typography.
- No inline `style` objects unless dynamic values require it.
- Responsive: mobile-first approach using Tailwind breakpoints (`sm:`, `md:`, `lg:`, `xl:`).

---

## 11. Content & Localization

- All user-facing text is in **Vietnamese**.
- Error messages from Zod validations and API responses use Vietnamese.
- Default locale: `vi-VN`. Default currency: `VND`.
- Date formatting uses `toLocaleDateString('vi-VN', options)`.
- Vietnamese text normalization: use `normalizeVietnameseText()` and `removeVietnameseTones()` from `@/lib/string.ts`. Do not duplicate these functions.

---

## 12. Import Rules

### Order

1. External packages (`next`, `react`, `zod`, `mongoose`, etc.)
2. Internal absolute imports (`@/lib/...`, `@/components/...`, `@/hooks/...`, `@/types/...`, `@/data/...`)
3. Relative imports (`./`, `../`)

### Path Aliases

- `@/*` → `./src/*` (defined in `tsconfig.json`).
- Always use `@/` prefix for cross-module imports.
- Use relative imports only within the same module directory.

### Barrel Exports

| Barrel | Scope | Usage |
|---|---|---|
| `@/lib/db` | All DB types, models, connections, collections | API routes, server utilities |
| `@/lib/db/mocks` | Mock DB/Redis for tests only | Test files only |
| `@/types` | All domain types | Components, hooks, pages |
| `@/lib/index` | Client-safe utilities | Client components |
| `@/lib/validations/validation` | All validation schemas | Optional barrel |

### Forbidden Imports

- `@/lib/db` in Edge Middleware or client components.
- `@/lib/db/mocks` in any non-test file.
- `@/lib/db/mock-db`, `@/lib/db/mock-redis`, `@/lib/db/mock-data` directly — use `@/lib/db/mocks` barrel.
- `fs`, `path`, `process.cwd()` in any file imported by Edge Middleware.

---

## 13. Git & Code Quality

### Commit Discipline

- Run `npm run typecheck` and `npm run test` before committing.
- All TypeScript errors must be resolved — no `// @ts-ignore` or `// @ts-expect-error` without documented reason.

### ESLint

- Config: `eslint.config.mjs` using `eslint-config-next` (core-web-vitals + typescript).
- `@typescript-eslint/no-explicit-any` is OFF (legacy accommodation).
- React compiler rules (set-state-in-effect, immutability, purity, preserve-manual-memoization) are OFF.

### TypeScript

- `strict: true` enabled.
- `jsx: react-jsx` (no React import needed).
- `moduleResolution: bundler`.
- No `any` in new code — use `unknown` and narrow with type guards.

---

## 14. Environment Variables

Required variables (see `.env.example`):

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | JWT signing secret |
| `RESEND_API_KEY` | Resend email service key |
| `WEBHOOK_SECRET` | Admin webhook authentication |
| `NEXT_PUBLIC_APP_URL` | Public app URL |

### Rules

- Never hardcode secrets in source code.
- Never commit `.env` — only `.env.example` and `.env.test.example`.
- Access env vars via `process.env.VARIABLE_NAME` — no custom env loader in app code.

---

## 15. Performance & Security

### Security

- JWT in HttpOnly cookie only — never expose tokens to client JS.
- Rate limiting on login (8 attempts / 15 min per IP+email), OTP send, and search.
- Input validation on every API endpoint via Zod.
- Debug/admin routes blocked in production by middleware.
- Webhook requires `x-webhook-secret` header (not query string).
- Passwords hashed with bcrypt.

### Performance

- Redis cache for external API responses (places, POI, weather).
- Pagination on all list endpoints (default: 20 items, max: 100).
- `next/image` for all images with proper `sizes` attribute.
- No client-side data in localStorage — in-memory only.

---

## 16. Do NOT

- Do not create new folders at project root without documented reason.
- Do not add new dependencies without checking existing ones first.
- Do not define utility functions locally in route/component files if they can be shared — extract to `src/lib/`.
- Do not duplicate Vietnamese text normalization — use `@/lib/string.ts`.
- Do not duplicate date parsing — use `@/lib/date.ts`.
- Do not use `fetch()` directly in client code — use `apiRequest()` from `@/lib/api-client`.
- Do not return raw `Response` or `NextResponse.json()` in API routes — use `sendSuccess()` / `sendError()`.
- Do not mix server and client code in the same file.
- Do not import test utilities or mocks in production code.
