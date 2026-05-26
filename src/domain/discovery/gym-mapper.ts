import { FALLBACK_CATEGORY_SLUGS } from '@/constants/gym-discovery';
import type { Gym } from '@/types/models';
import { formatInrFromCents, parseGymSettings } from '@/utils/gym-settings';

import type { DiscoveryGym, GymCardPresentation, RecommendationContext } from './types';
import { computePersonalizationScore } from './recommendation';

function normalizeCategories(gym: DiscoveryGym): string[] {
  const fromColumn = Array.isArray(gym.categories) ? gym.categories : [];
  if (fromColumn.length) {
    return fromColumn.map((c) => c.trim()).filter(Boolean);
  }

  const settings = parseGymSettings(gym.settings);
  if (settings.gymType?.trim()) {
    return [settings.gymType.trim()];
  }

  const seedIndex = Math.abs(hashStringToInt(gym.id)) % FALLBACK_CATEGORY_SLUGS.length;
  return [FALLBACK_CATEGORY_SLUGS[seedIndex]!];
}

function hashStringToInt(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickMonthlyFeeCents(gym: Gym): number | null {
  const settings = parseGymSettings(gym.settings);
  const monthly = settings.membershipPlans?.monthlyFeeCents;
  if (typeof monthly === 'number' && Number.isFinite(monthly)) {
    return monthly;
  }
  return null;
}

function effectiveTrendingScore(gym: DiscoveryGym): number {
  const column = typeof gym.trending_score === 'number' && Number.isFinite(gym.trending_score) ? gym.trending_score : 0;
  if (column > 0) return column;

  const updated = Date.parse(gym.updated_at);
  if (!Number.isFinite(updated)) return 0;

  const hours = Math.max(1, (Date.now() - updated) / 3_600_000);
  return 10_000 / hours;
}

export function toGymCardPresentation(gym: DiscoveryGym, imageUrls: readonly string[]): GymCardPresentation {
  const urls = imageUrls.filter((url) => url.trim().length > 0);
  const monthlyFeeCents = pickMonthlyFeeCents(gym);
  const ratingAvg = typeof gym.rating_avg === 'number' && Number.isFinite(gym.rating_avg) ? gym.rating_avg : 0;
  const reviewCount = typeof gym.review_count === 'number' && Number.isFinite(gym.review_count) ? gym.review_count : 0;
  const activeMemberCount =
    typeof gym.active_member_count === 'number' && Number.isFinite(gym.active_member_count) ? gym.active_member_count : 0;
  const popularityScore =
    typeof gym.popularity_score === 'number' && Number.isFinite(gym.popularity_score) ? gym.popularity_score : 0;

  const lat = typeof gym.latitude === 'number' && Number.isFinite(gym.latitude) ? gym.latitude : null;
  const lng = typeof gym.longitude === 'number' && Number.isFinite(gym.longitude) ? gym.longitude : null;

  const isActiveListing = typeof gym.is_active === 'boolean' ? gym.is_active : true;

  return {
    id: gym.id,
    name: gym.name.trim(),
    subtitle: gym.description?.trim() ? gym.description.trim() : null,
    imageUrls: [...urls],
    imageUrl: urls[0] ?? null,
    addressLine: gym.address?.trim() ? gym.address.trim() : null,
    categories: normalizeCategories(gym),
    ratingAvg,
    reviewCount,
    activeMemberCount,
    monthlyFeeCents,
    monthlyFeeLabel: monthlyFeeCents !== null ? formatInrFromCents(monthlyFeeCents) : formatInrFromCents(undefined),
    latitude: lat,
    longitude: lng,
    popularityScore,
    trendingScore: effectiveTrendingScore(gym),
    isActiveListing,
    distanceLabel: null,
    distanceMeters: null,
  };
}

export function mapGymsToPresentation(
  gyms: DiscoveryGym[],
  resolver: (gym: DiscoveryGym) => readonly string[],
): GymCardPresentation[] {
  return gyms.map((gym) => toGymCardPresentation(gym, resolver(gym)));
}

export function withPersonalization(cards: GymCardPresentation[], context: RecommendationContext): GymCardPresentation[] {
  return cards.map((card) => ({
    ...card,
    personalizationScore: computePersonalizationScore(card, context),
  }));
}
