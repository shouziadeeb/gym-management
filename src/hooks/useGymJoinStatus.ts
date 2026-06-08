import { useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchUserGymJoinStatus } from '@/api/join.api';
import { queryKeys } from '@/api/queries/keys';
import { useAuthStore } from '@/store/auth.store';

export function useGymJoinStatus(gymId: string | undefined) {
  const userId = useAuthStore((state) => state.session?.user.id);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.join.status(gymId, userId),
    queryFn: () => fetchUserGymJoinStatus(gymId!, userId!),
    enabled: Boolean(gymId && userId),
    staleTime: 30_000,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.join.status(gymId, userId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.gyms.member(userId) });
  };

  return {
    ...query.data,
    isMember: query.data?.isMember ?? false,
    joinRequestStatus: query.data?.joinRequestStatus ?? null,
    requestId: query.data?.requestId ?? null,
    loading: query.isLoading,
    invalidate,
  };
}
