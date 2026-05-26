import { useMemo } from 'react';

import { useMyProfile } from '@/hooks/useMyProfile';
import { useUserGyms } from '@/hooks/useUserGyms';
import { canAccessOwnerDashboard } from '@/domain/roles';

export function useRequireOwner() {
  const profileQuery = useMyProfile();
  const gyms = useUserGyms();

  const allowed = useMemo(
    () =>
      canAccessOwnerDashboard({
        role: profileQuery.data?.role,
        accountType: profileQuery.data?.account_type,
        ownedGymCount: gyms.ownedGyms.length,
      }),
    [profileQuery.data?.role, profileQuery.data?.account_type, gyms.ownedGyms.length],
  );

  return {
    isOwner: allowed,
    isLoading: profileQuery.isLoading || gyms.isLoading,
    profile: profileQuery.data,
  };
}
