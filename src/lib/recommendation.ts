export type UserPreferences = {
  interests?: string[] | null;
  travelStyles?: string[] | null;
  budgetLevel?: string | null;
};

export type ScorablePlace = {
  tags?: string[] | null;
  type?: string | null;
  priceLevel?: string | null;
  ratingAvg?: number;
  ratingCount?: number;
};

const INTEREST_WEIGHT = 2;
const STYLE_WEIGHT = 1;
const BUDGET_WEIGHT = 1;

export function hasPreferences(prefs: UserPreferences | null | undefined): boolean {
  if (!prefs) return false;
  return Boolean(prefs.interests?.length || prefs.travelStyles?.length || prefs.budgetLevel);
}

export function scorePlace(place: ScorablePlace, prefs: UserPreferences): number {
  const tags = new Set<string>((place.tags ?? []).map((t) => t.toLowerCase()));
  if (place.type) tags.add(place.type.toLowerCase());

  let score = 0;
  for (const interest of prefs.interests ?? []) {
    if (tags.has(interest.toLowerCase())) score += INTEREST_WEIGHT;
  }
  for (const style of prefs.travelStyles ?? []) {
    if (tags.has(style.toLowerCase())) score += STYLE_WEIGHT;
  }
  if (prefs.budgetLevel && place.priceLevel && prefs.budgetLevel === place.priceLevel) {
    score += BUDGET_WEIGHT;
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
