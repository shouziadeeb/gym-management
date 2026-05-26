import { useMemo } from 'react';

import type { GeoCoordinates } from '@/domain/discovery/types';

import { useMyProfile } from '@/hooks/useMyProfile';
import { useUserCoordinates } from '@/hooks/useUserCoordinates';

/** Prefer foreground GPS when granted; otherwise fall back to onboarding “home pin” on the profile. */
export function useDiscoveryCoordinates() {
  const geo = useUserCoordinates();
  const profileQuery = useMyProfile();

  const fusedCoords = useMemo<GeoCoordinates | null>(() => {
    if (geo.coords && Number.isFinite(geo.coords.latitude) && Number.isFinite(geo.coords.longitude)) {
      return geo.coords;
    }

    const lat = profileQuery.data?.home_latitude;
    const lng = profileQuery.data?.home_longitude;

    if (typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng)) {
      return { latitude: lat, longitude: lng };
    }

    return null;
  }, [geo.coords, profileQuery.data?.home_latitude, profileQuery.data?.home_longitude]);

  return { geo, fusedCoords };
}
