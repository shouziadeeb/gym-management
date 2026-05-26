import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { fetchOwnerGymMemberSummary } from '@/api/owner-members.api';
import { queryKeys } from '@/api/queries/keys';
import { useMemberSearch } from '@/hooks/useMemberSearch';
import { useMembers } from '@/hooks/useMembers';
import { useMyProfile } from '@/hooks/useMyProfile';
import { useUserGyms } from '@/hooks/useUserGyms';
import { canAccessOwnerDashboard } from '@/domain/roles';

export function useOwnerDashboard() {
  const profileQuery = useMyProfile();
  const gyms = useUserGyms();
  const activeGymId = gyms.ownedGyms[0]?.id;
  const memberSearch = useMemberSearch(20);

  const membersQuery = useMembers({
    gymId: activeGymId,
    search: memberSearch.debouncedSearch,
    status: memberSearch.status,
    page: memberSearch.page,
    pageSize: memberSearch.pageSize,
  });

  const summaryQuery = useQuery({
    queryKey: queryKeys.members.ownerSummary(activeGymId),
    queryFn: () => fetchOwnerGymMemberSummary(activeGymId!),
    enabled: Boolean(activeGymId),
  });

  const isOwnerAllowed = canAccessOwnerDashboard({
    role: profileQuery.data?.role,
    accountType: profileQuery.data?.account_type,
    ownedGymCount: gyms.ownedGyms.length,
  });

  const totalMembers = membersQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalMembers / memberSearch.pageSize));

  return {
    profile: profileQuery.data,
    ownedGyms: gyms.ownedGyms,
    activeGymId,
    isOwnerAllowed,
    members: membersQuery.data?.rows ?? [],
    membersQuery,
    summary: summaryQuery.data ?? {
      total_members: 0,
      active_memberships: 0,
      expiring_memberships: 0,
      expired_memberships: 0,
    },
    summaryQuery,
    search: memberSearch.search,
    setSearch: memberSearch.setSearch,
    status: memberSearch.status,
    setStatus: memberSearch.setStatus,
    page: memberSearch.page,
    totalPages,
    nextPage: () => memberSearch.nextPage(totalMembers),
    prevPage: memberSearch.prevPage,
    isLoading: membersQuery.isLoading || summaryQuery.isLoading || profileQuery.isLoading || gyms.isLoading,
    hasError: Boolean(membersQuery.error || summaryQuery.error || profileQuery.error || gyms.error),
    error: membersQuery.error ?? summaryQuery.error ?? profileQuery.error ?? gyms.error,
    isEmpty: !membersQuery.isLoading && (membersQuery.data?.rows.length ?? 0) === 0,
    paginationLabel: useMemo(() => `Page ${memberSearch.page} of ${totalPages}`, [memberSearch.page, totalPages]),
  };
}
