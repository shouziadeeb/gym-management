import type { ExploreSortMode } from '@/constants/gym-discovery';

import type { GeoCoordinates, GymCardPresentation } from './types';
import { formatDistanceLabel, metersBetween } from './distance';

export function annotateDistance(
  gyms: GymCardPresentation[],
  coords: GeoCoordinates | null,
): GymCardPresentation[] {
  if (!coords) return gyms;

  return gyms.map((gym) => {
    if (typeof gym.latitude !== 'number' || typeof gym.longitude !== 'number') {
      return { ...gym, distanceMeters: null, distanceLabel: null };
    }

    const meters = metersBetween(coords, gym.latitude, gym.longitude);
    return {
      ...gym,
      distanceMeters: meters,
      distanceLabel: formatDistanceLabel(meters),
    };
  });
}

function compareNumberDesc(a?: number | null, b?: number | null): number {
  const av = typeof a === 'number' && Number.isFinite(a) ? a : 0;
  const bv = typeof b === 'number' && Number.isFinite(b) ? b : 0;
  return bv - av;
}

function compareDistanceAsc(a: GymCardPresentation, b: GymCardPresentation): number {
  const au = typeof a.distanceMeters === 'number' && Number.isFinite(a.distanceMeters) ? a.distanceMeters : Number.POSITIVE_INFINITY;
  const bu = typeof b.distanceMeters === 'number' && Number.isFinite(b.distanceMeters) ? b.distanceMeters : Number.POSITIVE_INFINITY;
  return au - bu;
}

/**
 * Canonical ordering primitives used by Explore + Home rails.
 * "Recommended" leverages personalizationScore then deterministic fallbacks.
 */
export function sortGymCards(mode: ExploreSortMode, gyms: GymCardPresentation[]): GymCardPresentation[] {
  const next = gyms.slice();

  switch (mode) {
    case 'nearest':
      return next.sort((a, b) => compareDistanceAsc(a, b));
    case 'top_rated':
      return next.sort((a, b) => compareNumberDesc(a.ratingAvg, b.ratingAvg) || compareDistanceAsc(a, b));
    case 'popular':
      return next.sort((a, b) => compareNumberDesc(a.popularityScore, b.popularityScore) || compareNumberDesc(a.ratingAvg, b.ratingAvg));
    case 'trending':
      return next.sort((a, b) => compareNumberDesc(a.trendingScore, b.trendingScore) || compareNumberDesc(a.activeMemberCount, b.activeMemberCount));
    case 'newest':
      return next; // Preserve creation order injected upstream (created_at desc).
    case 'recommended':
    default:
      return next.sort((a, b) => {
        const scoreCmp = compareNumberDesc(a.personalizationScore ?? 0, b.personalizationScore ?? 0);
        if (scoreCmp !== 0) return scoreCmp;
        const pop = compareNumberDesc(a.popularityScore, b.popularityScore);
        if (pop !== 0) return pop;
        return compareNumberDesc(a.ratingAvg, b.ratingAvg);
      });
  }
}
