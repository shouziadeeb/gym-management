import { useQuery } from '@tanstack/react-query';

import { fetchIncomingMemberRequests } from '@/api/member-requests.api';
import { queryKeys } from '@/api/queries/keys';

export function useMemberRequests(memberId?: string) {
  return useQuery({
    queryKey: queryKeys.members.memberRequests(memberId),
    queryFn: () => fetchIncomingMemberRequests(memberId!),
    enabled: Boolean(memberId),
  });
}
