import { useMemo } from 'react';

import { isProfileComplete } from '@/domain/profiles';
import { useMyProfile } from '@/hooks/useMyProfile';

export function useRequireCompletedProfile() {
  const profileQuery = useMyProfile();

  const profileComplete = useMemo(
    () => isProfileComplete(profileQuery.data),
    [profileQuery.data],
  );

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    isProfileComplete: profileComplete,
    error: profileQuery.error,
  };
}

