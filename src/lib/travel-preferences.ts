import {
  BUDGET_LEVEL_ALIASES,
  TRAVEL_INTEREST_ALIASES,
  TRAVEL_STYLE_ALIASES,
} from '@/data/travel-preferences';
import { normalizeVietnameseText } from '@/lib/string';
import type { BudgetLevel, TravelInterestCode, TravelStyleCode } from '@/types/profile';

function normalizePreferenceKey(value: string): string {
  return normalizeVietnameseText(value)
    .replace(/[&+/_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function normalizeList<T>(
  values: readonly string[] | null | undefined,
  normalizeValue: (value: string | null | undefined) => T | null,
): T[] {
  const result: T[] = [];
  const seen = new Set<T>();
  for (const value of values ?? []) {
    const normalized = normalizeValue(value);
    if (normalized === null || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}

export function normalizeBudgetLevel(value: string | null | undefined): BudgetLevel | null {
  if (!value?.trim()) return null;
  return BUDGET_LEVEL_ALIASES[normalizePreferenceKey(value)] ?? null;
}

export function normalizeTravelStyle(value: string | null | undefined): TravelStyleCode | null {
  if (!value?.trim()) return null;
  return TRAVEL_STYLE_ALIASES[normalizePreferenceKey(value)] ?? null;
}

export function normalizeTravelInterest(value: string | null | undefined): TravelInterestCode | null {
  if (!value?.trim()) return null;
  return TRAVEL_INTEREST_ALIASES[normalizePreferenceKey(value)] ?? null;
}

export function normalizeTravelStyles(values: readonly string[] | null | undefined): TravelStyleCode[] {
  return normalizeList(values, normalizeTravelStyle);
}

export function normalizeTravelInterests(values: readonly string[] | null | undefined): TravelInterestCode[] {
  return normalizeList(values, normalizeTravelInterest);
}
