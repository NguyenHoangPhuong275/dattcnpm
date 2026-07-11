import { INTEREST_MATCH_TERMS, STYLE_MATCH_TERMS } from '@/data/travel-preferences';
import { normalizeVietnameseText } from '@/lib/string';
import {
  normalizeBudgetLevel,
  normalizeTravelInterest,
  normalizeTravelStyle,
} from '@/lib/travel-preferences';

export type UserPreferences = {
  interests?: string[] | null;
  travelStyles?: string[] | null;
  budgetLevel?: string | null;
  preferredDestinations?: string[] | null;
};

export type ScorablePlace = {
  name?: string | null;
  address?: string | null;
  tags?: string[] | null;
  type?: string | null;
  priceLevel?: string | null;
  ratingAvg?: number;
  ratingCount?: number;
};

const INTEREST_WEIGHT = 2;
const STYLE_WEIGHT = 1;
const BUDGET_WEIGHT = 1;
const DESTINATION_WEIGHT = 3;

function normalizeTerm(value: string): string {
  return normalizeVietnameseText(value).replace(/\s+/g, ' ');
}

function hasMatchingTerm(placeTerms: Set<string>, matchTerms: readonly string[]): boolean {
  return matchTerms.some((term) => placeTerms.has(normalizeTerm(term)));
}

export function hasPreferences(prefs: UserPreferences | null | undefined): boolean {
  if (!prefs) return false;
  return Boolean(
    prefs.interests?.length
    || prefs.travelStyles?.length
    || prefs.budgetLevel
    || prefs.preferredDestinations?.length,
  );
}

export function scorePlace(place: ScorablePlace, prefs: UserPreferences): number {
  const placeTerms = new Set<string>((place.tags ?? []).map(normalizeTerm));
  if (place.type) placeTerms.add(normalizeTerm(place.type));

  let score = 0;
  const interests = new Set((prefs.interests ?? []).map((interest) => normalizeTravelInterest(interest) ?? normalizeTerm(interest)));
  for (const interest of interests) {
    const matchTerms = typeof interest === 'string' && interest in INTEREST_MATCH_TERMS
      ? INTEREST_MATCH_TERMS[interest as keyof typeof INTEREST_MATCH_TERMS]
      : [interest];
    if (hasMatchingTerm(placeTerms, matchTerms)) score += INTEREST_WEIGHT;
  }

  const styles = new Set((prefs.travelStyles ?? []).map((style) => normalizeTravelStyle(style) ?? normalizeTerm(style)));
  for (const style of styles) {
    const matchTerms = typeof style === 'string' && style in STYLE_MATCH_TERMS
      ? STYLE_MATCH_TERMS[style as keyof typeof STYLE_MATCH_TERMS]
      : [style];
    if (hasMatchingTerm(placeTerms, matchTerms)) score += STYLE_WEIGHT;
  }

  const preferredBudget = normalizeBudgetLevel(prefs.budgetLevel);
  const placeBudget = normalizeBudgetLevel(place.priceLevel);
  if (preferredBudget && placeBudget && preferredBudget === placeBudget) {
    score += BUDGET_WEIGHT;
  }

  const placeLocation = normalizeTerm([place.name, place.address].filter(Boolean).join(' '));
  const destinations = new Set((prefs.preferredDestinations ?? []).map(normalizeTerm).filter(Boolean));
  for (const destination of destinations) {
    if (placeLocation.includes(destination)) score += DESTINATION_WEIGHT;
  }

  return score;
}

export function rankPlaces<T extends ScorablePlace>(places: T[], prefs: UserPreferences): T[] {
  return [...places]
    .map((place) => ({ place, score: scorePlace(place, prefs) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const popB = (b.place.ratingCount ?? 0) * (b.place.ratingAvg ?? 0);
      const popA = (a.place.ratingCount ?? 0) * (a.place.ratingAvg ?? 0);
      return popB - popA;
    })
    .map((entry) => entry.place);
}
