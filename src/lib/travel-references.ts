import {
  TRAVEL_REFERENCES,
  TRAVEL_REFERENCE_SLUGS,
  type TravelReference,
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
  return `${ROUTES.home}?q=${encodeURIComponent(destination)}&select=1#planner`;
}

export function getDestinationDetailHref(destinationId: string): string {
  return `${ROUTES.destinations}/${encodeURIComponent(destinationId)}`;
}

export type RelatedTravelReference = TravelReference & { slug: TravelReferenceSlug };

export function getLatestTravelReferences(limit = 6): RelatedTravelReference[] {
  return TRAVEL_REFERENCE_SLUGS
    .map((slug) => ({ slug, ...TRAVEL_REFERENCES[slug] }))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit);
}

export function formatReferenceDate(publishedAt: string): string {
  const date = new Date(`${publishedAt}T00:00:00`);
  if (Number.isNaN(date.getTime())) return publishedAt;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function getRelatedTravelReferences(slug: string, limit = 3): RelatedTravelReference[] {
  const current = getTravelReference(slug);
  if (!current) return [];

  const others = TRAVEL_REFERENCE_SLUGS.filter((candidate) => candidate !== slug);
  const sameRegion = others.filter((candidate) => TRAVEL_REFERENCES[candidate].region === current.region);
  const rest = others.filter((candidate) => TRAVEL_REFERENCES[candidate].region !== current.region);

  return [...sameRegion, ...rest]
    .slice(0, limit)
    .map((candidate) => ({ slug: candidate, ...TRAVEL_REFERENCES[candidate] }));
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
