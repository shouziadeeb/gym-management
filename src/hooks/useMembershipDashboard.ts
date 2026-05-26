import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { fetchGymMemberships, refreshGymMembershipStatuses } from '@/api/membership-lifecycle.api';
import { queryKeys } from '@/api/queries/keys';
import { type MembershipDashboardFilter, type MembershipDashboardSort } from '@/domain/memberships';
import type { Membership } from '@/types/models';
import { filterMemberships, sortMemberships } from '@/utils/membership';

type DashboardSummary = {
  active: number;
  expiring: number;
  expired: number;
};

function buildSummary(rows: Membership[]): DashboardSummary {
  return rows.reduce(
    (acc, row) => {
      if (row.status === 'active') acc.active += 1;
      else if (row.status === 'expiring_soon') acc.expiring += 1;
      else if (row.status === 'expired') acc.expired += 1;
      return acc;
    },
    { active: 0, expiring: 0, expired: 0 },
  );
}

export function useMembershipDashboard(gymId?: string) {
  const [filter, setFilter] = useState<MembershipDashboardFilter>('all');
  const [sortBy, setSortBy] = useState<MembershipDashboardSort>('expiry_nearest');

  const query = useQuery({
    queryKey: queryKeys.memberships.byGym(gymId),
    queryFn: async () => {
      await refreshGymMembershipStatuses(gymId!);
      return fetchGymMemberships(gymId!);
    },
    enabled: Boolean(gymId),
  });

  const memberships = query.data ?? [];

  const visibleMemberships = useMemo(() => {
    const filtered = filterMemberships(memberships, filter);
    return sortMemberships(filtered, sortBy);
  }, [filter, sortBy, memberships]);

  const summary = useMemo(() => buildSummary(memberships), [memberships]);

  return {
    ...query,
    filter,
    setFilter,
    sortBy,
    setSortBy,
    memberships,
    visibleMemberships,
    summary,
  };
}
