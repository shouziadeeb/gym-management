import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

import { fetchMyProfile } from '@/api/profiles.api';
import { QUERY_RETRY_COUNT } from '@/constants/query';
import { inferFavoriteCategories } from '@/domain/discovery/recommendation';
import type { RecommendationContext } from '@/domain/discovery/types';
import type { Profile } from '@/types/models';

import { readFavoriteCategories, readRecentGymIds, readSearchHistory } from '@/services/discovery/preferences.storage';
import { useAuthStore } from '@/store/auth.store';

const bundleKey = ['discovery', 'personalization-bundle'] as const;

export type DiscoveryPersonalizationBundle = {
  profile: Profile | null;
  recentlyViewedIds: string[];
  searchHistory: string[];
  favoriteCategorySlugs: string[];
};

export async function loadDiscoveryPersonalizationBundle(userId?: string): Promise<DiscoveryPersonalizationBundle> {
  const [recentlyViewedIds, favoriteSlugs, searchHistory] = await Promise.all([
    readRecentGymIds(),
    readFavoriteCategories(),
    readSearchHistory(),
  ]);

  let profile: Profile | null = null;

  if (userId) {
    try {
      profile = await fetchMyProfile(userId);
    } catch {
      profile = null;
    }
  }

  return {
    profile,
    recentlyViewedIds,
    searchHistory,
    favoriteCategorySlugs: favoriteSlugs,
  };
}

export function useDiscoverySignals() {
  const userId = useAuthStore((state) => state.session?.user?.id);

  const query = useQuery({
    queryKey: [...bundleKey, userId ?? 'guest'],
    queryFn: () => loadDiscoveryPersonalizationBundle(userId ?? undefined),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: QUERY_RETRY_COUNT,
    placeholderData: (previousData) => previousData,
  });

  const buildRecommendationContext = useCallback(
    (coords: RecommendationContext['userCoords']): RecommendationContext => {
      const partial: RecommendationContext = {
        userCoords: coords,
        profile: query.data?.profile ?? null,
        recentlyViewedIds: query.data?.recentlyViewedIds ?? [],
        favoriteCategoryHints: query.data?.favoriteCategorySlugs ?? [],
        searchHistory: query.data?.searchHistory ?? [],
      };

      return {
        ...partial,
        favoriteCategoryHints: inferFavoriteCategories(partial),
      };
    },
    [query.data],
  );

  return {
    ...query,
    buildRecommendationContext,
  };
}
