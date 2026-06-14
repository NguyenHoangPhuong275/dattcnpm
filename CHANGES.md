# Refactor Report

## Summary
- Added a shared design-token/font baseline with Inter and Be Vietnam Pro.
- Centralized trip list response parsing and introduced shared loading/empty UI states.
- Tightened core trip, itinerary, review, share, and avatar business rules.
- Improved trip list UX states, create-trip validation, avatar upload constraints, and card keyboard behavior.

## Modified
- `src/app/globals.css` - semantic tokens and global font setup.
- `tailwind.config.ts` - Tailwind content/font configuration.
- `src/lib/validations/trip.ts` - date range validation for create/update trip schemas.
- `src/lib/validations/profile.ts` - avatar MIME and size constraints.
- `src/app/api/trips/[id]/route.ts` - safe date conversion during trip updates.
- `src/app/api/trips/[id]/itinerary/route.ts` - prevents itinerary items on past/out-of-trip dates.
- `src/app/api/trips/[id]/share/route.ts` - returns `expiresInHours` with share metadata.
- `src/app/api/reviews/route.ts` - prevents duplicate root reviews per user/place.
- `src/app/api/profile/route.ts` - server-side avatar data URL and byte-size validation.
- `src/hooks/useMyTrips.ts`, `src/hooks/useAddToTrip.ts`, `src/hooks/useHomepageTripActions.ts` - shared trip extraction and safer loading/create flows.
- `src/components/trips/TripCard.tsx` - selectable state and better keyboard/click semantics.
- `src/components/trips/AddToTripModal.tsx`, `src/components/profile/MyTripsSection.tsx`, `src/components/profile/CreateTripModal.tsx`, `src/components/profile/PersonalInfoForm.tsx`, `src/app/trips/page.tsx` - skeletons, empty states, loading buttons, labels, and validation states.

## Created
- `src/lib/trip-formatters.ts`
- `src/hooks/useTripList.ts`
- `src/components/ui/LoadingSpinner.tsx`
- `src/components/ui/CardSkeleton.tsx`
- `src/components/ui/PageSkeleton.tsx`
- `src/components/ui/EmptyState.tsx`
- `src/components/trip/TripCard.tsx`

## Verification
- `npm run typecheck` - passed.
- `npm run lint` - passed.
- `npm test` - 12 files passed, 23 tests passed.
