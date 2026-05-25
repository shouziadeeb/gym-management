import { useMemo } from 'react';

import { useMyProfile } from '@/hooks/useMyProfile';

export function useRequireCompletedProfile() {
  const profileQuery = useMyProfile();

  const isProfileComplete = useMemo(() => {
    const profile = profileQuery.data;
    if (!profile) return false;
    return Boolean(profile.onboarding_completed && profile.full_name?.trim() && profile.phone);
  }, [profileQuery.data]);

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    isProfileComplete,
    error: profileQuery.error,
  };
}

