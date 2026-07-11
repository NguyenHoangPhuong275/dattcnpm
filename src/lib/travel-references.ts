import {
  TRAVEL_REFERENCES,
  type TravelReferenceSlug,
} from '@/data/travel-references';
import { ROUTES } from '@/lib/constants';
import {
  getTourismDestinationsByRegion,
  type TourismDestination,
} from '@/lib/vietnam-tourism';

export function getTravelReference(slug: string) {
  return slug in TRAVEL_REFERENCES
    ? TRAVEL_REFERENCES[slug as TravelReferenceSlug]
    : null;
}

export function getTravelReferenceHref(slug: TravelReferenceSlug): string {
  return `${ROUTES.travelReferences}/${slug}`;
}

export function getPlannerDestinationHref(destination: string): string {
  return `${ROUTES.home}?q=${encodeURIComponent(destination)}#planner`;
}

export function getTravelReferencePageData(slug: string): {
  reference: NonNullable<ReturnType<typeof getTravelReference>>;
  destinations: TourismDestination[];
} | null {
  const reference = getTravelReference(slug);
  if (!reference) return null;
  return {
    reference,
    destinations: getTourismDestinationsByRegion(reference.region),
  };
}
