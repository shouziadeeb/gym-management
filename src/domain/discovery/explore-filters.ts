import type { GymCardPresentation } from './types';

export type ExploreClientFilters = {
  search: string;
  categories: string[];
  ratingMin: number;
  monthlyFeeMaxCents: number | null;
};

export function passesExploreFilters(card: GymCardPresentation, filters: ExploreClientFilters): boolean {
  if (!passesHaystack(card, filters.search)) return false;

  if (!passesCategories(card, filters.categories)) return false;

  if (!passesRating(card, filters.ratingMin)) return false;

  if (!passesMonthlyBudget(card, filters.monthlyFeeMaxCents)) return false;

  return true;
}

function passesHaystack(card: GymCardPresentation, raw: string): boolean {
  const token = raw.trim().toLowerCase();
  if (token.length < 2) return true;

  const haystack = `${card.name} ${card.subtitle ?? ''} ${card.categories.join(' ')}`.toLowerCase();
  return haystack.includes(token);
}

function passesCategories(card: GymCardPresentation, categories: string[]): boolean {
  if (!categories.length) return true;

  const normalizedSelections = categories.map((entry) => entry.trim().toLowerCase()).filter(Boolean);

  return normalizedSelections.some((selection) =>
    card.categories.some((category) => category.trim().toLowerCase() === selection),
  );
}

function passesRating(card: GymCardPresentation, ratingMin: number): boolean {
  if (ratingMin <= 0) return true;
  return card.ratingAvg >= ratingMin - 1e-6;
}

function passesMonthlyBudget(card: GymCardPresentation, ceiling: number | null): boolean {
  if (ceiling === null) return true;
  if (card.monthlyFeeCents === null) return true;
  return card.monthlyFeeCents <= ceiling;
}

export function dedupeMergeGyms<T extends { id: string }>(pages: readonly (readonly T[])[]): T[] {
  const dict = new Map<string, T>();

  for (const page of pages) {
    for (const row of page) {
      dict.set(row.id, row);
    }
  }

  return Array.from(dict.values());
}
