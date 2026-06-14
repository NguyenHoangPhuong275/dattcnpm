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

## Fix Pass 2
- `src/app/trips/page.tsx` - restored Vietnamese UI/toast text and updated TripCard import.
- `src/components/profile/CreateTripModal.tsx` - restored Vietnamese modal labels, actions, placeholders, and date error text.
- `src/components/profile/MyTripsSection.tsx` - restored Vietnamese button and empty-state text and updated TripCard import.
- `src/components/profile/PersonalInfoForm.tsx` - restored Vietnamese avatar/help/form text and fixed corrupted gender labels.
- `src/components/trips/AddToTripModal.tsx` - restored Vietnamese modal text and updated TripCard import.
- `src/components/trip/TripCard.tsx` - promoted to canonical TripCard implementation and restored Vietnamese card labels.
- `src/components/trips/TripCard.tsx` - removed duplicate TripCard implementation.
- `src/app/api/profile/route.ts` - fixed avatar base64 byte-size validation and restored Vietnamese API errors.
- `src/app/api/reviews/route.ts` - restored duplicate-review API error text.
- `src/app/api/trips/[id]/itinerary/route.ts` - restored itinerary API errors and only validates changed day values on PATCH.
- `src/app/globals.css` - bridged semantic brand tokens to the existing primary palette.
- `src/components/ui/CardSkeleton.tsx` and `src/components/ui/PageSkeleton.tsx` - verified/expanded skeleton variants including `horizontal`.
- `src/components/ui/LoadingSpinner.tsx` - restored Vietnamese accessible loading label.
- `src/hooks/useAddToTrip.ts`, `src/hooks/useMyTrips.ts`, `src/hooks/useTripList.ts` - restored Vietnamese user-facing error messages.
- `src/lib/validations/profile.ts` and `src/lib/validations/trip.ts` - restored Vietnamese validation messages.

## Fix Pass 2 Verification
- `npx tsc --noEmit` - passed.
- `npm run lint` - passed.
- `npm test` - 12 files passed, 23 tests passed.
