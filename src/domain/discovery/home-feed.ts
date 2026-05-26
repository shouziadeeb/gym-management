import { sortGymCards } from './sorting';
import type { GymCardPresentation } from './types';

export type MembershipPlanHighlight = {
  id: string;
  gymId: string;
  gymName: string;
  planLabel: string;
  pricingLabel: string;
};

export type PromoHomeSection = {
  key: 'promo-static';
  variant: 'hero';
};

export type RailHomeSection = {
  key: 'recommended' | 'nearby' | 'featured' | 'trending' | 'top-rated' | 'recent';
  title: string;
  subtitle?: string;
  items: GymCardPresentation[];
};

export type CategoriesHomeSection = {
  key: 'categories';
  categories: string[];
};

export type MembershipHighlightsSection = {
  key: 'membership-highlights';
  plans: MembershipPlanHighlight[];
};

export type HomeFeedSection =
  | PromoHomeSection
  | RailHomeSection
  | CategoriesHomeSection
  | MembershipHighlightsSection;

export function buildMembershipHighlights(cards: GymCardPresentation[], limit = 8): MembershipPlanHighlight[] {
  const popularFirst = [...cards].sort((a, b) => b.popularityScore - a.popularityScore || b.ratingAvg - a.ratingAvg);

  const highlights: MembershipPlanHighlight[] = [];
  const seen = new Set<string>();

  for (const card of popularFirst) {
    if (highlights.length >= limit) break;
    const keyBase = `${card.id}:${card.monthlyFeeCents ?? 'na'}`;
    if (seen.has(keyBase)) continue;
    if (card.monthlyFeeCents === null) continue;

    seen.add(keyBase);
    highlights.push({
      id: keyBase,
      gymId: card.id,
      gymName: card.name,
      planLabel: 'Monthly membership',
      pricingLabel: card.monthlyFeeLabel,
    });
  }

  return highlights;
}

/**
 * Single home list: every catalog gym once, ordered by personalized "recommended" ranking.
 * Sorting/filter rails (nearby, top rated, etc.) live on Explore only.
 */
export function buildHomeGymList(personalized: GymCardPresentation[]): GymCardPresentation[] {
  const sorted = sortGymCards('recommended', personalized);
  const seen = new Set<string>();
  const unique: GymCardPresentation[] = [];

  for (const card of sorted) {
    if (seen.has(card.id)) continue;
    seen.add(card.id);
    unique.push(card);
  }

  return unique;
}

