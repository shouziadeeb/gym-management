import { useQuery } from '@tanstack/react-query';

import { fetchMyProfile } from '@/api/profiles.api';
import { useAuthStore } from '@/store/auth.store';

export function useMyProfile() {
  const userId = useAuthStore((state) => state.session?.user.id);

  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchMyProfile(userId!),
    enabled: Boolean(userId),
  });
}

