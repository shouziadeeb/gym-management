import { useCallback, useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { getAllGymImageUrls } from '@/api/gym-images.api';
import {
  fetchDiscoveryCatalog,
  fetchExplorePage,
  fetchGeocodableGyms,
  type ExploreFetchInput,
} from '@/api/gyms-discovery.api';
import { queryKeys } from '@/api/queries/keys';

import { FALLBACK_CATEGORY_SLUGS, GYM_PAGE_SIZE_EXPLORE } from '@/constants/gym-discovery';
import type { ExploreSortMode } from '@/constants/gym-discovery';
import {
  annotateDistance,
  dedupeMergeGyms,
  mapGymsToPresentation,
  passesExploreFilters,
  sortGymCards,
  withPersonalization,
} from '@/domain/discovery';
import type { ExploreClientFilters } from '@/domain/discovery/explore-filters';
import type { GymCardPresentation } from '@/domain/discovery/types';
import type { Gym } from '@/types/models';

import { useDiscoverySignals } from '@/hooks/useDiscoverySignals';
import { useDiscoveryCoordinates } from '@/hooks/useDiscoveryCoordinates';

type Params = ExploreClientFilters & {
  sort: ExploreSortMode;
  debouncedSearch: string;
};

function buildExploreFiltersKey(payload: ExploreFetchInput): string {
  return JSON.stringify({
    sort: payload.sort,
    search: payload.search ?? '',
    categories: [...(payload.categories ?? [])].sort(),
    ratingMin: payload.ratingMin ?? 0,
  });
}

export function useExploreMarketplace(params: Params) {
  const { geo, fusedCoords } = useDiscoveryCoordinates();
  const personalization = useDiscoverySignals();

  const finiteMode = params.sort === 'nearest' || params.sort === 'recommended';

  const infiniteFiltersKey = buildExploreFiltersKey({
    page: 0,
    pageSize: GYM_PAGE_SIZE_EXPLORE,
    categories: params.categories,
    ratingMin: params.ratingMin,
    search: params.debouncedSearch,
    sort: params.sort,
  });

  const batchKey = params.sort === 'nearest' ? `nearest:${geo.coordsKey ?? 'pending'}` : 'recommended-batch';

  const finiteSourceQuery = useQuery({
    queryKey: queryKeys.gyms.nearestBatch(batchKey),
    enabled: finiteMode,
    queryFn: async () =>
      params.sort === 'nearest' ? fetchGeocodableGyms() : fetchDiscoveryCatalog(),
  });

  const pagedExploreQuery = useInfiniteQuery({
    queryKey: queryKeys.gyms.exploreInfinite(infiniteFiltersKey),
    enabled: !finiteMode,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      fetchExplorePage({
        page: pageParam,
        pageSize: GYM_PAGE_SIZE_EXPLORE,
        categories: params.categories,
        ratingMin: params.ratingMin,
        search: params.debouncedSearch,
        sort: params.sort,
      }),
    getNextPageParam: (lastPage, pages) => {
      if (!lastPage.items.length || lastPage.items.length < GYM_PAGE_SIZE_EXPLORE) return undefined;

      return pages.length;
    },
  });

  const flattenedGyms = useMemo(() => {
    if (finiteMode) return (finiteSourceQuery.data ?? []) as Gym[];

    const pages = (pagedExploreQuery.data?.pages ?? []).map((page) => page.items);
    return dedupeMergeGyms<Gym>(pages);
  }, [finiteMode, finiteSourceQuery.data, pagedExploreQuery.data]);

  const imageResolver = useCallback((gym: Gym) => getAllGymImageUrls(gym), []);

  const recommendationCtx = useMemo(
    () => personalization.buildRecommendationContext(fusedCoords),
    [personalization.buildRecommendationContext, fusedCoords],
  );

  const distanceFallback = params.sort === 'nearest' && !fusedCoords;

  const effectiveSort: ExploreSortMode = distanceFallback ? 'popular' : params.sort;

  const processedCards = useMemo<GymCardPresentation[]>(() => {
    let rows = mapGymsToPresentation(flattenedGyms, imageResolver);

    rows = rows.filter((card) =>
      passesExploreFilters(card, {
        search: params.search,
        categories: params.categories,
        ratingMin: params.ratingMin,
        monthlyFeeMaxCents: params.monthlyFeeMaxCents,
      }),
    );

    let hydrated = annotateDistance(rows, fusedCoords);

    if (params.sort === 'recommended') {
      hydrated = withPersonalization(hydrated, recommendationCtx);
    }

    return sortGymCards(effectiveSort, hydrated);
  }, [
    effectiveSort,
    flattenedGyms,
    imageResolver,
    params.categories,
    params.monthlyFeeMaxCents,
    params.ratingMin,
    params.search,
    params.sort,
    fusedCoords,
    recommendationCtx,
  ]);

  const [finiteWindow, setFiniteWindow] = useState(GYM_PAGE_SIZE_EXPLORE);

  useEffect(() => {
    setFiniteWindow(GYM_PAGE_SIZE_EXPLORE);
  }, [
    params.monthlyFeeMaxCents,
    params.ratingMin,
    params.sort,
    params.search,
    params.categories.join('|'),
    params.debouncedSearch,
  ]);

  const windowedCards = finiteMode ? processedCards.slice(0, finiteWindow) : processedCards;

  const fetchNextWindow = useCallback(() => {
    if (finiteMode) {
      setFiniteWindow((prev) => prev + GYM_PAGE_SIZE_EXPLORE);
      return;
    }

    if (pagedExploreQuery.hasNextPage && !pagedExploreQuery.isFetchingNextPage) {
      void pagedExploreQuery.fetchNextPage();
    }
  }, [
    finiteMode,
    pagedExploreQuery.fetchNextPage,
    pagedExploreQuery.hasNextPage,
    pagedExploreQuery.isFetchingNextPage,
  ]);

  const isInitialLoading = finiteMode ? finiteSourceQuery.isLoading : pagedExploreQuery.isLoading;
  const isRefetching = finiteMode ? finiteSourceQuery.isRefetching : pagedExploreQuery.isRefetching;
  const fetchNextBusy = finiteMode ? false : pagedExploreQuery.isFetchingNextPage;

  const hasMore = finiteMode ? finiteWindow < processedCards.length : Boolean(pagedExploreQuery.hasNextPage);

  const error = finiteMode ? finiteSourceQuery.error : pagedExploreQuery.error;

  const refetch = useCallback(async () => {
    if (finiteMode) {
      await finiteSourceQuery.refetch();
      return;
    }

    await pagedExploreQuery.refetch();
  }, [finiteMode, finiteSourceQuery.refetch, pagedExploreQuery.refetch]);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>(FALLBACK_CATEGORY_SLUGS);

    flattenedGyms.forEach((gym) => {
      const fromColumn = Array.isArray(gym.categories) ? gym.categories : [];
      fromColumn.forEach((entry) => {
        if (typeof entry === 'string' && entry.trim()) {
          set.add(entry.trim());
        }
      });
    });

    return Array.from(set).slice(0, 32);
  }, [flattenedGyms]);

  return {
    cards: windowedCards,
    totalMatched: processedCards.length,
    isInitialLoading,
    isRefetching,
    fetchNextBusy,
    hasMore,
    fetchNext: fetchNextWindow,
    refetch,
    error,
    geo,
    distanceFallbackActive: Boolean(params.sort === 'nearest' && distanceFallback && !isInitialLoading),
    categoryOptions,
  };
}
