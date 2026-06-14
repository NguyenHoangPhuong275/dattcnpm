# Changes

- Removed production test-account bypasses from auth and MongoDB user helpers.
- Added test-only user helper, debug route secret guard, and locked-user enforcement helper.
- Split MongoDB implementation into `src/lib/db/**` modules with `src/lib/mongodb.ts` as a barrel export.
- Added paginated collections, Trip indexes, public trips discovery, cascade trip cleanup, shared trip response formatting, and review rating recalculation.
- Hardened trip `coverImage` validation with http/https URL checks and added validation tests.
- Updated environment examples for removed test account envs, `TEST_USER_*`, and `DEBUG_SECRET`.
