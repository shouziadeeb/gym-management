/**
 * UX copy + heuristic defaults for marketplace discovery surfaces.
 * Server-side aggregates (rating, popularity) remain authoritative via Supabase columns.
 */

export const GYM_PAGE_SIZE_EXPLORE = 16;

/** Single fetch used by the Home dashboard to assemble rails without N+1 queries. */
export const GYM_HOME_CATALOG_LIMIT = 180;

/** Hard cap when sorting by geo until PostGIS proximity RPC ships. */
export const GYM_NEAREST_FETCH_CAP = 220;

/** Debounced Explore search aligned with hooks/useDebouncedValue default. */
export const EXPLORE_SEARCH_DEBOUNCE_MS = 320;

export const PROMO_CAMPAIGNS = [
  {
    id: 'summer-strong',
    title: 'Summer strength kickoff',
    subtitle: 'Lock member pricing early at partner gyms.',
    tone: '#16a34a',
  },
  {
    id: 'nearby-push',
    title: 'Nearby training hub',
    subtitle: 'Explore trainers and classes near your commute.',
    tone: '#0ea5e9',
  },
  {
    id: 'elite-coaching',
    title: 'Coaching tiers',
    subtitle: 'Studios curated for individualized programming.',
    tone: '#a855f7',
  },
] as const;

/** Seed taxonomy surfaced when DB categories[] is sparse (owners can remap later). */
export const FALLBACK_CATEGORY_SLUGS = [
  'strength',
  'conditioning',
  'crossfit',
  'yoga',
  'pilates',
  'hiit',
  'boxing',
  'wellness',
] as const;

export const PRICE_PRESETS_INR_MONTHLY_MIN = [
  { id: 'any', label: 'Any budget', maxCents: null as number | null },
  { id: 'lite', label: 'Under ₹1.5k', maxCents: 150_000 },
  { id: 'standard', label: 'Under ₹3k', maxCents: 300_000 },
  { id: 'premium', label: 'Under ₹6k', maxCents: 600_000 },
] as const;

export const RATING_FILTERS = [
  { id: 'any', label: 'Any rating', min: 0 },
  { id: '4', label: '4.0+', min: 4 },
  { id: '45', label: '4.5+', min: 4.5 },
] as const;

export type ExploreSortMode = 'recommended' | 'nearest' | 'top_rated' | 'popular' | 'trending' | 'newest';

export const EXPLORE_SORT_VALUES: ExploreSortMode[] = [
  'recommended',
  'nearest',
  'top_rated',
  'popular',
  'trending',
  'newest',
];

export const EXPLORE_SORT_LABELS: Record<ExploreSortMode, string> = {
  recommended: 'Recommended',
  nearest: 'Nearest',
  top_rated: 'Top rated',
  popular: 'Most popular',
  trending: 'Trending',
  newest: 'Newest',
};

export const DEFAULT_EXPLORE_SORT: ExploreSortMode = 'recommended';

export function parseExploreSortMode(value: unknown): ExploreSortMode {
  if (typeof value === 'string' && (EXPLORE_SORT_VALUES as readonly string[]).includes(value)) {
    return value as ExploreSortMode;
  }
  return DEFAULT_EXPLORE_SORT;
}