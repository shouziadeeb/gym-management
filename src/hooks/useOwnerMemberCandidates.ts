import { useQuery } from '@tanstack/react-query';

import { fetchOwnerMemberCandidates } from '@/api/member-requests.api';
import { queryKeys } from '@/api/queries/keys';

type Input = {
  gymId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export function useOwnerMemberCandidates({ gymId, search, page = 1, pageSize = 20 }: Input) {
  return useQuery({
    queryKey: queryKeys.members.ownerCandidates(gymId, search, page, pageSize),
    queryFn: () => fetchOwnerMemberCandidates({ gymId: gymId!, search, page, pageSize }),
    enabled: Boolean(gymId),
  });
}
