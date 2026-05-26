import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getAllGymImageUrls } from '@/api/gym-images.api';
import { fetchDiscoveryCatalog } from '@/api/gyms-discovery.api';
import { queryKeys } from '@/api/queries/keys';

import { GYM_HOME_CATALOG_LIMIT } from '@/constants/gym-discovery';
import {
  annotateDistance,
  buildHomeGymList,
  mapGymsToPresentation,
  withPersonalization,
} from '@/domain/discovery';
import type { Gym } from '@/types/models';

import { useDiscoverySignals } from '@/hooks/useDiscoverySignals';
import { useDiscoveryCoordinates } from '@/hooks/useDiscoveryCoordinates';

export function useHomeDiscovery() {
  const { geo, fusedCoords } = useDiscoveryCoordinates();
  const signals = useDiscoverySignals();

  const catalogQuery = useQuery({
    queryKey: queryKeys.gyms.discoveryCatalog(GYM_HOME_CATALOG_LIMIT),
    queryFn: () => fetchDiscoveryCatalog(GYM_HOME_CATALOG_LIMIT),
  });

  const recommendationCtx = useMemo(
    () => signals.buildRecommendationContext(fusedCoords),
    [signals.buildRecommendationContext, fusedCoords],
  );

  const imageResolver = useCallback((gym: Gym) => getAllGymImageUrls(gym), []);

  const catalogCards = useMemo(() => {
    if (!catalogQuery.data) return [];

    return annotateDistance(mapGymsToPresentation(catalogQuery.data, imageResolver), fusedCoords);
  }, [catalogQuery.data, fusedCoords, imageResolver]);

  const personalizedCards = useMemo(
    () => withPersonalization(catalogCards, recommendationCtx),
    [catalogCards, recommendationCtx],
  );

  const gyms = useMemo(() => buildHomeGymList(personalizedCards), [personalizedCards]);

  const loading = catalogQuery.isLoading || signals.isLoading;

  const error = catalogQuery.error ?? signals.error;

  const refresh = useCallback(async () => {
    await Promise.all([catalogQuery.refetch(), signals.refetch()]);
  }, [catalogQuery, signals]);

  return {
    gyms,
    loading,
    error,
    refresh,
    isRefetching: catalogQuery.isRefetching || signals.isRefetching,
    geo,
    catalogQuery,
  };
}
