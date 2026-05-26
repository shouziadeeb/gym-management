import type { GeoCoordinates, RecommendationContext } from './types';
import type { GymCardPresentation } from './types';

import { metersBetween } from './distance';

function normalizeHints(value?: string | null): string[] {
  if (!value?.trim()) return [];
  const tokens = value
    .toLowerCase()
    .split(/[^a-zA-Z]+/u)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  return Array.from(new Set(tokens));
}

/**
 * Lightweight deterministic scoring engineered for personalization today and AI substitution tomorrow.
 */
export function computePersonalizationScore(card: GymCardPresentation, ctx: RecommendationContext): number {
  let score = 0;

  const profileHints = normalizeHints(ctx.profile?.fitness_goal);
  profileHints.forEach((hint) => {
    card.categories.forEach((category) => {
      const normalized = category.toLowerCase();
      if (normalized.includes(hint)) {
        score += 3;
      }
    });
    if (normalizeHints(card.subtitle).some((fragment) => fragment.includes(hint))) {
      score += 1;
    }
  });

  const cityHint = ctx.profile?.city?.trim()?.toLowerCase();
  const addressHints = normalizeHints(card.addressLine);
  if (cityHint && addressHints.some((chunk) => chunk.includes(cityHint))) {
    score += 5;
  }

  ctx.searchHistory.slice(0, 8).forEach((term) => {
    const needle = term.toLowerCase().trim();
    if (!needle) return;

    const haystack = `${card.name} ${card.categories.join(' ')} ${card.addressLine ?? ''}`.toLowerCase();
    if (haystack.includes(needle)) {
      score += 2;
    }
  });

  ctx.favoriteCategoryHints.forEach((slug) => {
    if (!slug) return;
    if (card.categories.some((category) => category.toLowerCase() === slug.toLowerCase())) {
      score += 4;
    }
  });

  if (typeof card.ratingAvg === 'number' && Number.isFinite(card.ratingAvg)) {
    score += Math.min(card.ratingAvg / 5, 1) * 4;
  }

  if (typeof card.popularityScore === 'number' && Number.isFinite(card.popularityScore)) {
    score += Math.min(Math.log10(card.popularityScore + 1), 6);
  }

  if (typeof card.distanceMeters === 'number' && Number.isFinite(card.distanceMeters)) {
    score += proximityBoost(ctx.userCoords, card.latitude, card.longitude, card.distanceMeters);
  } else if (
    ctx.userCoords &&
    typeof card.latitude === 'number' &&
    typeof card.longitude === 'number' &&
    Number.isFinite(card.latitude) &&
    Number.isFinite(card.longitude)
  ) {
    score += proximityBoost(
      ctx.userCoords,
      card.latitude,
      card.longitude,
      metersBetween(ctx.userCoords, card.latitude, card.longitude),
    );
  }

  if (ctx.recentlyViewedIds.includes(card.id)) {
    score -= 6;
  }

  return score;
}

function proximityBoost(
  coords: GeoCoordinates | null,
  lat: number | null,
  lng: number | null,
  distanceMeters: number | null,
): number {
  if (!coords || lat === null || lng === null) return 0;

  const meters =
    typeof distanceMeters === 'number' && Number.isFinite(distanceMeters) ? distanceMeters : metersBetween(coords, lat, lng);

  if (!Number.isFinite(meters)) return 0;
  const normalized = meters / 5_000;

  const boost = Math.max(0, 5 - normalized);
  return boost;
}

export function inferFavoriteCategories(ctx: RecommendationContext): string[] {
  const hinted = [...ctx.favoriteCategoryHints];

  hinted.push(...normalizeHints(ctx.profile?.fitness_goal));
  hinted.push(...ctx.searchHistory.flatMap(normalizeHints));

  return Array.from(new Set(hinted)).slice(0, 12);
}
