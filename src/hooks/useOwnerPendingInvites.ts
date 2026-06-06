import { useQuery } from '@tanstack/react-query';

import { fetchOwnerPendingInvites } from '@/api/member-requests.api';
import { queryKeys } from '@/api/queries/keys';

export function useOwnerPendingInvites(gymId?: string) {
  return useQuery({
    queryKey: queryKeys.members.ownerPendingInvites(gymId),
    queryFn: () => fetchOwnerPendingInvites(gymId!),
    enabled: Boolean(gymId),
  });
}
