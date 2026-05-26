import { useQuery } from '@tanstack/react-query';

import { fetchOwnerGymMembers } from '@/api/owner-members.api';
import { queryKeys } from '@/api/queries/keys';

type UseMembersInput = {
  gymId?: string;
  search?: string;
  status?: 'all' | 'active' | 'expiring_soon' | 'expired';
  page?: number;
  pageSize?: number;
};

export function useMembers({ gymId, search, status = 'all', page = 1, pageSize = 20 }: UseMembersInput) {
  return useQuery({
    queryKey: queryKeys.members.ownerSearch(gymId, search, status, page, pageSize),
    queryFn: () =>
      fetchOwnerGymMembers({
        gymId: gymId!,
        search,
        status,
        page,
        pageSize,
      }),
    enabled: Boolean(gymId),
  });
}
