import type { ExploreSortMode } from '@/constants/gym-discovery';
import type { Gym } from '@/types/models';
import type { Profile } from '@/types/models';

export type GeoCoordinates = {
  latitude: number;
  longitude: number;
};

/** Normalized Gym row plus optional personalization features (future-proof for vendors / AI). */
export type DiscoveryGym = Gym & {
  latitude?: number | null;
  longitude?: number | null;
  rating_avg?: number | null;
  review_count?: number | null;
  active_member_count?: number | null;
  popularity_score?: number | null;
  trending_score?: number | null;
  categories?: string[] | null;
  is_active?: boolean | null;
};

export type GymCardPresentation = {
  id: string;
  name: string;
  subtitle: string | null;
  /** Primary thumbnail — first of `imageUrls`. */
  imageUrl: string | null;
  /** All displayable gym photos (logo + gallery). */
  imageUrls: string[];
  addressLine: string | null;
  categories: string[];
  ratingAvg: number;
  reviewCount: number;
  activeMemberCount: number;
  monthlyFeeCents: number | null;
  monthlyFeeLabel: string;
  latitude: number | null;
  longitude: number | null;
  popularityScore: number;
  trendingScore: number;
  personalizationScore?: number | null;
  isActiveListing: boolean;
  distanceLabel: string | null;
  distanceMeters: number | null;
};

export type RecommendationContext = {
  userCoords: GeoCoordinates | null;
  profile: Profile | null;
  recentlyViewedIds: readonly string[];
  favoriteCategoryHints: readonly string[];
  searchHistory: readonly string[];
};

/** Strategy pattern hook for plugging ML / vendor scoring later without rewriting UI. */
export type RecommendationRankingStrategy = (
  gyms: GymCardPresentation[],
  context: RecommendationContext,
) => GymCardPresentation[];

export type PaginatedDiscoveryResult = {
  items: Gym[];
  total?: number | null;
};

export type GymExploreFilters = {
  search: string;
  categories: string[];
  ratingMin: number;
  monthlyFeeMaxCents: number | null;
  sort: ExploreSortMode;
};
